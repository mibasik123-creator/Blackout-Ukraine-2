/* ===== EcoFlow BLE (encrypt type 7): port of the open ha-ef-ble handshake =====
   Steps: ECDH secp160r1 -> AES key, key-info -> session key (keydata table), auth status,
   auth md5(userId+SN). Data: protobuf DisplayPropertyUpload (cmd FE/15). Read-only. */
var EFS='00000001-0000-1000-8000-00805f9b34fb',EFW='00000002-0000-1000-8000-00805f9b34fb',EFN='00000003-0000-1000-8000-00805f9b34fb';
var EF={on:0,st:'',err:'',buf:[],q:[],key:null,iv:null,ses:0,auth:0,d:{},sn:'',model:''};
function efCfg(){var c=BC();c.ef=c.ef||{};c.ef.devs=c.ef.devs||{};return c.ef}

/* ---- checksums ---- */
function efC8(a){var c=0;for(var i=0;i<a.length;i++){c^=a[i];for(var j=0;j<8;j++)c=c&128?((c<<1)^7)&255:(c<<1)&255}return c}
function efC16(a){var c=0;for(var i=0;i<a.length;i++){c^=a[i];for(var j=0;j<8;j++)c=c&1?(c>>>1)^0xA001:c>>>1}return c}

/* ---- MD5 (bytes -> 16 bytes) ---- */
function efMd5(b){var K=[],S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21],i;for(i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
 var l=b.length,m=b.slice();m.push(128);while(m.length%64!=56)m.push(0);var bl=(l*8)>>>0;for(i=0;i<4;i++)m.push((bl>>>(8*i))&255);for(i=0;i<4;i++)m.push(i==0?Math.floor(l/536870912)&255:0);
 var a0=0x67452301,b0=0xefcdab89|0,c0=0x98badcfe|0,d0=0x10325476;
 for(var o=0;o<m.length;o+=64){var M=[];for(i=0;i<16;i++)M[i]=m[o+4*i]|m[o+4*i+1]<<8|m[o+4*i+2]<<16|m[o+4*i+3]<<24;var A=a0,B=b0,C=c0,D=d0;
  for(i=0;i<64;i++){var F,g;if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
   F=(F+A+K[i]+M[g])|0;A=D;D=C;C=B;var s=S[(i>>4)*4+(i&3)];B=(B+((F<<s)|(F>>>(32-s))))|0}
  a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0}
 var r=[];[a0,b0,c0,d0].forEach(function(v){for(var j=0;j<4;j++)r.push((v>>>(8*j))&255)});return r}
function efStrB(s){var r=[];for(var i=0;i<s.length;i++)r.push(s.charCodeAt(i)&255);return r}

