/* eslint-disable @typescript-eslint/no-require-imports */
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const createLoader = require('./load-typescript.cjs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://thilogi_admin:thilogi%40322@127.0.0.1:5433/thilogi_db';

const pool = new Pool({ connectionString: DATABASE_URL });
const load = createLoader({
  '@/server/db': { pool },
});

const quotationService = load('src/server/modules/quotation/quotation.service.ts');
const roadRatesService = load('src/server/modules/master-data/road-rates.service.ts');
const rateLookupService = load('src/server/modules/supplier-pricing/rate-lookup.service.ts');
const versionService = load('src/server/modules/quotation/version.service.ts');

const salesActor = {
  userId: '1911420',
  fullName: 'Trịnh Anh Tuấn',
  username: '1911420',
  role: 'SALES',
  regionScopes: ['*'],
};

const pricingManagerActor = {
  userId: 'NV0001',
  fullName: 'Bùi Trần Nhân Nghiêm',
  username: 'NV0001',
  role: 'PRICING_MANAGER',
  regionScopes: ['*'],
};

const directorActor = {
  userId: '25040585',
  fullName: 'Lê Phước Yến Vy',
  username: '25040585',
  role: 'DIRECTOR',
  regionScopes: ['*'],
};

const createdQuoteIds = [];

after(async () => {
  // Clean up any test quotations created during integration test suite
  if (createdQuoteIds.length > 0) {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM quotation_item_cost_components WHERE quotation_id = ANY($1::uuid[])', [createdQuoteIds]);
      await client.query('DELETE FROM quotation_buy_snapshots WHERE quotation_id = ANY($1::uuid[])', [createdQuoteIds]);
      await client.query('DELETE FROM quotation_service_items WHERE quotation_id = ANY($1::uuid[])', [createdQuoteIds]);
      await client.query('DELETE FROM quotation_approval_log WHERE quotation_id = ANY($1::uuid[])', [createdQuoteIds]);
      await client.query('DELETE FROM customer_quotations WHERE quotation_id = ANY($1::uuid[])', [createdQuoteIds]);
    } catch {
      // ignore
    } finally {
      client.release();
    }
  }
  await pool.end();
});

