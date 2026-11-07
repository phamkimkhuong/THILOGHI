/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const createLoader=require('./load-typescript.cjs');
const actor={userId:'manager',username:'manager',fullName:'Manager',role:'PRICING_MANAGER',regionScopes:['R1']};
const id='10000000-0000-4000-8000-000000000001';
test('phase4 author identity survives role changes and distinguishes matching names',()=>{
  const {isQuotationAuthor}=createLoader()('src/features/quotation/approval-policy.ts');
  assert.equal(isQuotationAuthor('manager','Other name',actor),true);
  assert.equal(isQuotationAuthor('other','Manager',actor),false);
  assert.equal(isQuotationAuthor(undefined,'Manager (SALES)',actor),true);
  assert.equal(isQuotationAuthor(undefined,'Manager Two (SALES)',actor),false);
});
test('phase4 new lines do not silently choose customer, route or equipment',()=>{
  const {emptyServiceItem}=createLoader()('src/features/quotation/workspace-state.ts');
  const item=emptyServiceItem('x');
  assert.equal(item.originLocationId,'');assert.equal(item.destinationLocationId,'');assert.equal(item.equipmentType,'');assert.equal(item.selectedBuyRateId,undefined);
});
test('phase4 validity warning respects exclusive upper date',()=>{
  const {emptyServiceItem,rateWarning}=createLoader()('src/features/quotation/workspace-state.ts');
  const item={...emptyServiceItem('x'),selectedBuyRateId:id,selectedCandidate:{validityStart:'2026-11-01',validityEnd:'2026-11-03'}};
  assert.equal(rateWarning(item,'2026-11-02'),null);
  assert.match(rateWarning(item,'2026-11-03'),/hiệu lực/);
  assert.match(rateWarning({...item,selectedBuyRateId:undefined}),/Chưa chọn/);
});
test('phase4 dirty fingerprint ignores lookup display but tracks commercial edits',()=>{
  const {emptyServiceItem,commercialFingerprint:f}=createLoader()('src/features/quotation/workspace-state.ts');
  const h={customerId:'C1',regionId:'R1',commodityId:'',paymentTermsDays:0};const item=emptyServiceItem('1');
  assert.equal(f(h,[item]),f(h,[{...item,id:'2',lookupResult:{status:'MISSING_RATE'}}]));
  assert.notEqual(f(h,[item]),f(h,[{...item,unitSellPrice:100}]));
  assert.notEqual(f(h,[item]),f({...h,paymentTermsDays:30},[item]));
});
function versionDb(options={}) {
  const calls=[];let released=false;
  const query=async(sql,values=[])=>{
    calls.push({sql,values});let rows=[];
    if(sql.startsWith('SELECT *, updated_at'))rows=[{quotation_no:'QT-1',version:1,region_id:'R1',status:'APPROVED',immutable_locked:true,revision:'rev-1',...options.source}];
    if(sql.startsWith('SELECT MAX'))rows=[{version:options.latest??1}];
    if(sql.startsWith('INSERT INTO customer_quotations'))rows=[{quotation_id:'new-id'}];
    if(sql.startsWith('INSERT INTO quotation_approval_log') && options.auditFail)throw Error('audit failed');
    return {rows};
  };
  const load=createLoader({'@/server/db':{pool:{query,connect:async()=>({query,release:()=>{released=true;}})}},'next/headers':{cookies:async()=>({get:()=>undefined})},jose:{}});
  return {calls,service:load('src/server/modules/quotation/version.service.ts'),get released(){return released;}};
}
test('phase4 version creation serializes series, keeps old quote and resets buy sources',async()=>{
  const db=versionDb();assert.equal(await db.service.createQuotationVersion(id,'rev-1',actor),'new-id');
  assert.ok(db.calls.some(c=>c.sql.includes('pg_advisory_xact_lock')));
  assert.ok(db.calls.some(c=>c.sql.includes('version+1')));
  assert.ok(!db.calls.some(c=>c.sql.startsWith('UPDATE')||c.sql.startsWith('DELETE')));
  const lines=db.calls.find(c=>c.sql.startsWith('INSERT INTO quotation_service_items'));
  assert.ok(!lines.sql.includes('selected_buy_rate_id'));assert.equal(db.calls.at(-1).sql,'COMMIT');assert.equal(db.released,true);
});
for(const [name,options,revision] of [['stale edit',{},'stale'],['outside region',{source:{region_id:'R2'}},'rev-1'],['not approved',{source:{status:'DRAFT'}},'rev-1'],['already has successor',{latest:2},'rev-1'],['audit failure',{auditFail:true},'rev-1']])test(`phase4 version rollback: ${name}`,async()=>{
  const db=versionDb(options);await assert.rejects(db.service.createQuotationVersion(id,revision,actor));assert.equal(db.calls.at(-1).sql,'ROLLBACK');assert.equal(db.released,true);
});
test('phase4 unauthorized role cannot create version',async()=>{
  const db=versionDb();await assert.rejects(db.service.createQuotationVersion(id,'rev-1',{...actor,role:'OPERATIONS'}));assert.equal(db.calls.length,0);
});
test('phase4 commercial projection strips costs and supplier fields at every level',()=>{
  const {commercialSheetSchema}=createLoader()('src/features/quotation/commercial-sheet.ts');
  const result=commercialSheetSchema.parse({quotationNo:'QT-1',version:1,customerName:'C',taxCode:'',address:'',commodity:'',paymentTermsDays:0,totalSellAmount:200,currency:'VND',totalEstimatedBuy:100,estimatedGp:100,items:[{service:'TRUCKING',inclusion:'INCLUDED',origin:'A',destination:'B',equipment:'40HC',quantity:1,unit:'TRIP',unitPrice:200,amount:200,vendorName:'Secret',buyRate:100}]});
  assert.equal(result.totalEstimatedBuy,undefined);assert.equal(result.estimatedGp,undefined);assert.equal(result.items[0].vendorName,undefined);assert.equal(result.items[0].buyRate,undefined);assert.equal(result.paymentTermsDays,0);
});
test('phase4 approval revalidates expired, changed and conflicting rates',async()=>{
  for(const candidate of [null,{buyRate:101,currency:'VND',fxRateToVnd:1},{buyRate:100,currency:'USD',fxRateToVnd:1}]){
    const load=createLoader({'@/server/modules/supplier-pricing/rate-lookup.service':{lookupRoadRates:async()=>({status:'APPLY',candidates:candidate?[{rateId:id,...candidate}]:[]})}});
    const {validateApprovalRates}=load('src/server/modules/quotation/approval-rates.ts');
    await assert.rejects(validateApprovalRates({query:async()=>({rows:[{selected_buy_rate_id:id,rate_amount:100,original_currency:'VND',fx_rate_to_vnd:1}]})},id),/Giá mua/);
  }
});
test('phase4 print endpoint rejects drafts and users from another region',async()=>{
  for(const row of [{region_id:'R1',status:'DRAFT'},{region_id:'R2',status:'APPROVED'}]){
    const load=createLoader({'@/server/db':{pool:{query:async()=>({rows:[row]})}},'@/server/auth/authorize':{requireAuth:async()=>actor,requireRegionScope:(_,r)=>{if(r!=='R1')throw Error('forbidden');}}});
    assert.equal((await load('src/features/quotation/phase4-actions.ts').getCommercialSheetAction(id)).success,false);
  }
});