/* ---- AES-128 CBC ---- */
var EFA=(function(){function gm(a,b){var p=0;for(var i=0;i<8;i++){if(b&1)p^=a;var h=a&128;a=(a<<1)&255;if(h)a^=0x1b;b>>=1}return p}
 var S=[],Si=[],x;for(x=0;x<256;x++){var inv=0;if(x){for(var y=1;y<256;y++)if(gm(x,y)==1){inv=y;break}}var s=inv,r=inv;for(var k=0;k<4;k++){r=((r<<1)|(r>>7))&255;s^=r}s^=0x63;S[x]=s;Si[s]=x}
 var M2=[],M3=[],M9=[],M11=[],M13=[],M14=[];for(x=0;x<256;x++){M2[x]=gm(x,2);M3[x]=gm(x,3);M9[x]=gm(x,9);M11[x]=gm(x,11);M13[x]=gm(x,13);M14[x]=gm(x,14)}
 function kx(k){var w=k.slice(0,16),rc=1;for(var i=16;i<176;i+=4){var t=w.slice(i-4,i);if(i%16==0){t=[S[t[1]]^rc,S[t[2]],S[t[3]],S[t[0]]];rc=M2[rc]}for(var j=0;j<4;j++)w[i+j]=w[i-16+j]^t[j]}return w}
 function ark(s,w,r){for(var i=0;i<16;i++)s[i]^=w[16*r+i]}
 function enc(b,w){var s=b.slice(),r,c,t;ark(s,w,0);for(r=1;r<=10;r++){for(c=0;c<16;c++)s[c]=S[s[c]];t=s.slice();for(c=0;c<4;c++)for(var q=0;q<4;q++)s[q+4*c]=t[q+4*((c+q)%4)];
  if(r<10)for(c=0;c<4;c++){var a0=s[4*c],a1=s[4*c+1],a2=s[4*c+2],a3=s[4*c+3];s[4*c]=M2[a0]^M3[a1]^a2^a3;s[4*c+1]=a0^M2[a1]^M3[a2]^a3;s[4*c+2]=a0^a1^M2[a2]^M3[a3];s[4*c+3]=M3[a0]^a1^a2^M2[a3]}
  ark(s,w,r)}return s}
 function dec(b,w){var s=b.slice(),r,c,t;ark(s,w,10);for(r=9;r>=0;r--){t=s.slice();for(c=0;c<4;c++)for(var q=0;q<4;q++)s[q+4*c]=t[q+4*((c-q+4)%4)];for(c=0;c<16;c++)s[c]=Si[s[c]];ark(s,w,r);
  if(r>0)for(c=0;c<4;c++){var a0=s[4*c],a1=s[4*c+1],a2=s[4*c+2],a3=s[4*c+3];s[4*c]=M14[a0]^M11[a1]^M13[a2]^M9[a3];s[4*c+1]=M9[a0]^M14[a1]^M11[a2]^M13[a3];s[4*c+2]=M13[a0]^M9[a1]^M14[a2]^M11[a3];s[4*c+3]=M11[a0]^M13[a1]^M9[a2]^M14[a3]}}return s}
 return{
  enc:function(key,iv,pt){var w=kx(key),n=16-pt.length%16,p=pt.slice();for(var i=0;i<n;i++)p.push(n);var out=[],prev=iv.slice(0,16);for(var o=0;o<p.length;o+=16){var blk=p.slice(o,o+16);for(var j=0;j<16;j++)blk[j]^=prev[j];prev=enc(blk,w);out=out.concat(prev)}return out},
  dec:function(key,iv,ct){var al=ct.length-ct.length%16;if(!al)return ct.slice();var w=kx(key),out=[],prev=iv.slice(0,16);for(var o=0;o<al;o+=16){var blk=ct.slice(o,o+16),d=dec(blk,w);for(var j=0;j<16;j++)d[j]^=prev[j];prev=blk;out=out.concat(d)}
   var n=out[out.length-1];if(n>=1&&n<=16){var ok=true;for(var k=1;k<=n;k++)if(out[out.length-k]!==n){ok=false;break}if(ok)out=out.slice(0,out.length-n)}return out}}})();

/* ---- secp160r1 ECDH (BigInt) ---- */
var EFE=(function(){if(typeof BigInt!='function')return null;var B=BigInt,Z=B(0),O=B(1),T=B(2),p=B('0xffffffffffffffffffffffffffffffff7fffffff'),a=p-B(3),n=B('0x0100000000000000000001f4c8f927aed3ca752257'),G=[B('0x4a96b5688ef573284664698968c38bb913cbfc82'),B('0x23a628553168947d59dcc912042351377ac5fb32')];
 function md(x){x%=p;return x<Z?x+p:x}function pw(b,e){var r=O;b=md(b);while(e>Z){if(e&O)r=r*b%p;b=b*b%p;e>>=O}return r}function iv(x){return pw(x,p-T)}
 function add(P,Q){if(!P)return Q;if(!Q)return P;var l;if(P[0]===Q[0]){if(md(P[1]+Q[1])===Z)return null;l=md((B(3)*P[0]*P[0]+a)*iv(T*P[1]))}else l=md((Q[1]-P[1])*iv(Q[0]-P[0]));var x=md(l*l-P[0]-Q[0]);return[x,md(l*(P[0]-x)-P[1])]}
 function mul(k,P){var R=null,A=P;while(k>Z){if(k&O)R=add(R,A);A=add(A,A);k>>=O}return R}
 function b2n(b){var h='0x';for(var i=0;i<b.length;i++)h+=('0'+b[i].toString(16)).slice(-2);return B(h)}
 function n2b(x,l){var h=x.toString(16);while(h.length<2*l)h='0'+h;var r=[];for(var i=0;i<h.length;i+=2)r.push(parseInt(h.substr(i,2),16));return r}
 return{gen:function(rnd){var d=b2n(rnd)%(n-O)+O,P=mul(d,G);return{d:d,pub:n2b(P[0],20).concat(n2b(P[1],20))}},
  shared:function(d,pub){var P=[b2n(pub.slice(0,20)),b2n(pub.slice(20,40))];if(md(P[1]*P[1]-(P[0]*P[0]*P[0]+a*P[0]+B('0x1c97befc54bd7a8b65acf89f81d4d4adc565fa45')))!==Z)throw new Error('bad device key');var S=mul(d,P);return n2b(S[0],20)},
  _mul:mul,_G:G,_n2b:n2b,_b2n:b2n}})();
