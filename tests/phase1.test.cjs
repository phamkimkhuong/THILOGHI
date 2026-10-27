/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-typescript.cjs');

const quoteId = '10000000-0000-4000-8000-000000000001';
const rateId = '20000000-0000-4000-8000-000000000001';
const actor = { userId: 'sales', fullName: 'Sales One', username: 'sales', role: 'SALES', regionScopes: ['R1'] };
const input = () => ({
  customerId: 'C1', regionId: 'R1', paymentTermsDays: 0,
  items: [{ servicePackage: 'TRUCKING', pricingInclusion: 'INCLUDED', originLocationId: 'A', destinationLocationId: 'B',
    equipmentType: '40HC', plannedQuantity: 3, unit: 'TRIP', selectedBuyRateId: rateId,
    unitSellPrice: 1500.4, totalSellPrice: 1, unitBuyPrice: 1, worstCaseBuyPrice: 1,
    totalBuyAmount: 1, itemGp: 99999, itemMarginPercent: 99 }],
});
const candidate = (overrides = {}) => ({ rate_id: rateId, vendor_id: 'V1', vendor_name: 'Vendor One', buy_rate: '1000.50',
  currency: 'VND', validity_range: '[2026-01-01,2027-01-01)', validity_start: '2026-01-01', validity_end: '2027-01-01', ...overrides });

function database(options = {}) {
  const calls = [];
  let releases = 0;
  const state = { status: 'DRAFT', region_id: 'R1', revision: 'rev-1', immutable_locked: false,
    estimated_margin_percent: 33, quotation_id: quoteId, quotation_no: 'QT-TEST', version: 1, ...options.quote };
  const query = async (sql, values = []) => {
    calls.push({ sql, values });
    let rows = [];
    if (sql.includes('FROM road_rates r')) {
      assert.match(sql, /v.role_status = 'ACTIVE'/);
      assert.match(sql, /p.status = 'ACTIVE'/);
      rows = options.rates ?? [candidate(), candidate({ rate_id: '20000000-0000-4000-8000-000000000002', vendor_id: 'V2', buy_rate: '1100' })];
    } else if (sql.includes('FROM customers c')) rows = [{ customer_id: 'C1', partner_name: 'Customer', role_status: 'ACTIVE', status: 'ACTIVE', ...options.customer }];
    else if (sql.includes("nextval('quotation_no_seq')")) rows = [{ seq: 10001 }];
    else if (sql.includes('INSERT INTO customer_quotations')) rows = [{ quotation_id: quoteId }];
    else if (sql.includes('INSERT INTO quotation_service_items')) rows = [{ item_id: 'item-1' }];
    else if (sql.includes('COUNT(*) as item_count')) rows = [{ item_count: 1, missing_count: options.missing ? 1 : 0 }];
    else if (sql.startsWith('SELECT updated_at::text')) rows = [{ revision: 'rev-2' }];
    else if (sql.includes('FROM customer_quotations') && sql.includes('WHERE quotation_id')) rows = [{ ...state }];
    else if (sql.includes("SET status = 'PENDING_APPROVAL'")) rows = [{ quotation_id: quoteId, quotation_no: 'QT-TEST' }];
    else if (sql.includes('INSERT INTO quotation_approval_log') && options.auditFailure) throw new Error('audit unavailable');
    return { rows, rowCount: rows.length };
  };
  const pool = { query, connect: async () => ({ query, release: () => { releases++; } }) };
  const load = createLoader({ '@/server/db': { pool }, 'next/headers': { cookies: async () => ({ get: () => undefined }) }, jose: {} });
  return { calls, state, load, pool, get releases() { return releases; } };
}

test('business date uses Vietnam midnight, independent of UTC date', () => {
  const { getBusinessDate } = createLoader()('src/shared/utils/pricing.ts');
  assert.equal(getBusinessDate(new Date('2026-10-26T16:59:59Z')), '2026-10-26');
  assert.equal(getBusinessDate(new Date('2026-10-26T17:00:00Z')), '2026-10-27');
});

