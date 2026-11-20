/* ===== BLACKOUT: Tuya / Smart Life Wi-Fi plugs over the local network =====
   Protocol per tinytuya (MIT): 55AA frames (3.3: CRC32; 3.4: HMAC-SHA256 + session key), 6699 frames (3.5: AES-GCM + session key).
   Needs per plug: IP, device id, local key (16 chars). Discovery: devices broadcast on UDP 6666/6667 (encrypted with a public key). */
var TY={plugs:{},timer:0,found:null,busy:0,log:[]};
var TY_UDPKEY=null;
function tyLog(t,m){TY.log.push(new Date().toTimeString().slice(0,8)+' '+t+' '+m);if(TY.log.length>60)TY.log.shift()}
function tyCfg(){if(!S.plugs)S.plugs=[];return S.plugs}
function tyNet(){var P=window.Capacitor&&Capacitor.Plugins;return P&&P.BoNet&&P.BoNet.tcpOpen?P.BoNet:null}
function tyHex(a){var s='';for(var i=0;i<a.length;i++)s+=('0'+(a[i]&255).toString(16)).slice(-2);return s}
function tyUnhex(h){var a=[];h=String(h||'');for(var i=0;i+1<h.length;i+=2)a.push(parseInt(h.substr(i,2),16));return a}
function tyU32(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]}
function tyRd32(a,i){return ((a[i]<<24)>>>0)+(a[i+1]<<16)+(a[i+2]<<8)+a[i+3]}
function tyStr(s){return Array.prototype.slice.call(new TextEncoder().encode(s))}
function tyTxt(a){return new TextDecoder().decode(new Uint8Array(a))}
var TY_CRCT=(function(){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function tyCrc(a){var c=0xFFFFFFFF;for(var i=0;i<a.length;i++)c=TY_CRCT[(c^a[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
async function tyHmac(key,data){var k=await crypto.subtle.importKey('raw',new Uint8Array(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.prototype.slice.call(new Uint8Array(await crypto.subtle.sign('HMAC',k,new Uint8Array(data))))}
async function tyGcmEnc(key,iv,aad,data){var k=await crypto.subtle.importKey('raw',new Uint8Array(key),'AES-GCM',false,['encrypt']);return Array.prototype.slice.call(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:new Uint8Array(iv),additionalData:new Uint8Array(aad),tagLength:128},k,new Uint8Array(data))))}
async function tyGcmDec(key,iv,aad,data){var k=await crypto.subtle.importKey('raw',new Uint8Array(key),'AES-GCM',false,['decrypt']);return Array.prototype.slice.call(new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(iv),additionalData:new Uint8Array(aad),tagLength:128},k,new Uint8Array(data))))}
function tyRand(n){var a=new Uint8Array(n);crypto.getRandomValues(a);return Array.prototype.slice.call(a)}
var TY_NOHDR=[10,16,18,9,3,4,5,64];
/* --- framing --- */
async function tyPack(sess,cmd,payload){var v=sess.ver,seq=sess.seq++;
 if(v>=3.5){var len=payload.length+12+16,hdr=[0,0,0x66,0x99,0,0].concat(tyU32(seq),tyU32(cmd),tyU32(len)),iv=tyRand(12);
  var ct=await tyGcmEnc(sess.key,iv,hdr.slice(4),payload);return hdr.concat(iv,ct,[0,0,0x99,0x66])}
 var hm=v>=3.4,len2=payload.length+(hm?36:8),d=[0,0,0x55,0xAA].concat(tyU32(seq),tyU32(cmd),tyU32(len2),payload);
 var tail=hm?await tyHmac(sess.key,d):tyU32(tyCrc(d));return d.concat(tail,[0,0,0xAA,0x55])}
async function tyUnpackAll(sess,buf){var out=[],i=0;
 while(i+16<=buf.length){
  if(buf[i]===0&&buf[i+1]===0&&buf[i+2]===0x55&&buf[i+3]===0xAA){var len=tyRd32(buf,i+12),tot=16+len;if(i+tot>buf.length)break;var fr=buf.slice(i,i+tot),cmd=tyRd32(fr,8),hm=sess.ver>=3.4,el=hm?36:8;
   var body=fr.slice(16,tot-el),chk=fr.slice(tot-el,tot-4),good;
   if(hm){var h=await tyHmac(sess.key,fr.slice(0,tot-el));good=tyHex(h)===tyHex(chk)}else good=tyRd32(chk,0)===tyCrc(fr.slice(0,tot-el));
   var ret=0;if(body.length>=4&&body[0]===0&&body[1]===0&&body[2]===0&&body[3]<=1&&!(body[4]===0x7b)){ret=tyRd32(body,0);body=body.slice(4)}
   out.push({cmd:cmd,ret:ret,body:body,good:good});i+=tot;continue}
  if(buf[i]===0&&buf[i+1]===0&&buf[i+2]===0x66&&buf[i+3]===0x99){var len3=tyRd32(buf,i+14),tot3=18+len3+4;if(i+tot3>buf.length)break;var f3=buf.slice(i,i+tot3),cmd3=tyRd32(f3,10),iv=f3.slice(18,30),ct=f3.slice(30,tot3-4),pt=null;
   try{pt=await tyGcmDec(sess.key,iv,f3.slice(4,18),ct)}catch(e){}
   var r3=0;if(pt&&pt.length>=4&&pt[0]===0&&pt[1]===0&&pt[2]===0&&pt[3]<=1&&pt[4]!==0x7b&&pt.length!==48){r3=tyRd32(pt,0);pt=pt.slice(4)}
   out.push({cmd:cmd3,ret:r3,body:pt||[],good:!!pt});i+=tot3;continue}
  i++}
 return out}
function tyVerHdr(v){return tyStr(v.toFixed(1)).concat([0,0,0,0,0,0,0,0,0,0,0,0])}
async function tyEncode(sess,cmd,json){var v=sess.ver,p=tyStr(json);
 if(v>=3.5){if(TY_NOHDR.indexOf(cmd)<0)p=tyVerHdr(v).concat(p);return tyPack(sess,cmd,p)}
 if(v>=3.4){if(TY_NOHDR.indexOf(cmd)<0)p=tyVerHdr(v).concat(p);return tyPack(sess,cmd,AES128.ecbEnc(sess.key,p))}
 var e=AES128.ecbEnc(sess.key,p);if(TY_NOHDR.indexOf(cmd)<0)e=tyVerHdr(v).concat(e);return tyPack(sess,cmd,e)}
function tyDecodeBody(sess,body){var p=body;var vh=tyStr(sess.ver.toFixed(1));
 if(sess.ver>=3.4&&sess.ver<3.5){try{p=AES128.ecbDec(sess.key,p)}catch(e){return null}}
 if(p.length>=15&&p[0]===vh[0]&&p[1]===vh[1]&&p[2]===vh[2])p=p.slice(15);
 if(sess.ver<3.4){if(p[0]!==0x7b){try{p=AES128.ecbDec(sess.key,p)}catch(e){return null}}}
 try{var t=tyTxt(p).replace(/\u0000+$/,'');var a=t.indexOf('{'),b=t.lastIndexOf('}');return a>=0?JSON.parse(t.slice(a,b+1)):null}catch(e){return null}}
/* --- transport --- */
async function tyOpen(plug,ver){var N=tyNet();var r=await N.tcpOpen({host:plug.ip,port:6668,timeout:4000});
 return {id:r.id,ver:ver,seq:1,real:tyStr(plug.key),key:tyStr(plug.key),dev:plug.dev}}
async function tyXfer(sess,frame,timeout){var N=tyNet();tyLog('TX',tyHex(frame).slice(0,64)+'…');await N.tcpWrite({id:sess.id,hex:tyHex(frame)});
 var r=await N.tcpRead({id:sess.id,timeout:timeout||3000,quiet:300});var b=tyUnhex(r&&r.hex);if(b.length)tyLog('RX',tyHex(b).slice(0,64)+'… ('+b.length+' Б)');return b}
async function tyNegotiate(sess){var ln=tyRand(16),v=sess.ver;
 var f1=v>=3.5?await tyPack(sess,3,ln):await tyPack(sess,3,AES128.ecbEnc(sess.real,ln));
 var msgs=await tyUnpackAll(sess,await tyXfer(sess,f1,3000)),m=msgs.filter(function(x){return x.cmd===4})[0];
 if(!m)throw new Error(msgs.length?'розетка відповіла не на запит ключа':'розетка не прийняла запит — перевірте Local Key і версію протоколу');
 if(!m.good)throw new Error('невірний ключ розетки (local key)');
 var p=m.body;if(v<3.5)p=AES128.ecbDec(sess.real,p);if(p.length>48)p=p.slice(p.length-48);if(p.length<48)throw new Error('коротка відповідь сесії');
 var rn=p.slice(0,16),chk=await tyHmac(sess.real,ln);if(tyHex(chk)!==tyHex(p.slice(16,48)))throw new Error('невірний ключ розетки (local key)');
 var h2=await tyHmac(sess.real,rn);var f3=v>=3.5?await tyPack(sess,5,h2):await tyPack(sess,5,AES128.ecbEnc(sess.real,h2));
 await tyNet().tcpWrite({id:sess.id,hex:tyHex(f3)});
 var x=ln.map(function(b,i){return b^rn[i]});
 if(v>=3.5){var g=await tyGcmEnc(sess.real,ln.slice(0,12),[],x);sess.key=g.slice(0,16)}else sess.key=AES128.ecbEnc(sess.real,x,false);
 tyLog('OK','сесію встановлено ('+v+')')}
function tyQueryJson(sess){var t=Math.floor(Date.now()/1000);return sess.ver>=3.4?'{}':JSON.stringify({gwId:sess.dev,devId:sess.dev,uid:sess.dev,t:String(t)})}
function tyCtlJson(sess,dps){var t=Math.floor(Date.now()/1000);return sess.ver>=3.4?JSON.stringify({protocol:5,t:t,data:{dps:dps}}):JSON.stringify({devId:sess.dev,uid:sess.dev,t:String(t),dps:dps})}
async function tySession(plug,ver,fn){var sess=await tyOpen(plug,ver);try{if(ver>=3.4)await tyNegotiate(sess);return await fn(sess)}finally{try{await tyNet().tcpClose({id:sess.id})}catch(e){}}}
async function tyCollect(sess,frames){var b=[];for(var i=0;i<frames.length;i++){b=b.concat(await tyXfer(sess,frames[i],i===frames.length-1?3000:1200))}
 var msgs=await tyUnpackAll(sess,b),dps={},err='';msgs.forEach(function(m){if(!m.good){err='невірний ключ розетки (local key)';return}var j=tyDecodeBody(sess,m.body);if(j){var d=j.dps||(j.data&&j.data.dps);if(d)for(var k in d)dps[k]=d[k];if(/data unvalid|json obj/i.test(JSON.stringify(j)))err='розетка відхилила запит ('+JSON.stringify(j).slice(0,60)+')'}});
 if(!Object.keys(dps).length&&err)throw new Error(err);if(!msgs.length)throw new Error('розетка не відповіла — перевірте Local Key і версію протоколу');return dps}
async function tyRequest(plug,dpsSet){var vers=plug.ver&&plug.ver!=='auto'?[parseFloat(plug.ver)]:(plug.vfound?[plug.vfound]:[3.4,3.3,3.5]),last;
 for(var i=0;i<vers.length;i++){var v=vers[i];try{var dps=await tySession(plug,v,async function(sess){
   var frames=[];if(dpsSet)frames.push(await tyEncode(sess,sess.ver>=3.4?13:7,tyCtlJson(sess,dpsSet)));
   frames.push(await tyEncode(sess,sess.ver>=3.4?16:10,tyQueryJson(sess)));return tyCollect(sess,frames)});
   plug.vfound=v;return dps}catch(e){last=e;tyLog('ERR',v+': '+(e&&e.message||e));if(/timeout|refused|unreachable|no route/i.test(String(e&&e.message)))break}}
 throw last}
/* --- plug state --- */
function tyRead(d){var o={on:typeof d['1']==='boolean'?d['1']:null};
 if(d['20']!=null)o.V=d['20']/10;if(d['19']!=null)o.W=d['19']/10;if(d['18']!=null)o.A=d['18']/1000;if(d['17']!=null)o.kwh=d['17']/1000;return o}
async function tyPoll(i,set){var p=tyCfg()[i];if(!p)return;var st=TY.plugs[p.dev]||(TY.plugs[p.dev]={});if(st.busy)return;
 if(!tyNet()){st.err='потрібна нова версія застосунку (модуль локальної мережі)';tyUi();return}
 if(!p.ip||!p.dev||String(p.key||'').length!==16){st.err='вкажіть IP, Device ID і Local Key (16 символів)';tyUi();return}
 st.busy=1;tyUi();try{var d=await tyRequest(p,set);st.d=tyRead(d);st.raw=d;st.t=Date.now();st.err='';save()}catch(e){st.err=String(e&&e.message||e);
  if(/timeout/i.test(st.err))st.err='немає відповіді — розетка вимкнена з мережі або інша Wi-Fi мережа';else if(/refused/i.test(st.err))st.err='розетка відхилила з’єднання (часто: її вже тримає інший застосунок локально)'}
 st.busy=0;tyUi();try{BO4.sync()}catch(e){}}
function tyToggle(i){var p=tyCfg()[i],st=p&&TY.plugs[p.dev];var on=st&&st.d&&st.d.on;if(on&&!confirm('Вимкнути розетку «'+p.name+'»?'))return;tyPoll(i,{'1':!on})}
function tyStart(){clearInterval(TY.timer);TY.timer=setInterval(function(){if(document.hidden)return;tyCfg().forEach(function(p,i){tyPoll(i)})},15000);tyCfg().forEach(function(p,i){tyPoll(i)})}
/* grid sensor: a plug wired to the city grid only, while the generator session is off */
function tyGrid(){var now=Date.now(),best=null;tyCfg().forEach(function(p){var st=TY.plugs[p.dev];if(p.grid&&st&&st.t&&st.d&&st.d.V!=null&&(!best||st.t>best.t))best={t:st.t,V:st.d.V}});return best}
/* --- discovery --- */
async function tyFind(){var N=tyNet();if(!N||!N.udpListen){TY.err='потрібна нова версія застосунку';tyUi(true);return}
 TY.busy=1;TY.found=null;tyUi(true);var res=[];
 try{var r=await N.udpListen({timeout:7000});if(!TY_UDPKEY){var m=await crypto.subtle.digest('MD5',tyStr('yGAdlopoPVldABfn')).catch(function(){return null});TY_UDPKEY=m?Array.prototype.slice.call(new Uint8Array(m)):tyMd5(tyStr('yGAdlopoPVldABfn'))}
  for(var k=0;k<(r.items||[]).length;k++){var it=r.items[k],b=tyUnhex(it.hex),j=null;
   try{var s={ver:3.3,key:TY_UDPKEY};if(b[2]===0x66){s.ver=3.5;var mm=await tyUnpackAll(s,b);if(mm[0])j=JSON.parse(tyTxt(mm[0].body).replace(/\u0000+$/,'').replace(/^[^{]*/,''))}
    else{var m2=await tyUnpackAll({ver:3.3,key:TY_UDPKEY},b);var body=m2[0]?m2[0].body:b;var t=body[0]===0x7b?tyTxt(body):tyTxt(AES128.ecbDec(TY_UDPKEY,body));j=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1))}}catch(e){}
   if(j&&j.gwId&&!res.some(function(x){return x.dev===j.gwId}))res.push({ip:j.ip||it.ip,dev:j.gwId,ver:j.version||'',pk:j.productKey||''})}
  TY.found=res;tyLog('FIND',JSON.stringify(res))}catch(e){TY.err='пошук: '+(e&&e.message||e)}
 TY.busy=0;tyUi(true)}
/* MD5 (WebCrypto has none) — only for the public discovery key */
function tyMd5(b){function r(x,c){return x<<c|x>>>(32-c)}var K=[],s=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21],i;for(i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
 var m=b.slice(),l=b.length*8;m.push(0x80);while(m.length%64!==56)m.push(0);for(i=0;i<8;i++)m.push((l/Math.pow(2,8*i))&255);var a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
 for(var o=0;o<m.length;o+=64){var M=[];for(i=0;i<16;i++)M[i]=m[o+i*4]|m[o+i*4+1]<<8|m[o+i*4+2]<<16|m[o+i*4+3]<<24;var A=a0,B=b0,C=c0,D=d0;
  for(i=0;i<64;i++){var F,g;if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
   F=(F+A+K[i]+M[g])>>>0;A=D;D=C;C=B;B=(B+r(F,s[(i>>4)*4+i%4]))>>>0}a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0}
 var out=[];[a0,b0,c0,d0].forEach(function(w){for(var j=0;j<4;j++)out.push((w>>>(8*j))&255)});return out}
/* --- Tuya Cloud: fetch local keys once (Access ID/Secret are not saved) --- */
var TY_HOSTS={eu:'openapi.tuyaeu.com',weu:'openapi-weaz.tuyaeu.com',us:'openapi.tuyaus.com',cn:'openapi.tuyacn.com',in:'openapi.tuyain.com'};
async function tySha(s){return tyHex(Array.prototype.slice.call(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(tyStr(s))))))}
async function tyCloud(id,secret,region,path,token){var N=tyNet(),t=String(Date.now()),body='',str='GET\n'+await tySha(body)+'\n\n'+path;
 var sig=tyHex(await tyHmac(tyStr(secret),tyStr(id+(token||'')+t+str))).toUpperCase(),h={client_id:id,sign:sig,t:t,sign_method:'HMAC-SHA256'};if(token)h.access_token=token;
 var r=await N.http({url:'https://'+TY_HOSTS[region]+path,method:'GET',headers:h});var j=JSON.parse(r.body||'{}');if(!j.success)throw new Error(j.msg||('HTTP '+r.status));return j.result}