function efRand(n){var a=new Uint8Array(n);try{crypto.getRandomValues(a)}catch(e){for(var i=0;i<n;i++)a[i]=Math.floor(Math.random()*256)}return Array.prototype.slice.call(a)}
var EF_KDB=null;function efKd(pos,len){if(!EF_KDB){var s=atob(EF_KD);EF_KDB=new Uint8Array(s.length);for(var i=0;i<s.length;i++)EF_KDB[i]=s.charCodeAt(i)}return Array.prototype.slice.call(EF_KDB.subarray(pos,pos+len))}

/* ---- framing ---- */
function efEnc(ft,payload){var d=[0x5a,0x5a,ft<<4,1,(payload.length+2)&255,(payload.length+2)>>8].concat(payload),k=efC16(d);d.push(k&255,k>>8);return d}
function efPkt(src,dst,cs,ci,pl,ver){ver=ver||3;var d=[0xaa,ver,pl.length&255,pl.length>>8];d.push(efC8(d));d=d.concat([0x0d,0,0,0,0,0,0,src,dst]).concat(ver>=3?[1,1]:[]).concat([cs,ci]).concat(pl);var k=efC16(d);d.push(k&255,k>>8);return d}
/* River 2, Delta 2, Delta Pro, Wave 2 speak packet version 2 (no dsrc/ddst bytes); newer models version 3 */
var EF_V2=['R601','R603','R611','R613','R621','R623','R331','R335','R701','R351','R354','D361','D365','KT21','R511','DCA','DCK','DCE','DCC','DCU','DCT','DCG','DCS','DCF','DCJ','Z1'];
function efVer(sn){sn=String(sn||'').toUpperCase();return EF_V2.some(function(x){return sn.indexOf(x)===0})?2:3}
function efParsePkt(d){if(d[0]!==0xaa)return null;var vb=d[1],v=vb&15,sen=(vb&0x10)!==0;if(v!==3&&v!==2)return{raw:1,vb:vb};if((v==3&&d.length<20)||(v==2&&d.length<18))return null;var L=d[2]|d[3]<<8;
 if(!sen&&!(d[d.length-2]==0xbb&&d[d.length-1]==0xbb)){var k=efC16(d.slice(0,-2));if(k!==(d[d.length-2]|d[d.length-1]<<8))return null}if(efC8(d.slice(0,4))!==d[4])return null;
 var st=v==2?16:18,seq=d[6],cs=v==2?d[14]:d[16],ci=v==2?d[15]:d[17],pl=d.slice(st,st+L);if(sen&&seq)pl=pl.map(function(c){return c^seq});if(sen&&pl[pl.length-2]==0xbb&&pl[pl.length-1]==0xbb)pl=pl.slice(0,-2);
 return{src:d[12],dst:d[13],cs:cs,ci:ci,pl:pl,vb:vb}}
/* returns list of {ft,payload} complete EncPacket frames from the stream buffer */
function efFrames(){var u=EF.buf,out=[];for(var g=0;g<50;g++){var s=-1;for(var i=0;i+1<u.length;i++)if(u[i]==0x5a&&u[i+1]==0x5a){s=i;break}if(s<0){u=u.length&&u[u.length-1]==0x5a?[0x5a]:[];break}if(s>0)u=u.slice(s);if(u.length<8)break;
  var L=u[4]|u[5]<<8;if(L>10000){u=u.slice(2);continue}var end=6+L;if(end>u.length)break;var hd=u.slice(0,6),pl=u.slice(6,end-2);if(efC16(hd.concat(pl))!==(u[end-2]|u[end-1]<<8)){u=u.slice(2);continue}
  u=u.slice(end);out.push({ft:hd[2]>>4,pl:pl})}EF.buf=u;return out}