test('VND rounding is consistent for unit rates, fractional quantities and totals', () => {
  const { calculateQuotationFinancials, roundVnd } = createLoader()('src/shared/utils/pricing.ts');
  assert.equal(roundVnd('1000.5').toNumber(), 1001);
  assert.deepEqual(calculateQuotationFinancials([{ plannedQuantity: 1.5, unitSellPrice: 1500.4, unitBuyPrice: 1000.5, worstCaseBuyPrice: 1100 }]), {
    totalSellAmount: 2250, totalEstimatedBuy: 1502, totalWorstCaseBuy: 1650, estimatedGp: 748, estimatedMarginPercent: 33.24,
  });
});

test('server validation rejects invalid quantities, prices, identifiers and stale edit payloads', () => {
  const { createQuotationSchema: schema } = createLoader()('src/shared/schemas/quotation.schema.ts');
  assert.equal(schema.parse(input()).paymentTermsDays, 0);
  for (const quantity of [0, -1, Infinity, NaN, 1.001]) {
    const payload = input(); payload.items[0].plannedQuantity = quantity;
    assert.equal(schema.safeParse(payload).success, false);
  }
  for (const price of [-1, Infinity, NaN]) {
    const payload = input(); payload.items[0].unitSellPrice = price;
    assert.equal(schema.safeParse(payload).success, false);
  }
  assert.equal(schema.safeParse({ ...input(), quotationId: quoteId }).success, false);
  assert.equal(schema.safeParse({ ...input(), customerId: ' ' }).success, false);
});

test('lookup returns multiple valid vendors with the same rounded cost used on save', async () => {
  const db = database();
  const { lookupRoadRates } = db.load('src/server/modules/supplier-pricing/rate-lookup.service.ts');
  const result = await lookupRoadRates({ pickupLocationId: 'A', deliveryLocationId: 'B', equipmentType: '40HC', pricingDate: '2026-10-27' });
  assert.equal(result.status, 'MULTIPLE_CANDIDATES');
  assert.equal(result.selectedRate.buyRateVnd, 1001);
  assert.equal(result.worstCaseBuy, 1100);
  assert.deepEqual(db.calls[0].values, ['A', 'B', '40HC', '2026-10-27']);
});

test('lookup detects overlapping vendor rates and does not select a conflicting rate', async () => {
  const db = database({ rates: [candidate(), candidate({ rate_id: 'duplicate' })] });
  const result = await db.load('src/server/modules/supplier-pricing/rate-lookup.service.ts').lookupRoadRates({ pickupLocationId: 'A', deliveryLocationId: 'B', equipmentType: '40HC', pricingDate: '2026-10-27' });
  assert.equal(result.status, 'CONFLICT_RATE');
  assert.equal(result.selectedRate, undefined);
});

test('unsupported currency fails explicitly instead of silently applying VND', async () => {
  const db = database({ rates: [candidate({ currency: 'EUR' })] });
  await assert.rejects(db.load('src/server/modules/supplier-pricing/rate-lookup.service.ts').lookupRoadRates({ pickupLocationId: 'A', deliveryLocationId: 'B', equipmentType: '40HC', pricingDate: '2026-10-27' }), /EUR/);
});

test('save and submit uses current form values and one atomic transaction, ignoring forged totals', async () => {
  const db = database();
  const result = await db.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft(input(), actor, true);
  assert.equal(result.status, 'PENDING_APPROVAL');
  assert.equal(result.revision, 'rev-2');
  assert.equal(result.financials.totalSellAmount, 4500);
  assert.equal(result.financials.totalEstimatedBuy, 3003);
  assert.equal(result.financials.totalWorstCaseBuy, 3300);
  assert.equal(db.calls.filter((call) => call.sql === 'BEGIN').length, 1);
  assert.equal(db.calls.filter((call) => call.sql === 'COMMIT').length, 1);
  assert.equal(db.calls.filter((call) => call.sql === 'ROLLBACK').length, 0);
  assert.equal(db.releases, 1);
  const snapshot = db.calls.find((call) => call.sql.includes('INSERT INTO quotation_buy_snapshots'));
  assert.equal(snapshot.values[8], 1001, 'snapshot converted amount must be a unit price');
});

test('failed submission rolls back saved rows and snapshots, without a nested commit', async () => {
  const db = database({ missing: true });
  await assert.rejects(db.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft(input(), actor, true), /thiếu giá mua/);
  assert.equal(db.calls.filter((call) => call.sql === 'COMMIT').length, 0);
  assert.equal(db.calls.filter((call) => call.sql === 'ROLLBACK').length, 1);
  assert.equal(db.releases, 1);
});