async function tyCloudKeys(){var id=(document.getElementById('tyaid')||{}).value||'',sec=(document.getElementById('tyasec')||{}).value||'',reg=(document.getElementById('tyreg')||{}).value||'eu';
 if(!tyNet()||!tyNet().http){TY.err='потрібна нова версія застосунку';tyUi(true);return}if(!id||!sec){TY.err='вкажіть Access ID і Access Secret';tyUi(true);return}
 TY.busy=1;TY.err='';tyUi(true);try{var tk=await tyCloud(id.trim(),sec.trim(),reg,'/v1.0/token?grant_type=1');var list=await tyCloud(id.trim(),sec.trim(),reg,'/v1.0/iot-01/associated-users/devices?size=50',tk.access_token);
  var devs=(list.devices||list.list||[]),n=0;devs.forEach(function(d){if(!d.local_key)return;var ex=tyCfg().filter(function(p){return p.dev===d.id})[0];
   if(ex){ex.key=d.local_key;n++}else{var f=(TY.found||[]).filter(function(x){return x.dev===d.id})[0];tyCfg().push({name:d.name||'Розетка',dev:d.id,key:d.local_key,ip:f?f.ip:(d.ip&&/^(10|192\.168|172\.)/.test(d.ip)?d.ip:''),ver:f&&f.ver?f.ver:'auto',grid:false});n++}});
  save();TY.err='';TY.note='отримано ключів: '+n+(n?'':' — у проєкті не знайдено пристроїв (прив’яжіть акаунт Smart Life)');tyLog('CLOUD','devices '+devs.length)}catch(e){TY.err='Tuya Cloud: '+(e&&e.message||e)}
 TY.busy=0;tyUi(true)}