/* ---- protobuf (top-level fields only) ---- */
function efPb(b){var o={},i=0;function vi(){var r=0,m=1,x;do{x=b[i++];r+=(x&127)*m;m*=128}while(x&128&&i<b.length);return r}
 while(i<b.length){var key=vi(),f=Math.floor(key/8),wt=key&7;if(wt==0)o[f]=vi();else if(wt==5){var dv=new DataView(new Uint8Array(b.slice(i,i+4)).buffer);o[f]=dv.getFloat32(0,true);i+=4}else if(wt==1){i+=8}else if(wt==2){var l=vi();i+=l}else break}return o}

/* ---- transport ---- */
function efLog(t,m){try{if(BLon)blog(t,m)}catch(e){}}
async function efWrite(b){var P=btPlug();if(!P||!BT.id)throw new Error('no link');efLog('TX',b2hex(b.length>64?b.slice(0,64):b)+(b.length>64?' …('+b.length+')':''));await P.write({deviceId:BT.id,service:EFS,characteristic:EFW,value:b2hex(b)})}
function efOnData(b){EF.buf=EF.buf.concat(b);if(EF.buf.length>20000)EF.buf=[];var fr=efFrames();fr.forEach(function(f){
  if(!EF.ses){EF.q.push(f);return}
  if(f.ft===0){EF.q.push(f);return}
  var dec=EFA.dec(EF.key,EF.iv,f.pl),p=efParsePkt(dec);if(!p){efLog('ERR','EF undecodable '+b2hex(dec.slice(0,24)));return}efPacket(p)})}
function efWait(pred,ms){return new Promise(function(res,rej){var t0=Date.now(),iv=setInterval(function(){for(var i=0;i<EF.q.length;i++){var f=EF.q[i];if(pred(f)){EF.q.splice(i,1);clearInterval(iv);res(f);return}}
  if(!BT.on){clearInterval(iv);rej(new Error('disconnected'))}else if(Date.now()-t0>ms){clearInterval(iv);rej(new Error('timeout'))}},60)})}

/* ---- packets after session ---- */
var EF_AUTHERR={1:['Нужно обновить токен','Потрібно оновити токен'],2:['Внутренняя ошибка станции','Внутрішня помилка станції'],3:['Станция привязана к другому аккаунту','Станція прив’язана до іншого акаунта'],4:['Сначала привяжите станцию в приложении EcoFlow','Спочатку прив’яжіть станцію в застосунку EcoFlow'],5:['Ошибка передачи','Помилка передачі'],6:['Неверный ключ (ID пользователя или серийный номер)','Невірний ключ (ID користувача або серійний номер)'],7:['Достигнут лимит устройств','Досягнуто ліміт пристроїв']};
function efPacket(p){if(p.raw){efLog('RX','EF pkt v'+p.vb);return}
 if(p.src===0x35&&p.cs===0x35){if(p.ci===0x86){var c=p.pl[0];if(p.pl.length===1&&c!==0){var m=EF_AUTHERR[c]||['Код '+c,'Код '+c];EF.err=L3(m[0],m[1],m[1]);EF.st='auth-fail';efLog('ERR','EF auth rejected code '+c);efUi();return}efAuthOk('reply')}
  else{EF.q.push({pkt:p})}efLog('RX','EF auth '+p.ci.toString(16)+' '+b2hex(p.pl.slice(0,8)));return}
 if(EF.st==='auth')efAuthOk('data');
 if((p.vb&15)===2&&p.src===0x02&&p.cs===0x20&&p.ci===0x02&&p.pl.length>=19){var q=p.pl,soc=q[14];/* PD heartbeat (River 2 / Delta 2): soc, watts out, watts in */
  if(soc<=100){EF.d[262]=soc;EF.d[4]=q[15]|q[16]<<8;EF.d[3]=q[17]|q[18]<<8;efApply();efLog('RX','EF v2 pd soc='+soc+' out='+EF.d[4]+' in='+EF.d[3])}return}
 if(p.cs===0xfe&&p.ci===0x15){var o=efPb(p.pl);Object.keys(o).forEach(function(k){EF.d[k]=o[k]});efApply();efLog('RX','EF data '+JSON.stringify(efPick(o)))}
 else efLog('RX','EF pkt src='+p.src.toString(16)+' cmd='+p.cs.toString(16)+'/'+p.ci.toString(16)+' len='+p.pl.length)}
