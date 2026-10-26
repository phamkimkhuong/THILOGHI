import Decimal from "decimal.js";
import { pool } from "@/server/db";
import { CreateQuotationInput, QuotationServiceItemInput } from "@/shared/schemas/quotation.schema";

export interface QuotationFinancialSummary {
  totalSellAmount: number;
  totalEstimatedBuy: number;
  totalWorstCaseBuy: number;
  estimatedGp: number;
  estimatedMarginPercent: number;
}

/**
 * Tính toán số liệu tài chính P&L cho danh mục dịch vụ báo giá bằng Decimal.js
 * Đảm bảo độ chính xác tuyệt đối, không có sai số dấu phẩy động
 */
export function calculateQuotationFinancials(
  items: QuotationServiceItemInput[]
): QuotationFinancialSummary {
  let totalSell = new Decimal(0);
  let totalEstimatedBuy = new Decimal(0);
  let totalWorstCaseBuy = new Decimal(0);

  for (const item of items) {
    const qty = new Decimal(item.plannedQuantity || 1);
    const unitSell = new Decimal(item.unitSellPrice || 0);
    const unitBuy = new Decimal(item.unitBuyPrice || 0);
    const worstBuy = new Decimal(item.worstCaseBuyPrice || 0);

    const itemSell = unitSell.mul(qty);
    const itemBuy = unitBuy.mul(qty);
    const itemWorst = worstBuy.mul(qty);

    totalSell = totalSell.add(itemSell);
    totalEstimatedBuy = totalEstimatedBuy.add(itemBuy);
    totalWorstCaseBuy = totalWorstCaseBuy.add(itemWorst);
  }

  const estimatedGp = totalSell.sub(totalEstimatedBuy);
  const marginPercent = totalSell.isZero()
    ? new Decimal(0)
    : estimatedGp.div(totalSell).mul(100);

  return {
    totalSellAmount: totalSell.toNumber(),
    totalEstimatedBuy: totalEstimatedBuy.toNumber(),
    totalWorstCaseBuy: totalWorstCaseBuy.toNumber(),
    estimatedGp: estimatedGp.toNumber(),
    estimatedMarginPercent: Number(marginPercent.toFixed(2)),
  };
}

/**
 * Lưu hoặc tạo mới Báo giá Nháp (Draft)
 * Nguyên tắc P0.1 & P0.3: Fail-Closed (không mock khi lỗi DB) và Server-Authoritative (đọc lại giá từ road_rates)
 */