/* --- UI (Підключення › Розетки) --- */
function tyEsc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function tySet(i,k,v){var p=tyCfg()[i];if(!p)return;p[k]=k==='grid'?!!v:String(v).trim();if(k!=='name'&&k!=='grid'){p.vfound=null}save();if(k==='grid')try{BO4.sync()}catch(e){}}
function tyAdd(f){var it=f||{};tyCfg().push({name:'Розетка '+(tyCfg().length+1),ip:it.ip||'',dev:it.dev||'',key:'',ver:it.ver||'auto',grid:false});save();tyUi(true)}
function tyDel(i){var p=tyCfg()[i];if(!p||!confirm('Видалити «'+p.name+'» із застосунку?'))return;tyCfg().splice(i,1);save();tyUi(true)}
function tyCardHtml(){var L=tyCfg(),N=tyNet();
 var h='<div class="card" id="tycard"><h2>Розетки · Wi-Fi <span class="mut" style="font-size:11px">Smart Life / Tuya</span></h2>';
 if(!N)h+='<div class="mut" style="font-size:12px;color:var(--warn,#EFB34F);margin-bottom:8px">У цій версії застосунку немає модуля локальної мережі — встановіть нову збірку.</div>';
 L.forEach(function(p,i){var st=TY.plugs[p.dev]||{},d=st.d||{};
  h+='<div class="typ"><div class="typh"><input class="tyname" value="'+tyEsc(p.name)+'" onchange="tySet('+i+',\'name\',this.value)">'
   +'<button class="act tg'+(d.on?' on':'')+'" '+(st.busy||d.on==null?'disabled':'')+' onclick="tyToggle('+i+')" aria-label="Увімкнути або вимкнути"><i></i></button></div>'
   +'<div class="mut tyst">'+(st.busy?'зв’язок…':st.err?'<span style="color:var(--bad,#EF665B)">'+tyEsc(st.err)+'</span>':st.t?(d.on?'увімкнена':'вимкнена')+(d.V!=null?' · '+d.V.toFixed(0)+' В':'')+(d.A!=null?' · '+d.A.toFixed(2).replace('.',',')+' А':'')+(d.W!=null?' · '+d.W.toFixed(0)+' Вт':'')+' · '+Math.round((Date.now()-st.t)/1000)+' с тому':'ще не опитувалась')+'</div>'
   +'<details'+(p.key?'':' open')+'><summary class="mut" style="font-size:12px">Налаштування</summary>'
   +'<div class="invf"><label>IP<input inputmode="decimal" placeholder="192.168.1.60" value="'+tyEsc(p.ip)+'" onchange="tySet('+i+',\'ip\',this.value)"></label><label>Версія<select onchange="tySet('+i+',\'ver\',this.value)">'+['auto','3.3','3.4','3.5'].map(function(v){return '<option value="'+v+'"'+(String(p.ver)===v?' selected':'')+'>'+(v==='auto'?'авто':v)+'</option>'}).join('')+'</select></label></div>'
   +'<label class="mut" style="font-size:12px">Device ID<input value="'+tyEsc(p.dev)+'" onchange="tySet('+i+',\'dev\',this.value)"></label>'
   +'<label class="mut" style="font-size:12px">Local Key (16 символів)<input value="'+tyEsc(p.key)+'" autocomplete="off" onchange="tySet('+i+',\'key\',this.value)"></label>'
   +'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:8px 0"><input type="checkbox" style="width:auto"'+(p.grid?' checked':'')+' onchange="tySet('+i+',\'grid\',this.checked)">Живиться лише від міської мережі — датчик «є світло»</label>'
   +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="sm" onclick="tyPoll('+i+')">Перевірити</button><button class="sm" onclick="tyDel('+i+')">Видалити</button></div></details></div>'});
 h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="sm" onclick="tyFind()"'+(TY.busy?' disabled':'')+'>Знайти розетки в мережі</button><button class="sm" onclick="tyAdd()">Додати вручну</button></div>';
 if(TY.found)h+='<div style="margin-top:8px">'+(TY.found.length?TY.found.map(function(f,k){var have=tyCfg().some(function(p){return p.dev===f.dev});return '<button class="sm" style="margin:0 6px 6px 0"'+(have?' disabled':'')+' onclick=\'tyAdd('+JSON.stringify(f).replace(/'/g,'&#39;')+')\'>'+tyEsc(f.ip)+' · '+tyEsc(f.ver||'?')+(have?' · додана':' · додати')+'</button>'}).join(''):'<span class="mut">не знайдено — розетка має бути в тій самій Wi-Fi мережі; можна додати вручну</span>')+'</div>';
 h+='<details style="margin-top:10px"><summary class="mut" style="font-size:12px">Отримати Local Key з Tuya Cloud</summary>'
  +'<div class="mut" style="font-size:12px;line-height:1.5;margin:6px 0">1) iot.tuya.com → Cloud → Create Cloud Project (Smart Home, дата-центр Central Europe).<br>2) У проєкті: Devices → Link App Account → відскануйте QR у Smart Life (Я → значок сканера).<br>3) Overview: скопіюйте Access ID і Access Secret сюди. Секрет не зберігається.</div>'
  +'<label class="mut" style="font-size:12px">Access ID<input id="tyaid" autocomplete="off"></label><label class="mut" style="font-size:12px">Access Secret<input id="tyasec" type="password" autocomplete="off"></label>'
  +'<label class="mut" style="font-size:12px">Дата-центр<select id="tyreg"><option value="eu">Central Europe</option><option value="weu">Western Europe</option><option value="us">Western America</option><option value="in">India</option><option value="cn">China</option></select></label>'
  +'<button class="sm" style="margin-top:8px" onclick="tyCloudKeys()"'+(TY.busy?' disabled':'')+'>Отримати ключі</button></details>';
 if(TY.err)h+='<div style="color:var(--bad,#EF665B);font-size:12.5px;margin-top:8px">'+tyEsc(TY.err)+'</div>';if(TY.note)h+='<div class="mut" style="font-size:12.5px;margin-top:8px">'+tyEsc(TY.note)+'</div>';
 h+='<details style="margin-top:8px"><summary class="mut" style="font-size:12px">Журнал обміну</summary><pre style="white-space:pre-wrap;word-break:break-all;font-size:10.5px;max-height:200px;overflow:auto">'+tyEsc(TY.log.slice(-16).join('\n'))+'</pre></details></div>';
 return h}
function tyUi(full){var e=document.getElementById('tycard');if(!e)return;var a=document.activeElement;if(!full&&a&&e.contains(a)&&/INPUT|SELECT/.test(a.tagName))return;
 var t=document.createElement('div');t.innerHTML=tyCardHtml();var n=t.firstChild;var open=[].map.call(e.querySelectorAll('details'),function(d){return d.open});e.replaceWith(n);[].forEach.call(n.querySelectorAll('details'),function(d,i){if(open[i]!=null)d.open=open[i]});try{btgApply(false)}catch(x){}}
if(typeof module!=='undefined')module.exports={tyPack:tyPack,tyUnpackAll:tyUnpackAll,tyEncode:tyEncode,tyDecodeBody:tyDecodeBody,tyRequest:tyRequest,tyRead:tyRead,tyMd5:tyMd5,TY:TY};