function efPick(o){var r={};[262,242,3,4,54,368,361,268,269].forEach(function(k){if(o[k]!=null)r[k]=Math.round(o[k]*10)/10});return r}
function efAuthOk(how){if(EF.auth)return;EF.auth=1;EF.st='ok';EF.err='';efLog('SYS','EF authenticated ('+how+')');toast(L3('EcoFlow: подключено, получаю данные','EcoFlow: підключено, отримую дані','EcoFlow: connected, receiving data'));efUi()}
function efApply(){var d=EF.d,old=BT.pct,soc=d[262]!=null?d[262]:d[242];if(soc!=null&&soc>=0&&soc<=100)BT.pct=soc;if(d[4]!=null)BT.w=Math.max(0,d[4]);if(d[3]!=null)BT.wi=Math.max(0,d[3]);
 BT.tf=d[269]>0&&d[269]<6000?d[269]:null;BT.te=d[268]>0&&d[268]<60000?d[268]:null;BT.t=Date.now();try{btUi()}catch(e){}try{pbRefresh()}catch(e){}if(tab==='pan'&&BT.pct!==old)render();efUi()}

/* ---- handshake ---- */
async function efStart(){var P=btPlug(),c=efCfg(),dv=c.devs[BT.id]||{};EF.sn=(dv.sn||'').trim();EF.model=efModel(EF.sn);
 if(!c.uid||!EF.sn){EF.st='setup';efUi();try{render()}catch(e){}return}
 if(dv.et!=null&&dv.et!==7){EF.st='fail';EF.err=L3('Этот тип шифрования EcoFlow ('+dv.et+') пока не поддерживается','Цей тип шифрування EcoFlow ('+dv.et+') поки не підтримується','EcoFlow encryption type '+dv.et+' not supported yet');efUi();return}
 if(!EFE){EF.st='fail';EF.err='BigInt';efUi();return}
 EF.on=1;EF.buf=[];EF.q=[];EF.ses=0;EF.auth=0;EF.key=null;EF.d={};EF.err='';
 try{P.addListener('notification|'+BT.id+'|'+EFS+'|'+EFN,function(e){efOnData(hex2b(e&&e.value))})}catch(e){}
 var ok=false;for(var a=0;a<4&&!ok;a++){try{await P.startNotifications({deviceId:BT.id,service:EFS,characteristic:EFN});ok=true}catch(e){await btSleep(500)}}
 if(!ok){EF.st='fail';EF.err=L3('Нет канала EcoFlow','Немає каналу EcoFlow','No EcoFlow channel');efUi();return}
 try{
  EF.st='keys';efUi();var kp=EFE.gen(efRand(21));await efWrite(efEnc(0,[1,0].concat(kp.pub)));
  var r1=await efWait(function(f){return !f.pkt&&f.pl[0]===1&&f.pl.length>=43},10000);var sz={1:52,2:56,3:64,4:64}[r1.pl[2]]||40;
  var sh=EFE.shared(kp.d,r1.pl.slice(3,3+sz));EF.key=sh.slice(0,16);EF.iv=efMd5(sh);efLog('SYS','EF ecdh ok, curve '+r1.pl[2]+', packet v'+efVer(EF.sn));
  EF.st='session';efUi();await efWrite(efEnc(0,[2]));var r2=await efWait(function(f){return !f.pkt&&f.pl[0]===2&&f.pl.length>=33},10000);
  var dd=EFA.dec(EF.key,EF.iv,r2.pl.slice(1)),srand=dd.slice(0,16),seed=dd.slice(16,18),pos=seed[0]*16+((seed[1]-1)&255)*256;
  EF.key=efMd5(efKd(pos,16).concat(srand));EF.ses=1;EF.q=[];efLog('SYS','EF session key ok');
  EF.st='auth';efUi();await efWrite(efEnc(1,EFA.enc(EF.key,EF.iv,efPkt(0x21,0x35,0x35,0x89,[],efVer(EF.sn)))));
  try{await efWait(function(f){return f.pkt&&f.pkt.ci===0x89},6000)}catch(e){efLog('SYS','EF no auth-status reply, continuing')}
  if(EF.auth)return;var hx=efMd5(efStrB(String(c.uid)+EF.sn)).map(function(x){return ('0'+x.toString(16)).slice(-2).toUpperCase()}).join('');
  await efWrite(efEnc(1,EFA.enc(EF.key,EF.iv,efPkt(0x21,0x35,0x35,0x86,efStrB(hx),efVer(EF.sn)))));
  setTimeout(function(){if(EF.on&&!EF.auth&&EF.st==='auth'){EF.st='fail';EF.err=L3('Станция не подтвердила вход','Станція не підтвердила вхід','Station did not confirm login');efUi()}},12000)
 }catch(e){EF.st='fail';EF.err=String(e&&e.message||e);efLog('ERR','EF handshake '+EF.err);efUi()}}

