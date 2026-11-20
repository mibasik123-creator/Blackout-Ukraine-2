const {chromium}=require('playwright'),cr=require('crypto'),fs=require('fs');const KD=fs.readFileSync('/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/kd.bin');
const UID='1234567',SN=process.env.SN||'R651ZEB4XF123456',V2=/^R61|^R60|^R62|^R33|^R35|^D36/.test(SN),MODE=process.argv[2]||'ok';
function c8(a){let c=0;for(const x of a){c^=x;for(let j=0;j<8;j++)c=c&128?((c<<1)^7)&255:(c<<1)&255}return c}
function c16(a){let c=0;for(const x of a){c^=x;for(let j=0;j<8;j++)c=c&1?(c>>>1)^0xA001:c>>>1}return c}
function enc(ft,pl){const d=[0x5a,0x5a,ft<<4,1,(pl.length+2)&255,(pl.length+2)>>8,...pl];const k=c16(d);d.push(k&255,k>>8);return d}
function pkt(src,dst,cs,ci,pl,ver,seq){let p=pl;if(ver&0x10)p=pl.map(x=>x^seq);const d=[0xaa,ver,p.length&255,p.length>>8];d.push(c8(d));d.push(0x0d,seq,0,0,0,0,0,src,dst,...((ver&15)>=3?[1,1]:[]),cs,ci,...p);const k=c16(d);d.push(k&255,k>>8);return d}
function aesE(k,iv,pt){const c=cr.createCipheriv('aes-128-cbc',Buffer.from(k),Buffer.from(iv));return [...Buffer.concat([c.update(Buffer.from(pt)),c.final()])]}
function aesD(k,iv,ct){const c=cr.createDecipheriv('aes-128-cbc',Buffer.from(k),Buffer.from(iv));return [...Buffer.concat([c.update(Buffer.from(ct)),c.final()])]}
const md5=b=>[...cr.createHash('md5').update(Buffer.from(b)).digest()];
function pbF(f,v){const key=f*8+5,r=[];let k=key;do{let b=k&127;k=Math.floor(k/128);if(k)b|=128;r.push(b)}while(k);const bb=Buffer.alloc(4);bb.writeFloatLE(v);return [...r,...bb]}
function pbV(f,v){const r=[];let k=f*8;do{let b=k&127;k=Math.floor(k/128);if(k)b|=128;r.push(b)}while(k);do{let b=v&127;v=Math.floor(v/128);if(v)b|=128;r.push(b)}while(v);return r}
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:393,height:851}});const p=await c.newPage();const errs=[],log=[];p.on('pageerror',e=>errs.push(e.message));
let dev={ses:null},buf=[];
async function notify(bytes){for(let i=0;i<bytes.length;i+=20){const ch=bytes.slice(i,i+20);await p.evaluate(h=>window.__emit(h),Buffer.from(ch).toString('hex'))}}
await p.exposeFunction('__devWrite',async hex=>{const a=[...Buffer.from(hex.replace(/ /g,''),'hex')];const L=a[4]|a[5]<<8,pl=a.slice(6,6+L-2),ft=a[2]>>4;
 if(ft===0&&pl[0]===1){const e=cr.createECDH('secp160r1');e.generateKeys();const sh=[...e.computeSecret(Buffer.from([4,...pl.slice(2,42)]))];dev.k=sh.slice(0,16);dev.iv=md5(sh);log.push('dev:pub');setTimeout(()=>notify(enc(0,[1,0,0,...e.getPublicKey().slice(1)])),30);return}
 if(ft===0&&pl[0]===2){const srand=[...cr.randomBytes(16)],seed=[3,7];const pos=seed[0]*16+((seed[1]-1)&255)*256;dev.ses=md5([...KD.slice(pos,pos+16),...srand]);log.push('dev:keyinfo');
  if(MODE==='badkey')dev.ses=md5([...srand,...srand]);setTimeout(()=>notify(enc(0,[2,...aesE(dev.k,dev.iv,[...srand,...seed])])),30);return}
 if(ft===1){let d;try{d=aesD(dev.ses,dev.iv,pl)}catch(e){log.push('dev:decrypt-fail');return}const dv=d[1]&15;if(V2!==(dv===2)){log.push('dev:WRONG-VERSION v'+dv+' -> disconnect');return}const st=dv===2?16:18,ci=d[st-1],ppl=d.slice(st,st+(d[2]|d[3]<<8));log.push('dev:pkt v'+dv+' '+ci.toString(16));const PV=V2?2:3;
  const send=x=>notify(enc(1,aesE(dev.ses,dev.iv,x)));
  if(ci===0x89)setTimeout(()=>send(pkt(0x35,0x21,0x35,0x89,[0],PV,0)),30);
  if(ci===0x86){const exp=Buffer.from(md5([...Buffer.from(UID+SN)])).toString('hex').toUpperCase();const good=Buffer.from(ppl).toString()===exp&&MODE!=='reject';log.push('dev:auth '+(good?'good':'bad'));
   setTimeout(async()=>{await send(pkt(0x35,0x21,0x35,0x86,[good?0:6],PV,0));if(good&&V2){const h=new Array(40).fill(0);h[14]=64;h[15]=210;h[16]=1;h[17]=95;h[18]=0;await send(pkt(0x02,0x20,0x20,0x02,h,2,0))}else if(good){await send(pkt(0x02,0x20,0xfe,0x15,[...pbF(262,87.5),...pbF(3,120),...pbF(4,45.25),...pbV(269,30),...pbV(268,300)],0x13,0x5c));
    setTimeout(()=>send(pkt(0x02,0x20,0xfe,0x15,[...pbF(4,239)],3,0)),400)}},30)}}});
