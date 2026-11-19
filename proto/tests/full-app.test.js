/* BLACKOUT 4.0 full test build: real app code + Fossibot BLE mock + Tesla data injection */
const {chromium,devices}=require('playwright');
const FILE='file:///home/claude/blackout-ukraine-2/proto/overview-4.0-full.html',D='/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/p4/';
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['Pixel 7']});const errs=[];
await c.addInitScript(`window.__tx=[];window.__st={41:(1<<11),56:725,39:0,6:549,21:2290,22:5000,58:85,59:0};var L={};
function crc(b){var c=65535;for(var i=0;i<b.length;i++){c^=b[i];for(var j=0;j<8;j++)c=c&1?(c>>1)^40961:c>>1}return c}
function hx(a){return a.map(function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
function rx(h){h=h.replace(/ /g,'');var a=[];for(var i=0;i<h.length;i+=2)a.push(parseInt(h.substr(i,2),16));return a}
function emit(a){Object.keys(L).forEach(function(k){if(k.indexOf('notification')==0)L[k]({value:hx(a)})})}
window.__silent=false;
window.Capacitor={Plugins:{BluetoothLe:{initialize:async()=>{},requestDevice:async()=>({deviceId:'08:92',name:'POWER-0084'}),connect:async()=>{},
 addListener:(k,f)=>{L[k]=f;return Promise.resolve({})},startNotifications:async o=>{if(o.service.indexOf('a002')<0)throw new Error('nf')},disconnect:async()=>{},
 write:async o=>{var a=rx(o.value);__tx.push(o.value);if(window.__silent)return;if(a[1]==4){var f=[17,4,0,0,0,80];for(var i=0;i<80;i++){var x=__st[i]||0;f.push(x>>8,x&255)}var k=crc(f);f.push(k>>8,k&255);setTimeout(()=>emit(f),30)}}}}};
try{localStorage.setItem('blackout_v1',JSON.stringify({lang:'uk',locs:['Дніпро'],loc:0,users:['Михайло'],usr:0,gens:[{n:'FORTE FG6500',lph:1.8,svc:50,h:0,last:0}],sts:[{n:'Fossibot F2400',wh:2048}],ses:[],logs:[],fills:[{g:'FORTE FG6500',l:20,t:Date.now()-86400000}],bt:{a:'11',n:80,p:[56,10],pd:1,w:[39,1],wd:1,i:[6,1],id:1},tesla:{vin:'7SAYGDEE1MF000001',color:'#A3141E'}}))}catch(e){}`);
const p=await c.newPage();p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
await p.goto(FILE);await p.waitForTimeout(1500);
const snap=async(name)=>{await p.waitForTimeout(2600);const r=await p.evaluate(()=>{const R=BlackoutTel.result(),h=document.getElementById('bo4host'),sr=h&&h.shadowRoot,g=id=>sr&&sr.getElementById(id)?sr.getElementById(id).textContent:null;
  const fl={};if(R)for(const k in R.flows){if(R.flows[k].state!=='idle')fl[k]=R.flows[k].state+(R.flows[k].w!=null?' '+Math.round(R.flows[k].w):'')}
  return{attached:!!(h&&h.isConnected),status:g('pillt'),meta:sr&&sr.querySelector('.meta').textContent,pct:g('pct'),mode:g('mode'),eta:g('eta'),vin:g('vin'),vout:g('vout'),gline:g('gline'),st:g('stname'),gen:g('gname')+' / '+g('gst'),car:g('cname')+' / '+g('cst')+' / '+g('cpct'),carlbl:g('carlbl'),feed:R&&R.feed,states:R&&R.states,flows:fl,issues:R&&R.issues.map(i=>i.code)}});
  console.log(name.padEnd(10),JSON.stringify(r));await p.screenshot({path:D+'f_'+name+'.png',fullPage:true});return r};
await snap('nobt');
await p.evaluate(()=>btConnect());await snap('grid');
/* outage: no AC input, station feeds the house */
await p.evaluate(()=>{Object.assign(__st,{6:0,21:0,22:0,39:420,59:205})});await snap('outage');
/* generator session started in the app, AC input back (from the generator) */
await p.evaluate(()=>{startG();Object.assign(__st,{6:910,21:2300,22:5010,39:0,59:0,58:64})});await snap('gen');
await p.evaluate(()=>{var g=S.gens[S.g];S.run=null;save();render();Object.assign(__st,{6:549,21:2290,22:5000})});
/* Tesla charging while grid is present */
await p.evaluate(()=>{TS.on=1;TS.d={pct:64,kw:7,v:230,a:32,lim:80,min:95,st:5,t:Date.now()}});await snap('tesla');
/* station stops answering (no frames) -> data ages to stale */
await p.evaluate(()=>{window.__silent=true});await p.waitForTimeout(14000);await snap('stalest');
/* station disconnected */
await p.evaluate(()=>{window.__silent=false;btDown()});await snap('btdown');
/* every other tab still renders, overview detached and paused */
for(const t of ['gen','st','hist','bt','set']){await p.evaluate(t=>setTab(t),t);await p.waitForTimeout(500);const o=await p.evaluate(()=>({tab,attached:!!(document.getElementById('bo4host')||{}).isConnected,running:document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.target&&a.effect.target.closest&&!document.contains(a.effect.target)).length,cards:document.querySelectorAll('#app .card').length,bg:getComputedStyle(document.body).backgroundColor,fail:!!document.querySelector('#app .rfail')}));console.log('tab',JSON.stringify(o));await p.screenshot({path:D+'f_tab_'+t+'.png'})}
await p.evaluate(()=>setTab('pan'));await p.waitForTimeout(800);
const back=await p.evaluate(()=>{const sr=document.getElementById('bo4host').shadowRoot;return{attached:document.getElementById('bo4host').isConnected,anims:sr.getAnimations?sr.getAnimations().map(a=>a.playState):document.getAnimations().map(a=>a.playState)}});console.log('back to home',JSON.stringify(back));
/* the rest of the home screen is still there */
const rest=await p.evaluate(()=>({powerButtons:document.querySelectorAll('#app button.pw').length,schedule:!!document.querySelector('#app .sch, #app [id^=sch]'),stats:!!document.querySelector('#app .stats'),locSelect:!!document.querySelector('#app .locrow select'),oldHero:!!document.getElementById('pbhero'),oldCar:!!document.getElementById('tshome')}));console.log('home rest',JSON.stringify(rest));
/* generator start/stop from the home screen button */
await p.evaluate(()=>document.querySelector('#app button.pw').click());await p.waitForTimeout(2600);console.log('gen via button',await p.evaluate(()=>({run:!!S.run,gst:document.getElementById('bo4host').shadowRoot.getElementById('gst').textContent})));
await p.evaluate(()=>{S.run=null;save();render()});
for(const w of [360,390,430]){await p.setViewportSize({width:w,height:860});await p.waitForTimeout(300);console.log('width',w,await p.evaluate(()=>{const de=document.documentElement,sr=document.getElementById('bo4host').shadowRoot;return{overflow:de.scrollWidth-de.clientWidth,clipped:[...sr.querySelectorAll('.pw b,.row .v,.status,.meta,.row b')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent)}}))}
await p.setViewportSize({width:412,height:915});await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(500);await p.screenshot({path:D+'f_home_top.png'});
console.log('ERRORS',JSON.stringify(errs));await b.close()})();
