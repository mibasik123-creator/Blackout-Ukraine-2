/* Automated tests for the BLACKOUT 4.0 Energy Balance Engine (node engine.test.js) */
const fs=require('fs'),path=require('path');const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'..','overview-4.0-v5.html'),'utf8');const src=html.match(/\/\*ENGINE-START\*\/([\s\S]*?)\/\*ENGINE-END\*\//)[1];const m={exports:{}};new Function('module',src)(m);const E=m.exports;
const now=1_000_000_000;let pass=0,fail=0;const fails=[];
function t(name,raw,check){let r;try{r=E.computeBalance(raw,now);check(r)}catch(e){fail++;fails.push(name+': '+e.message);return}pass++}
function eq(a,b,m){if(a!==b)throw new Error((m||'')+' expected '+JSON.stringify(b)+' got '+JSON.stringify(a))}
function ok(c,m){if(!c)throw new Error(m||'assert')}
const fresh={t:now-1000};
const ST=(o)=>Object.assign({pct:72,inW:0,outW:0,tf:null,te:null},fresh,o),GR=(on,o)=>Object.assign({on:on,V:on?229:0},fresh,o),GN=(on,o)=>Object.assign({on:on,fuel:62},fresh,o),CAR=(o)=>Object.assign({pct:64,kW:0,st:7},fresh,o),HM=(w,o)=>Object.assign({W:w},fresh,o);
const active=r=>Object.keys(r.flows).filter(k=>r.flows[k].state==='on'||r.flows[k].state==='supply').sort().join(',');
const noIssue=(r,code)=>ok(!r.issues.some(i=>i.code===code),'unexpected issue '+code);
const hasIssue=(r,code)=>ok(r.issues.some(i=>i.code===code),'missing issue '+code+' in '+JSON.stringify(r.issues.map(i=>i.code)));

/* 1 grid present */
t('1 grid',{station:ST({inW:549,tf:85}),grid:GR(true),gen:GN(false),home:HM(1180),car:CAR()},r=>{eq(r.feed,'grid');eq(active(r),'gridhome,gridst');eq(r.flows.gridst.w,549);eq(r.flows.gridhome.w,1180);eq(r.grid.load,1729);eq(r.station.mode,'charging');eq(r.status.text,'Система ОК');eq(r.flows.use.state,'idle')});
/* 2 outage */
t('2 outage',{station:ST({outW:420,te:205}),grid:GR(false),gen:GN(false),car:CAR()},r=>{eq(r.feed,'station');eq(active(r),'use');eq(r.flows.use.w,420);eq(r.home.W,420,'home = station output in outage');eq(r.station.mode,'discharging');eq(r.station.forecast.min,205);eq(r.status.text,'Відключення')});
/* 3 generator running, station not charging */
t('3 gen',{station:ST({}),grid:GR(false),gen:GN(true),home:HM(780),car:CAR()},r=>{eq(r.feed,'gen');eq(active(r),'genhome');eq(r.flows.genst.state,'idle');eq(r.gen.load,780);eq(r.flows.use.state,'idle')});
/* 4 generator charges station */
t('4 gen+station',{station:ST({inW:910,tf:64}),grid:GR(false),gen:GN(true),home:HM(780),car:CAR()},r=>{eq(active(r),'genhome,genst');eq(r.gen.load,1690,'gen load = home + station input');eq(r.status.text,'Відключення · генератор')});
/* 5 Tesla from grid */
t('5 tesla grid',{station:ST({inW:549}),grid:GR(true),gen:GN(false),home:HM(650),car:CAR({kW:7.2,st:5,src:'grid'})},r=>{eq(active(r),'gridcar,gridhome,gridst');eq(r.flows.gridcar.w,7200);eq(r.flows.gridst.w,549,'car power must not mix with station input');eq(r.grid.load,650+549+7200)});
/* 6 station lost Bluetooth */
t('6 station offline',{station:ST({inW:549,link:false}),grid:GR(true),gen:GN(false),home:HM(640),car:CAR({kW:7.2,st:5})},r=>{eq(r.states.station,'OFFLINE');eq(r.flows.gridst.state,'stale');eq(r.flows.gridhome.state,'on');eq(r.flows.gridcar.state,'on','car flow independent of station');eq(r.station.mode,null);eq(r.status.text,'Станція без зв’язку');eq(r.grid.load,null,'total needs station input')});
/* 7 generator lost link, outage */
t('7 gen offline',{station:ST({outW:400}),grid:GR(false),gen:GN(true,{link:false}),car:CAR()},r=>{eq(r.states.gen,'OFFLINE');eq(r.feed,'station');eq(r.flows.genhome.state,'stale');hasIssue(r,'gen_unknown')});
/* 8 grid lost link */
t('8 grid stale',{station:ST({outW:300}),grid:GR(true,{t:now-60000}),gen:GN(false),car:CAR()},r=>{eq(r.states.grid,'STALE');eq(r.feed,'station');eq(r.flows.gridhome.state,'stale');eq(r.flows.gridst.state,'idle');hasIssue(r,'grid_unknown')});
/* 9 contradictory telemetry */
t('9 contradictions',{station:ST({pct:104,inW:900,outW:2000}),grid:GR(false),gen:GN(true),home:HM(800),car:CAR({kW:1.8,st:5,src:'station'})},r=>{eq(r.feed,'gen');eq(r.station.pct,null,'SOC out of range rejected');hasIssue(r,'soc_range_станція');hasIssue(r,'st_out_ignored');hasIssue(r,'car_from_station');eq(r.flows.use.state,'idle');eq(r.flows.gridcar.state,'idle');ok(!('stcar' in r.flows),'station->car line must not exist')});
/* 10 no data */
t('10 no data',{},r=>{eq(r.feed,'unknown');eq(active(r),'');eq(r.status.text,'Немає даних');eq(r.station.pct,null);eq(r.station.mode,null);eq(r.gen.load,null);eq(r.grid.load,null)});
/* 11 generator and grid both confirmed */
t('11 conflict',{station:ST({inW:600}),grid:GR(true),gen:GN(true),home:HM(700),car:CAR()},r=>{eq(r.feed,'conflict');hasIssue(r,'conflict');eq(active(r),'');['genhome','genst','gridhome','gridst'].forEach(k=>eq(r.flows[k].state,'conflict'));eq(r.status.text,'Конфлікт джерел');eq(r.gen.load,null);eq(r.grid.load,null)});
/* 12 zero load in outage */
t('12 zero',{station:ST({}),grid:GR(false),gen:GN(false),car:CAR()},r=>{eq(r.feed,'none');eq(active(r),'');eq(r.station.mode,'idle');eq(r.station.forecast,null)});
/* 13 minimal load */
t('13 minimal',{station:ST({outW:12,te:9000}),grid:GR(false),gen:GN(false),car:CAR()},r=>{eq(r.feed,'station');eq(r.flows.use.w,12);eq(active(r),'use')});
t('13b below threshold',{station:ST({outW:3}),grid:GR(false),gen:GN(false),car:CAR()},r=>{eq(r.feed,'none');eq(active(r),'')});
/* 14 overload */
t('14 overload',{station:ST({outW:2650,te:30}),grid:GR(false),gen:GN(false),car:CAR()},r=>{hasIssue(r,'overload');eq(r.flows.use.state,'on');eq(r.flows.use.w,2650,'measured value kept');eq(r.status.text,'Помилка даних')});
/* edges */
t('charging not blocked by output limit',{station:ST({inW:3000,tf:20}),grid:GR(true),gen:GN(false),home:HM(500)},r=>{noIssue(r,'overload');eq(r.flows.gridst.w,3000)});
t('home unknown on grid -> supply, no totals',{station:ST({inW:500}),grid:GR(true),gen:GN(false)},r=>{eq(r.flows.gridhome.state,'supply');eq(r.flows.gridhome.w,null);eq(r.grid.load,null)});
t('home unknown on gen -> supply',{station:ST({inW:500}),grid:GR(false),gen:GN(true)},r=>{eq(r.flows.genhome.state,'supply');eq(r.gen.load,null)});
t('NaN and negatives rejected',{station:ST({inW:NaN,outW:-50,pct:'x'}),grid:GR(true),gen:GN(false),home:HM(-10)},r=>{eq(r.station.inW,null);eq(r.station.outW,null);eq(r.station.pct,null);eq(r.home.W,null);hasIssue(r,'neg_станція_вихід')});
t('SOC bounds 0 and 100 valid',{station:ST({pct:100})},r=>eq(r.station.pct,100));
t('SOC 0 valid',{station:ST({pct:0})},r=>eq(r.station.pct,0));
t('SOC -1 invalid',{station:ST({pct:-1})},r=>eq(r.station.pct,null));
t('stale station keeps last value but not online',{station:ST({pct:55,outW:300,t:now-20000}),grid:GR(false),gen:GN(false)},r=>{eq(r.states.station,'STALE');eq(r.station.pct,55);eq(r.station.mode,null);eq(r.station.forecast,null);eq(r.flows.use.state,'stale','unknown, not idle and not on')});
t('limits per source',{station:ST({t:now-14000}),grid:GR(true,{t:now-29000}),gen:GN(false,{t:now-31000}),car:CAR({t:now-119000}),home:HM(1,{t:now-30001})},r=>{eq(r.states.station,'ONLINE');eq(r.states.grid,'ONLINE');eq(r.states.gen,'STALE');eq(r.states.car,'ONLINE');eq(r.states.home,'STALE')});
t('car charging without grid -> no flow',{station:ST({outW:300}),grid:GR(false),gen:GN(false),car:CAR({kW:7.2,st:5})},r=>{eq(r.flows.gridcar.state,'idle');hasIssue(r,'car_src_unknown')});
t('car stale while charging -> stale line',{grid:GR(true),car:CAR({kW:7.2,st:5,t:now-200000})},r=>eq(r.flows.gridcar.state,'stale'));
t('grid on with null state flagged',{grid:{on:'?',t:now}},r=>{hasIssue(r,'grid_state');eq(r.feed,'unknown')});
t('missing timestamp -> UNKNOWN',{station:{pct:50,inW:0,outW:0,t:undefined,link:true}},r=>eq(r.states.station,'UNKNOWN'));
t('forecast missing -> null minutes, not 0',{station:ST({inW:600}),grid:GR(true)},r=>{eq(r.station.forecast.kind,'full');eq(r.station.forecast.min,null)});
/* store: rendering never changes timestamps */
(function(){const s=new E.TelemetryStore();s.set('station',{pct:1},now-5000);const t0=s.get('station').t;E.computeBalance(s.snapshot(),now);E.computeBalance(s.snapshot(),now+100000);
 if(s.get('station').t===t0)pass++;else{fail++;fails.push('store timestamp changed')}
 s.markOffline('station');if(s.get('station').link===false&&s.get('station').t===t0)pass++;else{fail++;fails.push('markOffline')}})();
console.log('engine tests: '+pass+' passed, '+fail+' failed');fails.forEach(f=>console.log('  FAIL '+f));process.exit(fail?1:0);