test('audit failure rolls back the entire save-and-submit transaction', async () => {
  const db = database({ auditFailure: true });
  await assert.rejects(db.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft(input(), actor, true), /audit unavailable/);
  assert.equal(db.calls.at(-1).sql, 'ROLLBACK');
  assert.equal(db.calls.some((call) => call.sql === 'COMMIT'), false);
});

test('update rejects stale revisions before writing and locks the parent first', async () => {
  const db = database();
  await assert.rejects(db.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft({ ...input(), quotationId: quoteId, expectedUpdatedAt: 'old' }, actor), /đã được thay đổi/);
  assert.match(db.calls[1].sql, /FOR UPDATE/);
  assert.equal(db.calls.some((call) => /^(UPDATE|INSERT|DELETE)/.test(call.sql)), false);
});

test('changing payload region cannot bypass the original quotation region', async () => {
  const db = database({ quote: { region_id: 'R2' } });
  await assert.rejects(db.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft({ ...input(), quotationId: quoteId, expectedUpdatedAt: 'rev-1' }, actor), /Phân vùng/);
  assert.equal(db.calls.some((call) => call.sql.includes('DELETE FROM')), false);
});

test('non-commercial roles cannot save or submit quotations', async () => {
  const db = database();
  const service = db.load('src/server/modules/quotation/quotation.service.ts');
  for (const role of ['OPERATIONS', 'ACCOUNTANT']) {
    await assert.rejects(service.saveQuotationDraft(input(), { ...actor, role }), /Vai trò/);
    await assert.rejects(service.submitQuotationForApproval(quoteId, { ...actor, role }), /Vai trò/);
  }
  assert.equal(db.calls.length, 0);
});

test('approved quotation cannot be overwritten', async () => {
  const db = database({ quote: { status: 'APPROVED', immutable_locked: true } });
  await assert.rejects(db.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft({ ...input(), quotationId: quoteId, expectedUpdatedAt: 'rev-1' }, actor), /Chỉ được sửa/);
});

test('inactive customer and expired/mismatched selected rate block saving', async () => {
  const inactive = database({ customer: { role_status: 'SUSPENDED' } });
  await assert.rejects(inactive.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft(input(), actor), /chưa được kích hoạt/);
  const expired = database({ rates: [] });
  await assert.rejects(expired.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft(input(), actor), /không còn hợp lệ/);
});

test('quotation list is scoped and explicit unauthorized region is rejected', async () => {
  const db = database();
  const service = db.load('src/server/modules/quotation/quotation.service.ts');
  await service.getQuotationsList(actor);
  assert.match(db.calls[0].sql, /q.region_id = ANY\(\$1::varchar\[\]\)/);
  assert.deepEqual(db.calls[0].values[0], ['R1']);
  await assert.rejects(service.getQuotationsList(actor, { regionId: 'R2' }), /Phân vùng/);
});

test('detail blocks unauthorized region before reading child items or snapshots', async () => {
  const calls = [];
  const load = createLoader({ '@/server/db': { pool: { query: async (sql) => { calls.push(sql); return { rows: [{ regionId: 'R2' }] }; } } }, 'next/headers': {}, jose: {} });
  await assert.rejects(load('src/server/modules/quotation/quotation.service.ts').getQuotationDetail(quoteId, actor), /Phân vùng/);
  assert.equal(calls.length, 1);
});

test('reopening a draft preserves source rate, vendor and billing inclusion', () => {
  const { restoreQuotationItems } = createLoader()('src/features/quotation/editor-state.ts');
  const items = restoreQuotationItems({ items: [{ itemId: 'item-1', ...input().items[0], estimatedBuyAmount: 3003, worstCaseBuyAmount: 3300,
    pricingInclusion: 'SEPARATELY_BILLED' }], snapshots: [{ itemId: 'item-1', vendorId: 'V1', vendorName: 'Vendor', rateAmount: 1000.5,
    originalCurrency: 'VND', fxRateToVnd: 1, validityStart: '2026-01-01', validityEnd: '2027-01-01' }] });
  assert.equal(items[0].selectedBuyRateId, rateId);
  assert.equal(items[0].selectedCandidate.vendorId, 'V1');
  assert.equal(items[0].unitBuyPrice, 1001);
  assert.equal(items[0].pricingInclusion, 'SEPARATELY_BILLED');
});