export async function saveQuotationDraft(
  input: CreateQuotationInput,
  createdBy = "Pricing Specialist"
) {
  const quotationNo = `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Xác thực và tính toán Server-Authoritative cho từng dịch vụ
    let serverTotalSell = new Decimal(0);
    let serverTotalBuy = new Decimal(0);
    let serverTotalWorstBuy = new Decimal(0);

    const verifiedItems = [];

    for (const item of input.items) {
      const itemQty = new Decimal(item.plannedQuantity || 1);
      const itemSellUnit = new Decimal(item.unitSellPrice || 0);
      const itemSellTotal = itemSellUnit.mul(itemQty);
      serverTotalSell = serverTotalSell.add(itemSellTotal);

      let verifiedBuyRate = new Decimal(0);
      let verifiedWorstBuy = new Decimal(0);
      let verifiedVendorId: string | null = null;
      let verifiedVendorName: string | null = null;
      let verifiedCurrency = "VND";
      let validityStart: string | null = null;
      let validityEnd: string | null = null;

      // P0.3: Nếu client chọn BUY rate, Server truy vấn lại từ DB để lấy giá có thẩm quyền, KHÔNG tin client
      if (item.selectedBuyRateId) {
        const rateCheck = await client.query(
          `SELECT 
             r.rate_id, r.vendor_id, v.vendor_name, r.buy_rate, r.currency,
             lower(r.validity_range)::text as val_start,
             upper(r.validity_range)::text as val_end
           FROM road_rates r
           JOIN vendors v ON r.vendor_id = v.vendor_id
           WHERE r.rate_id = $1 AND r.status = 'APPROVED'`,
          [item.selectedBuyRateId]
        );

        if (rateCheck.rows.length > 0) {
          const row = rateCheck.rows[0];
          verifiedBuyRate = new Decimal(row.buy_rate);
          verifiedWorstBuy = verifiedBuyRate;
          verifiedVendorId = row.vendor_id;
          verifiedVendorName = row.vendor_name;
          verifiedCurrency = row.currency || "VND";
          validityStart = row.val_start;
          validityEnd = row.val_end;
        }
      }

      const itemBuyTotal = verifiedBuyRate.mul(itemQty);
      const itemWorstTotal = verifiedWorstBuy.mul(itemQty);
      serverTotalBuy = serverTotalBuy.add(itemBuyTotal);
      serverTotalWorstBuy = serverTotalWorstBuy.add(itemWorstTotal);

      const itemGp = itemSellTotal.sub(itemBuyTotal);
      const itemMargin = itemSellTotal.isZero() ? new Decimal(0) : itemGp.div(itemSellTotal).mul(100);

      verifiedItems.push({
        item,
        itemQty,
        itemSellUnit,
        itemSellTotal,
        verifiedBuyRate,
        verifiedWorstBuy,
        itemBuyTotal,
        itemWorstTotal,
        itemGp,
        itemMargin,
        verifiedVendorId,
        verifiedVendorName,
        verifiedCurrency,
        validityStart,
        validityEnd,
      });
    }

    const estimatedGp = serverTotalSell.sub(serverTotalBuy);
    const estimatedMarginPercent = serverTotalSell.isZero()
      ? new Decimal(0)
      : estimatedGp.div(serverTotalSell).mul(100);

    // 2. Tạo customer_quotations
    const quoteRes = await client.query(
      `
      INSERT INTO customer_quotations (
        quotation_no, version, customer_id, region_id, commodity_id,
        status, total_sell_amount, total_estimated_buy, total_worst_case_buy,
        estimated_gp, estimated_margin_percent, payment_terms_days,
        immutable_locked, created_by
      ) VALUES (
        $1, 1, $2, $3, $4,
        'DRAFT', $5, $6, $7,
        $8, $9, $10,
        false, $11
      ) RETURNING quotation_id, quotation_no;
      `,
      [
        quotationNo,
        input.customerId,
        input.regionId,
        input.commodityId || null,
        serverTotalSell.toNumber(),
        serverTotalBuy.toNumber(),
        serverTotalWorstBuy.toNumber(),
        estimatedGp.toNumber(),
        Number(estimatedMarginPercent.toFixed(2)),
        input.paymentTermsDays,
        createdBy,
      ]
    );

    const quotationId = quoteRes.rows[0].quotation_id;

    // 3. Lưu từng dịch vụ con (quotation_service_items) & BUY Snapshots
    for (const vItem of verifiedItems) {
      const itemRes = await client.query(
        `
        INSERT INTO quotation_service_items (
          quotation_id, service_package, pricing_inclusion,
          origin_location_id, destination_location_id, equipment_type,
          planned_quantity, unit, unit_sell_price, total_sell_price,
          selected_buy_rate_id, estimated_buy_amount, worst_case_buy_amount,
          item_gp, item_margin_percent
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13,
          $14, $15
        ) RETURNING item_id;
        `,
        [
          quotationId,
          vItem.item.servicePackage,
          vItem.item.pricingInclusion,
          vItem.item.originLocationId,
          vItem.item.destinationLocationId,
          vItem.item.equipmentType,
          vItem.item.plannedQuantity,
          vItem.item.unit,
          vItem.itemSellUnit.toNumber(),
          vItem.itemSellTotal.toNumber(),
          vItem.item.selectedBuyRateId || null,
          vItem.itemBuyTotal.toNumber(),
          vItem.itemWorstTotal.toNumber(),
          vItem.itemGp.toNumber(),
          Number(vItem.itemMargin.toFixed(2)),
        ]
      );

      // P0.3: Lưu Snapshot với dữ liệu có thẩm quyền từ PostgreSQL
      if (vItem.item.selectedBuyRateId && vItem.verifiedVendorId) {
        await client.query(
          `
          INSERT INTO quotation_buy_snapshots (
            quotation_id, item_id, source_rate_id,
            vendor_id, vendor_name, rate_amount,
            original_currency, fx_rate_to_vnd, rate_amount_vnd,
            validity_start, validity_end
          ) VALUES (
            $1, $2, $3,
            $4, $5, $6,
            $7, 1.0000, $8,
            COALESCE($9::date, CURRENT_DATE),
            COALESCE($10::date, CURRENT_DATE + INTERVAL '90 days')
          );
          `,
          [
            quotationId,
            itemRes.rows[0].item_id,
            vItem.item.selectedBuyRateId,
            vItem.verifiedVendorId,
            vItem.verifiedVendorName || "Nhà cung cấp đã duyệt",
            vItem.verifiedBuyRate.toNumber(),
            vItem.verifiedCurrency,
            vItem.itemBuyTotal.toNumber(),
            vItem.validityStart,
            vItem.validityEnd,
          ]
        );
      }
    }

    await client.query("COMMIT");
    return {
      success: true,
      quotationId,
      quotationNo,
      financials: {
        totalSellAmount: serverTotalSell.toNumber(),
        totalEstimatedBuy: serverTotalBuy.toNumber(),
        totalWorstCaseBuy: serverTotalWorstBuy.toNumber(),
        estimatedGp: estimatedGp.toNumber(),
        estimatedMarginPercent: Number(estimatedMarginPercent.toFixed(2)),
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    // P0.1: Fail-Closed tuyệt đối - không trả về thành công giả khi lỗi cơ sở dữ liệu
    throw new Error(`Lỗi giao dịch cơ sở dữ liệu khi lưu báo giá: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    client.release();
  }
}