/* ---- serial number from advertisement (manufacturer 0xB5B5) ---- */
function efMfr(md){if(!md)return null;var v=md['46517']||md[46517]||md['0xb5b5']||md['b5b5'];if(v==null)return null;if(typeof v==='string')return hex2b(v);if(v.buffer)return Array.prototype.slice.call(new Uint8Array(v.buffer,v.byteOffset||0,v.byteLength));if(Array.isArray(v))return v;return null}
async function efScan(){var P=btPlug();if(!P)return toast(L3('Только в установленном APK','Лише в установленому APK','APK only'));var c=efCfg(),found=0;EF.scan=1;efUi();
 try{await P.initialize()}catch(e){}
 var h=null;try{h=await P.addListener('onScanResult',function(r){try{var d=efMfr(r&&r.manufacturerData);var id=r&&r.device&&r.device.deviceId;if(!d||!id||d.length<17)return;var sn='';for(var i=1;i<17;i++)sn+=String.fromCharCode(d[i]);sn=sn.replace(/[^\x20-\x7e]/g,'').trim();
  var et=d.length>22?(d[22]&0x38)>>3:7;var o=c.devs[id]||{};o.sn=sn;o.et=et;o.name=r.device.name||o.name||'';c.devs[id]=o;found++;efLog('SYS','EF adv '+id+' sn='+sn.slice(0,4)+'… et='+et)}catch(e){}})}catch(e){}
 try{await P.requestLEScan({namePrefix:'EF-',allowDuplicates:false})}catch(e){try{await P.requestLEScan({})}catch(e2){}}
 await btSleep(6000);try{await P.stopLEScan()}catch(e){}try{h&&h.remove&&h.remove()}catch(e){}EF.scan=0;save();
 toast(found?L3('Найдено: серийный номер сохранён','Знайдено: серійний номер збережено','Found: serial saved'):L3('Станция EcoFlow не найдена. Отключите её от телефона и повторите.','Станцію EcoFlow не знайдено. Від’єднайте її від телефона і повторіть.','EcoFlow not found. Disconnect it and retry.'));render()}

/* ---- one-time account login: only the user ID is kept, the password is never stored ---- */
async function efLogin(){var em=(document.getElementById('efem')||{}).value||'',pw=(document.getElementById('efpw')||{}).value||'',rg=(document.getElementById('efrg')||{}).value||'api';em=em.trim();
 if(!em||!pw)return toast(L3('Введите e-mail и пароль','Введіть e-mail і пароль','Enter e-mail and password'));
 var body={scene:'IOT_APP',appVersion:'1.0.0',password:btoa(unescape(encodeURIComponent(pw))),oauth:{bundleId:'com.ef.EcoFlow'},userType:'ECOFLOW',email:em},url='https://'+rg+'.ecoflow.com/auth/login',j=null;
 EF.lg=1;efUi();
 try{var H=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.CapacitorHttp;if(H){var r=await H.request({url:url,method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},data:body});j=typeof r.data==='string'?JSON.parse(r.data):r.data}
  else{var rr=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});j=await rr.json()}}catch(e){j={message:String(e&&e.message||e)}}
 EF.lg=0;var pe=document.getElementById('efpw');if(pe)pe.value='';pw='';
 var uid=j&&j.code=='0'&&j.data&&j.data.user&&j.data.user.userId;
 if(uid){efCfg().uid=String(uid);save();toast(L3('ID пользователя получен','ID користувача отримано','User ID received'));render();if(BT.on&&btIsEF()&&!EF.on)efStart()}
 else toast(L3('Вход не удался: ','Вхід не вдався: ','Login failed: ')+(j&&j.message||'?'))}