test('commodity data does not infer cold-chain, dangerous goods or units', async () => {
  const load = createLoader({ '@/server/db': { pool: { query: async () => ({ rows: [{ commodityId: 'C', name: 'Nông sản', category: 'Nông sản', specifications: 'hóa chất' }] }) } } });
  const [commodity] = await load('src/server/modules/master-data/master-data.service.ts').getCommoditiesDetailedList();
  for (const key of ['dangerousGoods', 'tempControlled', 'unit']) assert.equal(Object.hasOwn(commodity, key), false);
});

test('legacy snapshots display unit costs and date-only validity without timezone shifts', async () => {
  const load = createLoader({ '@/server/db': { pool: { query: async (sql) => {
    if (sql.includes('FROM customer_quotations q')) return { rows: [{ quotationId: quoteId, regionId: 'R1', paymentTermsDays: 0, revision: 'rev-1' }] };
    if (sql.includes('FROM quotation_buy_snapshots')) {
      assert.match(sql, /validity_start::text/);
      return { rows: [{ rateAmount: '1000.5', fxRateToVnd: '1', rateAmountVnd: '3003', validityStart: '2026-10-27', validityEnd: '2026-11-01' }] };
    }
    return { rows: [] };
  } } }, 'next/headers': {}, jose: {} });
  const detail = await load('src/server/modules/quotation/quotation.service.ts').getQuotationDetail(quoteId, actor);
  assert.equal(detail.quote.paymentTermsDays, 0);
  assert.equal(detail.snapshots[0].rateAmountVnd, 1001);
  assert.equal(detail.snapshots[0].validityStart, '2026-10-27');
  assert.equal(detail.snapshots[0].validityEnd, '2026-11-01');
});

test('no session never auto-selects a database user, even when demo is enabled', async () => {
  const old = process.env.ENABLE_DEMO_AUTH;
  process.env.ENABLE_DEMO_AUTH = 'true';
  try {
    const db = database();
    assert.equal(await db.load('src/server/auth/session.ts').getSessionActor(), null);
    assert.equal(db.calls.length, 0);
  } finally { if (old === undefined) delete process.env.ENABLE_DEMO_AUTH; else process.env.ENABLE_DEMO_AUTH = old; }
});

test('demo switch requires explicit server configuration', async () => {
  const old = process.env.ENABLE_DEMO_AUTH;
  delete process.env.ENABLE_DEMO_AUTH;
  try {
    const db = database();
    await assert.rejects(db.load('src/server/auth/session.ts').switchSessionUser('admin'), /ENABLE_DEMO_AUTH/);
    assert.equal(db.calls.length, 0);
  } finally { if (old !== undefined) process.env.ENABLE_DEMO_AUTH = old; }
});