describe('THILOGI ERP - 20 Integration Scenarios on PostgreSQL', () => {

  // Kịch bản 1: Khởi tạo báo giá đường bộ thuần (Trucking) với 1 nhà xe hợp lệ
  test('Kịch bản 1: Khởi tạo báo giá TRUCKING hợp lệ -> Lưu thành công, đúng snapshot và margin', async () => {
    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'TRUCKING',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'BB-HBI',
        destinationLocationId: 'GLA-TPA',
        equipmentType: '40HC',
        plannedQuantity: 2,
        unit: 'Chuyến',
        selectedBuyRateId: '70c6c0a7-3f88-2870-2cc5-a4b900398999',
        unitSellPrice: 7000000,
        totalSellPrice: 14000000,
        unitBuyPrice: 5500000,
        worstCaseBuyPrice: 5500000,
        totalBuyAmount: 11000000,
        itemGp: 3000000,
        itemMarginPercent: 21.43,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    assert.match(res.quotationNo, /^QT-2026-\d{5}$/);
    assert.equal(res.status, 'DRAFT');
    createdQuoteIds.push(res.quotationId);

    const client = await pool.connect();
    try {
      const snap = await client.query('SELECT * FROM quotation_buy_snapshots WHERE quotation_id = $1', [res.quotationId]);
      assert.equal(snap.rows.length, 1);
      assert.equal(Number(snap.rows[0].rate_amount_vnd), 5500000);
      assert.equal(snap.rows[0].cost_source_type, 'VENDOR');
    } finally {
      client.release();
    }
  });

  // Kịch bản 2: Tra cứu đường bộ nhiều nhà xe cùng tuyến
  test('Kịch bản 2: Tra cứu đường bộ nhiều nhà xe -> trả về candidates hợp lệ', async () => {
    const lookup = await rateLookupService.lookupRoadRates({
      pickupLocationId: 'BB-HBI',
      deliveryLocationId: 'GLA-TPA',
      equipmentType: '40HC',
      pricingDate: '2026-06-01',
    }, pool);

    assert.ok(['APPLY', 'MULTIPLE_CANDIDATES'].includes(lookup.status));
    assert.ok(lookup.candidates.length >= 1);
    assert.equal(lookup.candidates[0].currency, 'VND');
  });

  // Kịch bản 3: Hai biểu cước cùng 1 nhà xe, cùng tuyến, cùng loại cont trùng daterange
  test('Kịch bản 3: Biểu cước đường bộ trùng lấn daterange -> Bị chặn bởi PostgreSQL exclusion constraint', async () => {
    const existing = await pool.query('SELECT lower(validity_range)::text as vfrom, upper(validity_range)::text as vto, vendor_id, pickup_location_id, delivery_location_id, equipment_type FROM road_rates WHERE status=\'APPROVED\' LIMIT 1');
    assert.ok(existing.rows.length > 0);
    const row = existing.rows[0];

    await assert.rejects(
      roadRatesService.saveRoadRateService({
        vendorId: row.vendor_id,
        pickupLocationId: row.pickup_location_id,
        deliveryLocationId: row.delivery_location_id,
        equipmentType: row.equipment_type,
        buyRate: 999000,
        currency: 'VND',
        validFrom: row.vfrom || '2026-01-01',
        validTo: '2028-12-31',
        status: 'APPROVED',
      }, directorActor),
      /trùng lấn|exclusion/i
    );
  });

  // Kịch bản 4: Tuyến đường không có biểu cước active -> Báo MISSING_RATE
  test('Kịch bản 4: Tuyến đường không có biểu cước -> MISSING_RATE', async () => {
    const lookup = await rateLookupService.lookupRoadRates({
      pickupLocationId: 'CNNSA',
      deliveryLocationId: 'JIAHAO',
      equipmentType: '40HR',
      pricingDate: '2026-06-01',
    }, pool);

    assert.equal(lookup.status, 'MISSING_RATE');
    assert.equal(lookup.candidates.length, 0);
  });

  // Kịch bản 5: Dịch vụ Cảng Chu Lai cho cont lạnh 40HR -> LOLO + THC_PORT
  test('Kịch bản 5: Cảng Chu Lai cont lạnh 40HR -> Tự động tính LOLO (750k) + THC_PORT (125 USD x FX) = 3.931.250 VND', async () => {
    const lolo40hr = await pool.query('SELECT rate_id FROM port_rates WHERE port_code=\'CHU_LAI\' AND container_type=\'40HR\' AND charge_code=\'LOLO\' AND cargo_type=\'Loaded\' LIMIT 1');
    assert.ok(lolo40hr.rows.length > 0);

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'PORT',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'VNTAP',
        equipmentType: '40HR',
        plannedQuantity: 1,
        unit: 'Cont',
        selectedBuyRateId: lolo40hr.rows[0].rate_id,
        unitSellPrice: 5000000,
        totalSellPrice: 5000000,
        unitBuyPrice: 3931250,
        worstCaseBuyPrice: 3931250,
        totalBuyAmount: 3931250,
        itemGp: 1068750,
        itemMarginPercent: 21.38,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);

    const client = await pool.connect();
    try {
      const comps = await client.query('SELECT * FROM quotation_item_cost_components WHERE quotation_id = $1 ORDER BY cost_code', [res.quotationId]);
      assert.equal(comps.rows.length, 2);
      assert.equal(comps.rows[0].cost_code, 'LOLO');
      assert.equal(Number(comps.rows[0].estimated_cost_vnd), 750000);
      assert.equal(comps.rows[1].cost_code, 'THC_PORT');
      assert.equal(Number(comps.rows[1].estimated_cost_vnd), 3181250);
      assert.equal(res.financials.totalEstimatedBuy, 3931250);
    } finally {
      client.release();
    }
  });

  // Kịch bản 6: Dịch vụ Cảng Chu Lai cho cont thường 20GP -> LOLO 450.000 VND
  test('Kịch bản 6: Cảng Chu Lai cont thường 20GP -> 1 cấu phần LOLO 450k', async () => {
    const lolo20gp = await pool.query('SELECT rate_id FROM port_rates WHERE port_code=\'CHU_LAI\' AND container_type=\'20GP\' AND charge_code=\'LOLO\' AND cargo_type=\'Loaded\' LIMIT 1');
    assert.ok(lolo20gp.rows.length > 0);

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'PORT',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'VNTAP',
        equipmentType: '20GP',
        plannedQuantity: 1,
        unit: 'Cont',
        selectedBuyRateId: lolo20gp.rows[0].rate_id,
        unitSellPrice: 800000,
        totalSellPrice: 800000,
        unitBuyPrice: 450000,
        worstCaseBuyPrice: 450000,
        totalBuyAmount: 450000,
        itemGp: 350000,
        itemMarginPercent: 43.75,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);
    assert.equal(res.financials.totalEstimatedBuy, 450000);
  });

  // Kịch bản 7: Dịch vụ Cửa khẩu Nam Giang -> Tách đủ 3 cấu phần chi phí
  test('Kịch bản 7: Cửa khẩu BORDER_GATE -> Tách 3 cấu phần: Hạ tầng, Bến bãi, Thủ tục kiểm hóa', async () => {
    const border = await pool.query('SELECT rate_id, total_fee FROM border_rates LIMIT 1');
    assert.ok(border.rows.length > 0);
    const bRate = border.rows[0];

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'BORDER_GATE',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'GLA-TPA',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Chuyến',
        selectedBuyRateId: bRate.rate_id,
        unitSellPrice: 3000000,
        totalSellPrice: 3000000,
        unitBuyPrice: Number(bRate.total_fee),
        worstCaseBuyPrice: Number(bRate.total_fee),
        totalBuyAmount: Number(bRate.total_fee),
        itemGp: 3000000 - Number(bRate.total_fee),
        itemMarginPercent: 28.33,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);

    const client = await pool.connect();
    try {
      const comps = await client.query('SELECT * FROM quotation_item_cost_components WHERE quotation_id = $1', [res.quotationId]);
      assert.ok(comps.rows.length >= 2);
      const totalComp = comps.rows.reduce((s, c) => s + Number(c.estimated_cost_vnd), 0);
      assert.equal(totalComp, Number(bRate.total_fee));
    } finally {
      client.release();
    }
  });

  // Kịch bản 8: Dịch vụ Vận tải biển quốc tế OCEAN -> Cước biển USD x FX + Local Charges VND
  test('Kịch bản 8: Vận tải biển OCEAN -> Tách cấu phần Cước biển USD x FX và Phụ phí địa phương VND', async () => {
    const ocean = await pool.query('SELECT rate_id, ocean_freight_usd, total_charges_vnd FROM ocean_rates LIMIT 1');
    assert.ok(ocean.rows.length > 0);
    const oRate = ocean.rows[0];

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'OCEAN',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'CNDLC',
        equipmentType: '40HR',
        plannedQuantity: 1,
        unit: 'Cont',
        selectedBuyRateId: oRate.rate_id,
        unitSellPrice: 30000000,
        totalSellPrice: 30000000,
        unitBuyPrice: Number(oRate.total_charges_vnd),
        worstCaseBuyPrice: Number(oRate.total_charges_vnd),
        totalBuyAmount: Number(oRate.total_charges_vnd),
        itemGp: 30000000 - Number(oRate.total_charges_vnd),
        itemMarginPercent: 23.55,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);

    const client = await pool.connect();
    try {
      const comps = await client.query('SELECT * FROM quotation_item_cost_components WHERE quotation_id = $1', [res.quotationId]);
      assert.ok(comps.rows.some((c) => c.cost_code === 'OCEAN_FREIGHT' && c.original_currency === 'USD'));
      assert.ok(comps.rows.some((c) => c.cost_code === 'LOCAL_CHARGES' && c.original_currency === 'VND'));
    } finally {
      client.release();
    }
  });

  // Kịch bản 9: Dịch vụ Hải quan CUSTOMS -> Đúng chi cục và biểu phí
  test('Kịch bản 9: Dịch vụ Hải quan CUSTOMS -> Lưu đúng chi cục và đơn giá thông quan', async () => {
    const customs = await pool.query('SELECT rate_id, unit_price FROM customs_rates WHERE customs_procedure=\'EXPORT\' LIMIT 1');
    assert.ok(customs.rows.length > 0);
    const cRate = customs.rows[0];

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'CUSTOMS',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'VNTAP',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Tờ khai',
        selectedBuyRateId: cRate.rate_id,
        unitSellPrice: 1200000,
        totalSellPrice: 1200000,
        unitBuyPrice: Number(cRate.unit_price),
        worstCaseBuyPrice: Number(cRate.unit_price),
        totalBuyAmount: Number(cRate.unit_price),
        itemGp: 350000,
        itemMarginPercent: 29.17,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);
    assert.equal(res.financials.totalEstimatedBuy, Number(cRate.unit_price));
  });

  // Kịch bản 10: Dịch vụ Hải quan khác chi cục -> Bị chặn
  test('Kịch bản 10: Dịch vụ Hải quan chọn sai chi cục hải quan -> Bị chặn', async () => {
    const customs = await pool.query('SELECT rate_id FROM customs_rates WHERE customs_office_id=\'VNTAP\' LIMIT 1');
    assert.ok(customs.rows.length > 0);

    await assert.rejects(
      quotationService.saveQuotationDraft({
        customerId: 'THILOGI',
        regionId: 'REG_QNM',
        pricingDate: '2026-06-01',
        paymentTermsDays: 30,
        items: [{
          servicePackage: 'CUSTOMS',
          pricingInclusion: 'INCLUDED',
          originLocationId: 'HO CHI MINH', // Sai chi cục
          destinationLocationId: 'HO CHI MINH',
          equipmentType: '40HC',
          plannedQuantity: 1,
          unit: 'Tờ khai',
          selectedBuyRateId: customs.rows[0].rate_id,
          unitSellPrice: 1200000,
          totalSellPrice: 1200000,
          unitBuyPrice: 850000,
          worstCaseBuyPrice: 850000,
          totalBuyAmount: 850000,
          itemGp: 350000,
          itemMarginPercent: 29.17,
        }],
      }, salesActor),
      /không khớp/i
    );
  });

  // Kịch bản 11: Dịch vụ Kho bãi WAREHOUSING -> Lưu kho theo Tấn.Ngày
  test('Kịch bản 11: Dịch vụ Kho bãi WAREHOUSING -> Lưu cấu phần TON_DAY chuẩn xác', async () => {
    const wh = await pool.query('SELECT rate_id, unit_price FROM warehouse_rates WHERE service_code=\'STORAGE_DRY\' LIMIT 1');
    assert.ok(wh.rows.length > 0);
    const whRate = wh.rows[0];

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'WAREHOUSING',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'VNTAP',
        equipmentType: '40HC',
        plannedQuantity: 100, // 100 Tấn.Ngày
        unit: 'Tấn.Ngày',
        selectedBuyRateId: whRate.rate_id,
        unitSellPrice: 25000,
        totalSellPrice: 2500000,
        unitBuyPrice: Number(whRate.unit_price),
        worstCaseBuyPrice: Number(whRate.unit_price),
        totalBuyAmount: Number(whRate.unit_price) * 100,
        itemGp: 1000000,
        itemMarginPercent: 40.0,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);
    assert.equal(res.financials.totalEstimatedBuy, Number(whRate.unit_price) * 100);
  });

  // Kịch bản 12: Dịch vụ Bảo hiểm hàng hóa INSURANCE -> Tính theo % insuredValue
  test('Kịch bản 12: Bảo hiểm INSURANCE tính theo 0.08% giá trị hàng hóa 2 tỷ -> Phí = 1.600.000 VND', async () => {
    const ins = await pool.query('SELECT rate_id FROM insurance_rates LIMIT 1');
    assert.ok(ins.rows.length > 0);

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'INSURANCE',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'VNTAP',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Lô hàng',
        insuredValue: 2000000000, // 2 tỷ VND
        selectedBuyRateId: ins.rows[0].rate_id,
        unitSellPrice: 2500000,
        totalSellPrice: 2500000,
        unitBuyPrice: 1600000, // 2 tỷ * 0.08% = 1.600.000
        worstCaseBuyPrice: 1600000,
        totalBuyAmount: 1600000,
        itemGp: 900000,
        itemMarginPercent: 36.0,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);
    assert.equal(res.financials.totalEstimatedBuy, 1600000);
  });

  // Kịch bản 13: Dịch vụ Bảo hiểm thiếu insuredValue -> Chặn lưu
  test('Kịch bản 13: Bảo hiểm theo % thiếu insuredValue -> Bị chặn', async () => {
    const ins = await pool.query('SELECT rate_id FROM insurance_rates WHERE pricing_model=\'PERCENT_OF_VALUE\' LIMIT 1');
    assert.ok(ins.rows.length > 0);

    await assert.rejects(
      quotationService.saveQuotationDraft({
        customerId: 'THILOGI',
        regionId: 'REG_QNM',
        pricingDate: '2026-06-01',
        paymentTermsDays: 30,
        items: [{
          servicePackage: 'INSURANCE',
          pricingInclusion: 'INCLUDED',
          originLocationId: 'VNTAP',
          destinationLocationId: 'VNTAP',
          equipmentType: '40HC',
          plannedQuantity: 1,
          unit: 'Lô hàng',
          insuredValue: 0, // Thiếu giá trị hàng
          selectedBuyRateId: ins.rows[0].rate_id,
          unitSellPrice: 2500000,
          totalSellPrice: 2500000,
          unitBuyPrice: 500000,
          worstCaseBuyPrice: 500000,
          totalBuyAmount: 500000,
          itemGp: 2000000,
          itemMarginPercent: 80.0,
        }],
      }, salesActor),
      /insuredValue/i
    );
  });

  // Kịch bản 14: Dịch vụ Khác OTHER -> Khử trùng / Kiểm dịch thực vật
  test('Kịch bản 14: Dịch vụ khác OTHER (Kiểm dịch/Khử trùng) -> Lưu đúng cấu phần', async () => {
    const other = await pool.query('SELECT rate_id, unit_price FROM other_rates WHERE service_code=\'QUARANTINE\' LIMIT 1');
    assert.ok(other.rows.length > 0);
    const oRate = other.rows[0];

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'OTHER',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'VNTAP',
        destinationLocationId: 'VNTAP',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Lô',
        selectedBuyRateId: oRate.rate_id,
        unitSellPrice: 500000,
        totalSellPrice: 500000,
        unitBuyPrice: Number(oRate.unit_price),
        worstCaseBuyPrice: Number(oRate.unit_price),
        totalBuyAmount: Number(oRate.unit_price),
        itemGp: 150000,
        itemMarginPercent: 30.0,
      }],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);
    assert.equal(res.financials.totalEstimatedBuy, Number(oRate.unit_price));
  });

  // Kịch bản 15: Báo giá đa dịch vụ kết hợp (Combined Package: Trucking + Port + Customs)
  test('Kịch bản 15: Gói đa dịch vụ kết hợp -> Tổng Worst-case BUY tính đúng SUM các cấu phần bắt buộc', async () => {
    const [portRate, customsRate] = await Promise.all([
      pool.query('SELECT rate_id, unit_price FROM port_rates WHERE container_type=\'20GP\' AND cargo_type=\'Loaded\' LIMIT 1'),
      pool.query('SELECT rate_id, unit_price FROM customs_rates WHERE customs_procedure=\'EXPORT\' LIMIT 1'),
    ]);

    const truckingBuyRate = 5500000;
    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [
        {
          servicePackage: 'TRUCKING',
          pricingInclusion: 'INCLUDED',
          originLocationId: 'BB-HBI',
          destinationLocationId: 'GLA-TPA',
          equipmentType: '40HC',
          plannedQuantity: 1,
          unit: 'Chuyến',
          selectedBuyRateId: '70c6c0a7-3f88-2870-2cc5-a4b900398999',
          unitSellPrice: 8000000,
          totalSellPrice: 8000000,
          unitBuyPrice: truckingBuyRate,
          worstCaseBuyPrice: truckingBuyRate,
          totalBuyAmount: truckingBuyRate,
          itemGp: 2500000,
          itemMarginPercent: 31.25,
        },
        {
          servicePackage: 'PORT',
          pricingInclusion: 'INCLUDED',
          originLocationId: 'VNTAP',
          destinationLocationId: 'VNTAP',
          equipmentType: '20GP',
          plannedQuantity: 1,
          unit: 'Cont',
          selectedBuyRateId: portRate.rows[0].rate_id,
          unitSellPrice: 1000000,
          totalSellPrice: 1000000,
          unitBuyPrice: Number(portRate.rows[0].unit_price),
          worstCaseBuyPrice: Number(portRate.rows[0].unit_price),
          totalBuyAmount: Number(portRate.rows[0].unit_price),
          itemGp: 550000,
          itemMarginPercent: 55.0,
        },
        {
          servicePackage: 'CUSTOMS',
          pricingInclusion: 'INCLUDED',
          originLocationId: 'VNTAP',
          destinationLocationId: 'VNTAP',
          equipmentType: '20GP',
          plannedQuantity: 1,
          unit: 'Tờ khai',
          selectedBuyRateId: customsRate.rows[0].rate_id,
          unitSellPrice: 1500000,
          totalSellPrice: 1500000,
          unitBuyPrice: Number(customsRate.rows[0].unit_price),
          worstCaseBuyPrice: Number(customsRate.rows[0].unit_price),
          totalBuyAmount: Number(customsRate.rows[0].unit_price),
          itemGp: 650000,
          itemMarginPercent: 43.33,
        },
      ],
    }, salesActor);

    assert.equal(res.success, true);
    createdQuoteIds.push(res.quotationId);

    const expectedTotalBuy = truckingBuyRate + Number(portRate.rows[0].unit_price) + Number(customsRate.rows[0].unit_price);
    assert.equal(res.financials.totalEstimatedBuy, expectedTotalBuy);
    assert.equal(res.financials.totalWorstCaseBuy, expectedTotalBuy);
  });

  // Kịch bản 16: Trình duyệt báo giá thiếu giá mua đầu vào -> Bị chặn
  test('Kịch bản 16: Trình duyệt khi có dòng thiếu BUY rate -> Chặn submit với lỗi MISSING RATE', async () => {
    // Lưu báo giá draft không có selectedBuyRateId
    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'TRUCKING',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'BB-HBI',
        destinationLocationId: 'GLA-TPA',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Chuyến',
        selectedBuyRateId: null, // Thiếu rate
        unitSellPrice: 5000000,
        totalSellPrice: 5000000,
        unitBuyPrice: 0,
        worstCaseBuyPrice: 0,
        totalBuyAmount: 0,
        itemGp: 5000000,
        itemMarginPercent: 100,
      }],
    }, salesActor);

    createdQuoteIds.push(res.quotationId);

    const submitRes = await quotationService.submitQuotationForApproval(res.quotationId, salesActor);
    assert.equal(submitRes.success, false);
    assert.match(submitRes.error, /MISSING RATE/i);
  });

  // Kịch bản 17: Trình duyệt báo giá hợp lệ -> Trạng thái PENDING_APPROVAL
  test('Kịch bản 17: Trình duyệt báo giá hợp lệ -> Chuyển sang PENDING_APPROVAL và ghi audit log', async () => {
    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'TRUCKING',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'BB-HBI',
        destinationLocationId: 'GLA-TPA',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Chuyến',
        selectedBuyRateId: '70c6c0a7-3f88-2870-2cc5-a4b900398999',
        unitSellPrice: 8000000,
        totalSellPrice: 8000000,
        unitBuyPrice: 5500000,
        worstCaseBuyPrice: 5500000,
        totalBuyAmount: 5500000,
        itemGp: 2500000,
        itemMarginPercent: 31.25,
      }],
    }, salesActor, true); // submit = true

    assert.equal(res.success, true);
    assert.equal(res.status, 'PENDING_APPROVAL');
    createdQuoteIds.push(res.quotationId);

    const quote = await pool.query('SELECT status FROM customer_quotations WHERE quotation_id=$1', [res.quotationId]);
    assert.equal(quote.rows[0].status, 'PENDING_APPROVAL');
  });

  // Kịch bản 18: Nguyên tắc 4 mắt (Four-Eyes Principle) -> Người lập tự duyệt chính mình bị chặn
  test('Kịch bản 18: Người lập báo giá tự phê duyệt chính mình -> Bị chặn bởi Four-Eyes Principle', async () => {
    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'TRUCKING',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'BB-HBI',
        destinationLocationId: 'GLA-TPA',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Chuyến',
        selectedBuyRateId: '70c6c0a7-3f88-2870-2cc5-a4b900398999',
        unitSellPrice: 8000000,
        totalSellPrice: 8000000,
        unitBuyPrice: 5500000,
        worstCaseBuyPrice: 5500000,
        totalBuyAmount: 5500000,
        itemGp: 2500000,
        itemMarginPercent: 31.25,
      }],
    }, pricingManagerActor, true); // pricingManager tạo và submit

    createdQuoteIds.push(res.quotationId);

    // Chính pricingManager tự approve báo giá của mình -> Phải bị từ chối
    const appRes = await quotationService.approveQuotation(res.quotationId, pricingManagerActor, 'Tự duyệt');
    assert.equal(appRes.success, false);
    assert.match(appRes.error, /Four-Eyes Principle|nguyên tắc 4 mắt/i);
  });

  // Kịch bản 19: Phê duyệt Margin < 15% mà không có comment giải trình -> Bị chặn
  test('Kịch bản 19: Phê duyệt Margin < 15% không có lý do giải trình -> Bị chặn', async () => {
    const buyPrice = 5500000;
    const sellPrice = Math.round(buyPrice / 0.92); // Margin ~ 8%

    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'TRUCKING',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'BB-HBI',
        destinationLocationId: 'GLA-TPA',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Chuyến',
        selectedBuyRateId: '70c6c0a7-3f88-2870-2cc5-a4b900398999',
        unitSellPrice: sellPrice,
        totalSellPrice: sellPrice,
        unitBuyPrice: buyPrice,
        worstCaseBuyPrice: buyPrice,
        totalBuyAmount: buyPrice,
        itemGp: sellPrice - buyPrice,
        itemMarginPercent: 8.0,
      }],
    }, salesActor, true);

    createdQuoteIds.push(res.quotationId);

    // Director duyệt nhưng comment rỗng -> Bị chặn
    const appRes = await quotationService.approveQuotation(res.quotationId, directorActor, '');
    assert.equal(appRes.success, false);
    assert.match(appRes.error, /Lý do phê duyệt ngoại lệ/i);
  });

  // Kịch bản 20: Phê duyệt báo giá hợp lệ & Khóa bất biến & Tạo Version 2
  test('Kịch bản 20: Phê duyệt thành công -> APPROVED, Khóa bất biến, tạo Version 2 thành công', async () => {
    const res = await quotationService.saveQuotationDraft({
      customerId: 'THILOGI',
      regionId: 'REG_QNM',
      pricingDate: '2026-06-01',
      paymentTermsDays: 30,
      items: [{
        servicePackage: 'TRUCKING',
        pricingInclusion: 'INCLUDED',
        originLocationId: 'BB-HBI',
        destinationLocationId: 'GLA-TPA',
        equipmentType: '40HC',
        plannedQuantity: 1,
        unit: 'Chuyến',
        selectedBuyRateId: '70c6c0a7-3f88-2870-2cc5-a4b900398999',
        unitSellPrice: 8000000,
        totalSellPrice: 8000000,
        unitBuyPrice: 5500000,
        worstCaseBuyPrice: 5500000,
        totalBuyAmount: 5500000,
        itemGp: 2500000,
        itemMarginPercent: 31.25,
      }],
    }, salesActor, true);

    createdQuoteIds.push(res.quotationId);

    // Manager độc lập (NV0001) phê duyệt
    const appRes = await quotationService.approveQuotation(res.quotationId, pricingManagerActor, 'Phê duyệt chuẩn giá');
    assert.equal(appRes.success, true);

    // Lấy revision mới nhất sau khi Approved để tạo Version 2
    const approvedQuote = await pool.query('SELECT status, immutable_locked, version, updated_at::text as revision FROM customer_quotations WHERE quotation_id=$1', [res.quotationId]);
    assert.equal(approvedQuote.rows[0].status, 'APPROVED');
    assert.equal(approvedQuote.rows[0].immutable_locked, true);
    assert.equal(approvedQuote.rows[0].version, 1);

    // Tạo Version 2 từ báo giá đã Approved
    const newVersionId = await versionService.createQuotationVersion(res.quotationId, approvedQuote.rows[0].revision, salesActor);
    assert.ok(newVersionId);
    createdQuoteIds.push(newVersionId);

    // Kiểm tra Version 2 là DRAFT và chưa bị khóa
    const v2Quote = await pool.query('SELECT status, immutable_locked, version FROM customer_quotations WHERE quotation_id=$1', [newVersionId]);
    assert.equal(v2Quote.rows[0].status, 'DRAFT');
    assert.equal(v2Quote.rows[0].immutable_locked, false);
    assert.equal(v2Quote.rows[0].version, 2);
  });
});
