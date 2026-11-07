/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-typescript.cjs');
const config = createLoader()('src/features/master-data/maintenance-config.ts');
const actor = { userId: 'manager', username: 'manager', fullName: 'Manager', role: 'PRICING_MANAGER', regionScopes: ['R1'] };
const fields = () => ({ vendor_id: 'V1', pickup_location_id: 'A', delivery_location_id: 'B', equipment_type: '40HC', buy_rate: '100.25', currency: 'USD', valid_from: '2026-11-01', valid_to: '2026-12-01', remarks: '' });
function setup(options = {}) {
  const calls = [];
  let released = false;
  const old = { rate_id: 'rate-1', revision: '10', status: 'DRAFT', ...fields(), ...options.old };
  const query = async (sql, values = []) => {
    calls.push({ sql, values });
    let rows = [];
    if (sql.startsWith('SELECT status FROM partners')) rows = [{status:'ACTIVE'}];
    if (sql.startsWith('SELECT *, xmin')) rows = options.create ? [] : [old];
    if (sql.startsWith('SELECT location_id')) rows = [{location_id: 'A',region_id: options.region ?? 'R1',is_active: true},{location_id: 'B',region_id: 'R2',is_active: !options.inactive}];
    if (sql.startsWith('SELECT v.vendor_id')) rows = options.vendorInactive ? [] : [{vendor_id:'V1'}];
    if (sql.startsWith('SELECT actor_id')) rows = [{actor_id: options.author ?? 'specialist'}];
    if (sql.startsWith('UPDATE') || sql.startsWith('INSERT INTO road_rates')) {
      if (options.conflict) throw Object.assign(new Error('overlap'), {code:'23P01'});
      rows = [old];
    }
    if (sql.startsWith('INSERT INTO master_data_audit') && options.auditFailure) throw new Error('audit unavailable');
    return { rows };
  };
  const pool = {query,connect: async () => ({query,release: () => { released = true; }})};
  const service = createLoader({'@/server/db':{pool},'next/headers':{cookies:async()=>({get:()=>undefined})},jose:{}})('src/server/modules/master-data/maintenance.service.ts');
  return { service, calls, get released() {return released;} };
}
test('phase3 preserves zero-day terms and missing source attributes', () => {
  assert.equal(config.validateFields('customers', {role_status:'ACTIVE',payment_terms_days:'0',credit_limit_vnd:''}).payment_terms_days,'0');
  const result=config.validateFields('commodities',{name:'Hàng',english_name:'',category:'',specifications:'',origin:'',purpose:'',status:''});
  assert.equal(result.category,null); assert.equal(result.origin,null);
});
test('phase3 rejects malformed price, date, route, currency and injected fields', () => {
  for (const change of [{buy_rate:'0'},{buy_rate:'-1'},{buy_rate:'Infinity'},{buy_rate:'1.234'},{valid_from:'2026-02-30'},{valid_to:'2026-11-01'},{delivery_location_id:'A'},{currency:'XXX'},{status:'APPROVED'}]) assert.throws(()=>config.validateFields('rates',{...fields(),...change}));
});
test('phase3 blocks sales writes before connecting', async () => {
  const db=setup();
  await assert.rejects(db.service.mutateMaintenance({kind:'rates',action:'SAVE',fields:fields()},{...actor,role:'SALES'}));
  assert.equal(db.calls.length,0);
});
test('phase3 creates draft and audit atomically without trusting client status', async () => {
  const db=setup({create:true});
  await db.service.mutateMaintenance({kind:'rates',action:'SAVE',fields:fields()},actor);
  const insert=db.calls.find(c=>c.sql.startsWith('INSERT INTO road_rates'));
  assert.ok(insert.values.includes('DRAFT')); assert.ok(insert.values.includes('[2026-11-01,2026-12-01)'));
  assert.ok(db.calls.some(c=>c.sql.startsWith('INSERT INTO master_data_audit')));
  assert.equal(db.calls.at(-1).sql,'COMMIT'); assert.equal(db.released,true);
});
for (const [name, options, action, revision] of [
  ['stale revision',{},'SAVE','9'],
  ['outside pickup scope',{region:'R9'},'SAVE','10'],
  ['inactive destination',{inactive:true},'SUBMIT','10'],
  ['inactive vendor',{vendorInactive:true},'SUBMIT','10'],
  ['approved edit',{old:{status:'APPROVED'}},'SAVE','10'],
  ['self approval',{old:{status:'PENDING_APPROVAL'},author:'manager'},'APPROVE','10'],
  ['overlapping approval',{old:{status:'PENDING_APPROVAL'},conflict:true},'APPROVE','10'],
  ['audit failure',{auditFailure:true},'SAVE','10'],
]) test(`phase3 rolls back ${name}`,async()=>{
  const db=setup(options);
  await assert.rejects(db.service.mutateMaintenance({kind:'rates',id:'rate-1',revision,action,fields:fields()},actor));
  assert.equal(db.calls.at(-1).sql,'ROLLBACK'); assert.equal(db.released,true);
  assert.ok(!db.calls.some(c=>c.sql==='COMMIT'));
});
test('phase3 allows independent manager approval and logs it',async()=>{
  const db=setup({old:{status:'PENDING_APPROVAL'}});
  await db.service.mutateMaintenance({kind:'rates',id:'rate-1',revision:'10',action:'APPROVE'},actor);
  assert.ok(db.calls.find(c=>c.sql.startsWith('UPDATE road_rates')).values.includes('APPROVED'));
  assert.equal(db.calls.at(-1).sql,'COMMIT');
});
test('phase3 specialist cannot approve and rejection requires reason',async()=>{
  const db=setup();
  await assert.rejects(db.service.mutateMaintenance({kind:'rates',id:'rate-1',revision:'10',action:'APPROVE'},{...actor,role:'PRICING_SPECIALIST'}));
  await assert.rejects(db.service.mutateMaintenance({kind:'rates',id:'rate-1',revision:'10',action:'REJECT'},actor));
  assert.equal(db.calls.length,0);
});
test('phase3 role suspension cannot bypass lifecycle reason requirement',async()=>{
  const db=setup({old:{vendor_id:'V1',role_status:'ACTIVE'}});
  await assert.rejects(db.service.mutateMaintenance({kind:'vendors',id:'V1',revision:'10',action:'SAVE',fields:{vendor_type:'ROAD',role_status:'SUSPENDED'}},actor),/lý do/);
  assert.equal(db.calls.at(-1).sql,'ROLLBACK');
});
test('phase3 list search is parameterized and supports supplier and route names',async()=>{
  const db=setup();
  await db.service.listMaintenance('rates',"' OR true --",2);
  const query=db.calls[0];
  assert.ok(query.sql.includes('p.partner_name')); assert.ok(query.sql.includes('a.name'));
  assert.ok(!query.sql.includes("' OR true --"));
  assert.deepEqual(query.values,["%' OR true --%",25]);
  await assert.rejects(db.service.listMaintenance('road_rates;DROP TABLE partners','',1));
});