/**
 * Gửi Báo giá sang Quy trình Phê duyệt và Kích hoạt Khóa Bất Biến (Immutable Lock)
 * P0.6: Kiểm tra trạng thái DRAFT, kiểm tra rowCount và Fail-Closed tuyệt đối
 */
export async function submitQuotationForApproval(quotationId: string) {
  const client = await pool.connect();
  try {
    // 1. Kiểm tra tồn tại và trạng thái của Báo giá
    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, status, immutable_locked 
       FROM customer_quotations 
       WHERE quotation_id = $1`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      return {
        success: false,
        error: "Báo giá không tồn tại trong hệ thống.",
      };
    }

    const currentQuote = quoteCheck.rows[0];
    if (currentQuote.status !== "DRAFT" || currentQuote.immutable_locked) {
      return {
        success: false,
        error: `Không thể trình duyệt: Báo giá [${currentQuote.quotation_no}] hiện ở trạng thái ${currentQuote.status} hoặc đã bị khóa.`,
      };
    }

    // 2. Kiểm tra quy tắc P0: Không cho submit nếu thiếu giá mua đầu vào (MISSING RATE)
    const checkRes = await client.query(
      `SELECT COUNT(*) as missing_count FROM quotation_service_items 
       WHERE quotation_id = $1 AND (selected_buy_rate_id IS NULL OR estimated_buy_amount = 0)`,
      [quotationId]
    );

    if (Number(checkRes.rows[0].missing_count) > 0) {
      return {
        success: false,
        error: "Không thể trình duyệt: Có dịch vụ chưa xác định hoặc thiếu giá mua đầu vào (MISSING RATE).",
      };
    }

    // 3. Kích hoạt Khóa Bất Biến (Immutable Locked) và chuyển trạng thái PENDING_APPROVAL
    const updateRes = await client.query(
      `UPDATE customer_quotations 
       SET status = 'PENDING_APPROVAL', immutable_locked = true, updated_at = NOW() 
       WHERE quotation_id = $1 AND status = 'DRAFT' AND immutable_locked = false
       RETURNING quotation_id, quotation_no`,
      [quotationId]
    );

    if (updateRes.rowCount === 0) {
      return {
        success: false,
        error: "Xung đột đồng thời: Báo giá đã được thay đổi bởi một tác vụ khác.",
      };
    }

    return {
      success: true,
      message: `Đã trình duyệt thành công báo giá [${updateRes.rows[0].quotation_no}]! Hệ thống đã kích hoạt KHÓA BẤT BIẾN (Immutable Lock).`,
    };
  } catch (err) {
    // P0.1: Fail-Closed tuyệt đối - lỗi là báo lỗi, không trả về thành công mô phỏng
    return {
      success: false,
      error: `Lỗi kết nối cơ sở dữ liệu khi trình duyệt: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}