function efSetUid(){var v=((document.getElementById('efuid')||{}).value||'').trim();if(!/^\d{5,}$/.test(v))return toast(L3('ID — это число','ID — це число','ID is a number'));efCfg().uid=v;save();render()}
function efSetSn(){var v=((document.getElementById('efsn')||{}).value||'').trim().toUpperCase();if(v.length<8||!BT.id)return toast(L3('Введите полный серийный номер','Введіть повний серійний номер','Enter the full serial'));var c=efCfg(),o=c.devs[BT.id]||{};o.sn=v;c.devs[BT.id]=o;save();render()}
function efForget(){var c=efCfg();delete c.uid;save();render()}

/* ---- model from serial prefix (subset of ha-ef-ble list) ---- */
function efModel(sn){var M={R651:'River 3',R653:'River 3',R654:'River 3 UPS',R655:'River 3 UPS',R631:'River 3 Plus',R634:'River 3 Plus',R635:'River 3 Plus Wireless',R601:'River 2',R603:'River 2',R611:'River 2 Max',R613:'River 2 Max',R621:'River 2 Pro',R623:'River 2 Pro',R331:'Delta 2',R335:'Delta 2',R351:'Delta 2 Max',R354:'Delta 2 Max',P231:'Delta 3',P321:'Delta 3 Classic',P322:'Delta 3 Classic',P351:'Delta 3 Plus',D3N1:'Delta 3 Max',D3M1:'Delta 3 Max Plus',MR51:'Delta Pro 3',MR54:'Delta Pro 3',D361:'Delta 2 Plus',D365:'Delta 2 Plus'};return M[String(sn||'').slice(0,4)]||''}