await c.addInitScript(`var L={};window.__emit=function(h){Object.keys(L).forEach(function(k){if(k.indexOf('notification')==0&&k.indexOf('00000003')>0)L[k]({value:h})})};
window.Capacitor={Plugins:{BluetoothLe:{initialize:async()=>{},requestDevice:async()=>({deviceId:'EF:01',name:'EF-R10807'}),connect:async()=>{},disconnect:async()=>{},
 addListener:(k,f)=>{L[k]=f;return Promise.resolve({remove:function(){}})},startNotifications:async o=>{if(o.service.indexOf('00000001-')!==0)throw new Error('nf')},
 write:async o=>{if(o.service.indexOf('00000001-')===0)await window.__devWrite(o.value)}}}};
try{localStorage.setItem('blackout_v1',JSON.stringify({gens:[{n:'FORTE FG6500',lph:1.8,svc:50,h:0,last:0}],sts:[{n:'EcoFlow',wh:256}],ses:[],logs:[],fills:[],bt:{a:'11',n:80,p:[56,10],pd:1,w:[39,1],wd:1,i:[6,1],id:1,ef:{uid:'${UID}',devs:{'EF:01':{sn:'${SN}',et:7}}}}}))}catch(e){}`);
await p.goto('file:///tmp/claude-0/t.html');await p.waitForTimeout(1200);await p.evaluate(()=>{BLon=1;BL=[];BLt0=Date.now();btConnect()});await p.waitForTimeout(9000);
const r=await p.evaluate(()=>({st:EF.st,err:EF.err,auth:EF.auth,pct:BT.pct,w:BT.w,wi:BT.wi,tf:BT.tf,te:BT.te,model:EF.model}));console.log(MODE,JSON.stringify(r));console.log(log.join(' | '));
await p.evaluate(()=>setTab('bt'));await p.waitForTimeout(400);console.log('card:',await p.evaluate(()=>{var e=document.getElementById('efcard');return e?e.innerText.replace(/\s+/g,' '):'NONE'}));
if(MODE==='ok'){await p.evaluate(()=>{var e=document.getElementById('efcard');e&&e.scrollIntoView()});await p.screenshot({path:'/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/efcard.png'})}
console.log('blog:',await p.evaluate(()=>BL.filter(x=>/EF|ERR/.test(x.m||x[1]||JSON.stringify(x))).slice(-6).map(x=>JSON.stringify(x).slice(0,140))));console.log(errs);await b.close()})()