test('JWT verifies valid signatures and rejects tampering and missing secrets', async () => {
  const jose = await import('jose');
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-secret-at-least-32-characters';
  try {
    const session = createLoader({ jose, 'next/headers': {} })('src/server/auth/session.ts');
    const token = await session.createSessionToken(actor);
    assert.equal((await session.verifySessionToken(token)).userId, actor.userId);
    const parts = token.split('.'); parts[1] = Buffer.from(JSON.stringify({ userId: 'admin' })).toString('base64url');
    assert.equal(await session.verifySessionToken(parts.join('.')), null);
    delete process.env.JWT_SECRET;
    await assert.rejects(session.createSessionToken(actor), /JWT_SECRET/);
  } finally { if (old === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = old; }
});

test('unauthenticated quotation actions return errors without reading business data', async () => {
  const db = database();
  const actions = db.load('src/features/quotation/actions.ts');
  assert.equal((await actions.getQuotationsListAction()).success, false);
  assert.equal((await actions.getQuotationDetailAction(quoteId)).success, false);
  assert.equal((await actions.saveDraftQuotationAction(input(), true)).success, false);
  assert.equal((await actions.lookupRoadRatesAction({ pickupLocationId: 'A', deliveryLocationId: 'B', equipmentType: '40HC', pricingDate: '2026-10-27' })).status, 'ERROR');
  assert.equal(db.calls.length, 0);
});

test('approval requires correct region, authority and an independent reviewer', async () => {
  for (const scenario of [
    { user: actor, quote: {} },
    { user: { ...actor, role: 'PRICING_MANAGER' }, quote: { region_id: 'R2' } },
    { user: { ...actor, role: 'PRICING_MANAGER' }, quote: { created_by: actor.fullName } },
    { user: { ...actor, role: 'PRICING_MANAGER' }, quote: { estimated_margin_percent: 10 } },
  ]) {
    const db = database({ quote: { status: 'PENDING_APPROVAL', ...scenario.quote } });
    const result = await db.load('src/server/modules/quotation/quotation.service.ts').approveQuotation(quoteId, scenario.user);
    assert.equal(result.success, false);
    assert.match(db.calls[1].sql, /FOR UPDATE/);
    assert.equal(db.calls.at(-1).sql, 'ROLLBACK');
    assert.equal(db.calls.some((call) => call.sql.includes('INSERT INTO quotation_approval_log')), false);
  }
});

test('only managers can reject or return a quotation, including direct service calls', async () => {
  const db = database();
  const service = db.load('src/server/modules/quotation/quotation.service.ts');
  const specialist = { ...actor, role: 'PRICING_SPECIALIST' };
  await assert.rejects(service.rejectQuotation(quoteId, specialist, 'reason'), /Vai trò/);
  await assert.rejects(service.returnQuotationToDraft(quoteId, specialist, 'reason'), /Vai trò/);
  assert.equal(db.calls.length, 0);
});

test('valid draft update retains source rate and uses the existing optimistic revision', async () => {
  const db = database();
  const result = await db.load('src/server/modules/quotation/quotation.service.ts').saveQuotationDraft({ ...input(), quotationId: quoteId, expectedUpdatedAt: 'rev-1' }, actor);
  assert.equal(result.status, 'DRAFT');
  const line = db.calls.find((call) => call.sql.includes('INSERT INTO quotation_service_items'));
  assert.equal(line.values[10], rateId);
  assert.equal(line.values[11], 3003);
  assert.equal(db.calls.at(-1).sql, 'COMMIT');
});

test('manager can return a rejected quotation to draft, but not an approved quotation', async () => {
  const reviewer = { ...actor, role: 'PRICING_MANAGER' };
  const rejected = database({ quote: { status: 'REJECTED' } });
  const result = await rejected.load('src/server/modules/quotation/quotation.service.ts').returnQuotationToDraft(quoteId, reviewer, 'Sửa lại giá');
  assert.equal(result.success, true);
  assert.equal(rejected.calls.at(-1).sql, 'COMMIT');
  const approved = database({ quote: { status: 'APPROVED' } });
  assert.equal((await approved.load('src/server/modules/quotation/quotation.service.ts').returnQuotationToDraft(quoteId, reviewer, 'Sửa lại giá')).success, false);
});

test('login accepts a bcrypt password, sets a session, and redirects', async () => {
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('test-password', 4);
  let signedIn;
  const load = createLoader({
    '@/server/db': { pool: { query: async () => ({ rows: [{ user_id: actor.userId, password_hash: passwordHash }] }) } },
    '@/server/auth/users': { findUserById: async () => actor },
    '@/server/auth/session': { setSessionActor: async (value) => { signedIn = value; } },
    'next/navigation': { redirect: (url) => { throw new Error(`redirect:${url}`); } },
  });
  const form = new FormData(); form.set('username', 'sales'); form.set('password', 'test-password');
  await assert.rejects(load('src/features/auth/actions.ts').loginAction({ error: '' }, form), /redirect:\/quotations/);
  assert.equal(signedIn.userId, actor.userId);
});

test('invalid passwords cannot create a session and repeated attempts are limited', async () => {
  let queries = 0;
  const load = createLoader({
    '@/server/db': { pool: { query: async () => { queries++; return { rows: [] }; } } },
    '@/server/auth/users': { findUserById: async () => { throw new Error('unexpected user lookup'); } },
    '@/server/auth/session': { setSessionActor: async () => { throw new Error('must not sign in'); } },
    'next/navigation': { redirect: () => { throw new Error('must not redirect'); } },
  });
  const login = load('src/features/auth/actions.ts').loginAction;
  const form = new FormData(); form.set('username', 'unknown'); form.set('password', 'bad');
  for (let index = 0; index < 5; index++) assert.match((await login({ error: '' }, form)).error, /không đúng/);
  assert.match((await login({ error: '' }, form)).error, /15 phút/);
  assert.equal(queries, 5);
});