/* ---- UI card in Bluetooth tab ---- */
function efStLbl(){return{setup:L3('нужна настройка','потрібне налаштування','setup needed'),keys:L3('обмен ключами…','обмін ключами…','exchanging keys…'),session:L3('ключ сеанса…','ключ сеансу…','session key…'),auth:L3('вход…','вхід…','logging in…'),ok:L3('данные идут','дані надходять','receiving data'),fail:L3('ошибка','помилка','error'),'auth-fail':L3('вход отклонён','вхід відхилено','login rejected')}[EF.st]||'—'}
function efCard(){var c=efCfg(),show=(BT.on&&btIsEF())||c.uid;if(!show)return '';var dv=BT.on&&btIsEF()?(c.devs[BT.id]||{}):null,h='<div class="card" id="efcard"><h2>EcoFlow</h2>';
 h+='<div class="kv"><span>'+L3('Состояние','Стан','Status')+'</span><b id="efst">'+esc(efStLbl())+'</b></div>';if(EF.err)h+='<div class="mut" style="color:#ff8a7a;margin:4px 0">'+esc(EF.err)+'</div>';
 if(EF.model||(dv&&dv.sn))h+='<div class="kv"><span>'+L3('Модель','Модель','Model')+'</span><b>'+esc(EF.model||efModel(dv&&dv.sn)||'—')+'</b></div>';
 if(c.uid)h+='<div class="kv"><span>'+L3('Аккаунт EcoFlow','Акаунт EcoFlow','EcoFlow account')+'</span><b>ID …'+esc(String(c.uid).slice(-4))+' <button class="sec sm" onclick="efForget()">'+L3('Сменить','Змінити','Change')+'</button></b></div>';
 else h+='<div class="mut" style="margin:6px 0">'+L3('1. Войдите в аккаунт EcoFlow, к которому привязана станция. Пароль используется один раз и не сохраняется — сохраняется только ID пользователя.','1. Увійдіть в акаунт EcoFlow, до якого прив’язана станція. Пароль використовується один раз і не зберігається — зберігається лише ID користувача.','1. Sign in to the EcoFlow account the station is bound to. The password is used once and not stored — only the user ID is kept.')+'</div>'+
  '<input id="efem" type="email" placeholder="E-mail" autocomplete="off" style="width:100%;margin:4px 0"><input id="efpw" type="password" placeholder="'+L3('Пароль','Пароль','Password')+'" autocomplete="off" style="width:100%;margin:4px 0">'+
  '<select id="efrg" style="width:100%;margin:4px 0"><option value="api">'+L3('Регион: авто','Регіон: авто','Region: auto')+'</option><option value="api-e">Europe</option><option value="api-a">America</option></select>'+
  '<div class="row"><button onclick="efLogin()"'+(EF.lg?' disabled':'')+'>'+(EF.lg?'…':L3('Получить ID','Отримати ID','Get ID'))+'</button></div>'+
  '<details style="margin-top:6px"><summary class="mut">'+L3('Ввести ID вручную','Ввести ID вручну','Enter ID manually')+'</summary><input id="efuid" inputmode="numeric" placeholder="User ID" style="width:100%;margin:4px 0"><button class="sec sm" onclick="efSetUid()">OK</button></details>';
 if(dv){if(dv.sn)h+='<div class="kv"><span>'+L3('Серийный номер','Серійний номер','Serial')+'</span><b>'+esc(dv.sn.slice(0,4))+'…'+esc(dv.sn.slice(-3))+'</b></div>';
  else h+='<div class="mut" style="margin:8px 0 4px">'+L3('2. Нужен серийный номер станции. Нажмите «Найти» (станция должна быть отключена от телефона) или введите его с наклейки.','2. Потрібен серійний номер станції. Натисніть «Знайти» (станцію треба від’єднати від телефона) або введіть його з наліпки.','2. The serial number is needed. Tap “Find” (disconnect first) or type it from the label.')+'</div>'+
   '<div class="row"><button class="sec" onclick="btDisc();setTimeout(efScan,600)"'+(EF.scan?' disabled':'')+'>'+(EF.scan?L3('Поиск…','Пошук…','Scanning…'):L3('Найти','Знайти','Find'))+'</button></div><input id="efsn" placeholder="R651…" style="width:100%;margin:4px 0;text-transform:uppercase"><button class="sec sm" onclick="efSetSn()">OK</button>'}
 else if(!BT.on)h+='<div class="row"><button class="sec" onclick="efScan()"'+(EF.scan?' disabled':'')+'>'+(EF.scan?L3('Поиск…','Пошук…','Scanning…'):L3('Найти станцию EcoFlow','Знайти станцію EcoFlow','Find EcoFlow station'))+'</button></div>';
 if(dv&&c.uid&&dv.sn&&EF.st!=='ok'&&!EF.on)h+='<div class="row"><button onclick="efStart()">'+L3('Подключить EcoFlow','Під’єднати EcoFlow','Connect EcoFlow')+'</button></div>';
 return h+'</div>'}
function efUi(){var e=document.getElementById('efst');if(e)e.textContent=efStLbl()}

/* ---- hooks ---- */
(function(){var c=btConnect;btConnect=async function(){var r=await c.apply(this,arguments);try{if(BT.on&&btIsEF())await efStart()}catch(e){}return r};
 var d=btDown;btDown=function(){EF.on=0;EF.ses=0;EF.auth=0;if(EF.st!=='fail'&&EF.st!=='auth-fail')EF.st='';return d.apply(this,arguments)};
 var v=vBt;vBt=function(){var h=v();try{var cc=efCard();if(cc){var i=h.indexOf('<details class="card"');h=i>=0?h.slice(0,i)+cc+h.slice(i):h+cc}}catch(e){}return h};
 if(typeof btDevModel==='function'){var m=btDevModel;btDevModel=function(){if(BT.on&&btIsEF())return{brand:'EcoFlow',model:EF.model||''};return m()}}})();
