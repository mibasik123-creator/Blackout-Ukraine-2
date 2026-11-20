/* ===== BLACKOUT inverters over local Wi-Fi (read-only) =====
   Deye hybrid: Solarman V5 logger stick, TCP 8899, Modbus RTU inside V5 frames (pysolarmanv5 framing).
   Must PV18/PV1800/PH1800 and PV19/PV1900: Modbus RTU through an RS485->Wi-Fi adapter (transparent TCP).
   Register maps: home_assistant_solarman (deye_hybrid / deye_sg04lp3), ha-must-inverter (PV1800 / PV1900).
   Only function 0x03 (read holding registers) is ever sent. Nothing is written to an inverter. */
var INV_TYPES={
 deye1:{n:'Deye · однофазний гібрид',m:'SUN-3.6/5/6/8K-SG01LP1, SG02LP1, SG03LP1, SG05LP1 (у т.ч. -EU-AM2-P)',link:'v5',links:['v5','mbtcp'],id:1,port:8899,
  req:[[59,21],[150,46]],
  map:function(R){return{run:INV_LK.deyeRun[R(59)],soc:R(184),bV:sc(R(183),.01),bW:s16(R(190)),bA:sc(s16(R(191)),.01),bSt:INV_LK.deyeBat[R(189)],
   gV:sc(R(150),.1),gW:s16(R(169)),gF:sc(R(79),.01),onGrid:R(194),lW:R(178),lV:sc(R(157),.1),pv:sum(R(186),R(187)),gen:R(166)}}},
 deye3:{n:'Deye · трифазний гібрид',m:'SUN-5…20K-SG04LP3, SG01HP3, SG05LP3 (у т.ч. -EU-SM2)',link:'v5',links:['v5','mbtcp'],id:1,port:8899,
  req:[[586,6],[598,39],[644,10],[661,19]],
  map:function(R){return{soc:R(588),bV:sc(R(587),.01),bW:s16(R(590)),bA:sc(s16(R(591)),.01),
   gV:sc(R(598),.1),gW:s16(R(625)),gF:null,lW:R(653),lV:sc(R(644),.1),pv:sum(R(672),R(673)),gen:R(667)}}},
 must18:{n:'Must · PV18 / PV1800 / PH1800',m:'через адаптер RS485 → Wi-Fi (Elfin EW11, USR-W610…)',link:'rtu',links:['rtu','mbtcp'],id:4,port:8899,
  req:[[15201,21],[25201,79]],
  map:function(R){return{run:INV_LK.mustWork[R(25201)],bV:sc(R(25205),.1),bW:s16(R(25273)),bA:s16(R(25274)),
   gV:sc(R(25207),.1),gW:s16(R(25214)),gF:sc(R(25226),.01),lW:s16(R(25215)),lV:sc(R(25206),.1),lPct:R(25216),pv:R(15208),pvV:sc(R(15205),.1)}}},
 must19:{n:'Must · PV19 / PV1900',m:'через адаптер RS485 → Wi-Fi (Elfin EW11, USR-W610…)',link:'rtu',links:['rtu','mbtcp'],id:4,port:8899,
  req:[[15201,21],[25201,79],[113,2]],
  map:function(R){return{run:INV_LK.mustWork[R(25201)],soc:R(113),bV:sc(R(25205),.1),bW:s16(R(25273)),bA:s16(R(25274)),
   gV:sc(R(25207),.1),gW:s16(R(25214)),gF:sc(R(25226),.01),lW:s16(R(25215)),lV:sc(R(25206),.1),lPct:R(25216),pv:R(15208),pvV:sc(R(15205),.1)}}}};
var INV_LINKS={v5:{n:'Логер Solarman (порт 8899)',port:8899},mbtcp:{n:'Modbus TCP (порт 502) — новий логер Deye / шлюз',port:502},rtu:{n:'Адаптер RS485, прозорий TCP',port:8899}};
function invLink(c,T){return (T.links.indexOf(c.link)>=0?c.link:T.link)}
var INV_LK={deyeRun:['очікування','самоперевірка','працює','аварія'],deyeBat:['заряд','очікування','розряд'],
 mustWork:['увімкнення','самоперевірка','автономна робота','робота з мережею','байпас','зупинено','заряд від мережі']};
function s16(v){return v==null?null:(v>32767?v-65536:v)}
function sc(v,k){return v==null?null:Math.round(v*k*100)/100}
function sum(a,b){return a==null||b==null?null:a+b}
var INV={on:0,busy:0,d:null,t:0,err:'',log:[],timer:0,seq:0,tid:0,found:null};
function invCfg(){if(!S.inv)S.inv={type:'deye1',host:'',port:8899,sn:'',id:1};return S.inv}
function invNet(){var P=window.Capacitor&&Capacitor.Plugins;return P&&P.BoNet?P.BoNet:null}
function invLog(t,m){INV.log.push(new Date().toTimeString().slice(0,8)+' '+t+' '+m);if(INV.log.length>40)INV.log.shift()}
function ihex(a){return a.map(function(x){return ('0'+(x&255).toString(16)).slice(-2)}).join('')}
function iunhex(h){var a=[];h=String(h||'').replace(/[^0-9a-f]/gi,'');for(var i=0;i+1<h.length;i+=2)a.push(parseInt(h.substr(i,2),16));return a}
/* Modbus RTU CRC-16, little-endian on the wire */
function icrc(b){var c=0xFFFF;for(var i=0;i<b.length;i++){c^=b[i];for(var j=0;j<8;j++)c=(c&1)?(c>>>1)^0xA001:c>>>1}return c}
function rtuRead(id,start,count){var b=[id&255,3,start>>8,start&255,count>>8,count&255],c=icrc(b);b.push(c&255,c>>8);return b}
function rtuParse(f,id,count){if(f.length<5)throw new Error('коротка відповідь Modbus');
 if(f[1]&0x80){var ec=f[2],M={1:'функція не підтримується',2:'регістри недоступні',3:'невірне значення',4:'помилка пристрою'};throw new Error('Modbus помилка '+ec+(M[ec]?' — '+M[ec]:''))}
 if(f[0]!==(id&255))throw new Error('інша адреса Modbus '+f[0]);if(f[1]!==3)throw new Error('несподівана функція '+f[1]);
 var n=f[2],body=f.slice(0,3+n),c=icrc(body);if(f.length<5+n)throw new Error('неповна відповідь Modbus');
 if(f[3+n]!==(c&255)||f[4+n]!==(c>>8))throw new Error('CRC Modbus не збігається');if(n!==count*2)throw new Error('отримано '+n/2+' регістрів замість '+count);
 var r=[];for(var i=0;i<count;i++)r.push(f[3+i*2]<<8|f[4+i*2]);return r}
/* Modbus TCP (MBAP header, no CRC) */
function mbtWrap(id,start,count){var t=INV.tid=(INV.tid%65535)+1;return [t>>8,t&255,0,0,0,6,id&255,3,start>>8,start&255,count>>8,count&255]}
function mbtParse(f,id,count){if(f.length<9)throw new Error(f.length?'коротка відповідь Modbus TCP':'порожня відповідь');
 if((f[0]<<8|f[1])!==INV.tid)throw new Error('чужа відповідь (transaction id)');if(f[2]||f[3])throw new Error('не Modbus TCP');
 var rtu=f.slice(6),c=icrc(rtu);return rtuParse(rtu.concat([c&255,c>>8]),id,count)}
/* Solarman V5 framing (little-endian header), request control 0x4510, response 0x1510 */
function v5Wrap(sn,rtu){var seq=INV.seq=(INV.seq%255)+1,len=15+rtu.length,snv=Number(sn)>>>0;
 var f=[0xA5,len&255,len>>8,0x10,0x45,seq,0,snv&255,(snv>>>8)&255,(snv>>>16)&255,(snv>>>24)&255,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0].concat(rtu);
 var cs=0;for(var i=1;i<f.length;i++)cs=(cs+f[i])&255;f.push(cs,0x15);return f}
function v5Unwrap(r,sn){var i=r.indexOf(0xA5);while(i>=0){var plen=r[i+1]|(r[i+2]<<8),fr=r.slice(i,i+13+plen);
  if(fr.length===13+plen&&fr[fr.length-1]===0x15&&fr[4]===0x15&&fr[3]===0x10){var cs=0;for(var k=1;k<fr.length-2;k++)cs=(cs+fr[k])&255;
   if(cs!==fr[fr.length-2])throw new Error('контрольна сума V5 не збігається');
   if(fr[5]!==INV.seq)throw new Error('чужа відповідь логера (послідовність)');
   var snr=(fr[7]|fr[8]<<8|fr[9]<<16|fr[10]<<24)>>>0;if(snr!==(Number(sn)>>>0))throw new Error('серійний номер логера не збігається ('+snr+')');
   if(fr[11]!==2)throw new Error('логер не передав дані інвертора (тип '+fr[11]+') — перевірте серійний номер і зв’язок логера з інвертором');
   return fr.slice(25,fr.length-2)}
  i=r.indexOf(0xA5,i+1)}
 throw new Error(r.length?'відповідь не схожа на Solarman V5':'порожня відповідь')}
async function invRead(c,T,start,count){var N=invNet(),L=invLink(c,T),rtu=rtuRead(c.id,start,count),tx=L==='v5'?v5Wrap(c.sn,rtu):L==='mbtcp'?mbtWrap(c.id,start,count):rtu;
 invLog('TX',start+'+'+count+' '+ihex(tx));
 var res;try{res=await N.tcp({host:c.host,port:+c.port||INV_LINKS[L].port,hex:ihex(tx),timeout:5000,quiet:350})}
 catch(e){var m=String(e&&e.message||e);throw new Error(/timeout/i.test(m)?'немає відповіді — перевірте IP, що телефон у тій самій Wi-Fi мережі'+(L==='v5'?', і серійний номер логера':''):/refused/i.test(m)?'порт '+(c.port||INV_LINKS[L].port)+' закритий на цій адресі'+(L==='v5'?' — для нового логера Deye оберіть «Modbus TCP (порт 502)»':''):/unreachable|no route/i.test(m)?'адреса недоступна з цієї мережі':m)}
 var r=iunhex(res&&res.hex);invLog('RX',ihex(r.slice(0,120))+(r.length>120?'…':''));
 if(L==='mbtcp')return mbtParse(r,c.id,count);var f=L==='v5'?v5Unwrap(r,c.sn):r;return rtuParse(f,c.id,count)}
async function invPoll(manual){var c=invCfg(),T=INV_TYPES[c.type];if(INV.busy)return;
 if(!invNet()){INV.err='потрібна нова версія застосунку (модуль локальної мережі)';invUi();return}
 if(!c.host){INV.err='вкажіть IP-адресу';invUi();return}if(invLink(c,T)==='v5'&&!/^\d{6,10}$/.test(String(c.sn||'')))  {INV.err='вкажіть серійний номер логера (цифри з наклейки)';invUi();return}
 INV.busy=1;invUi();var regs={};try{for(var i=0;i<T.req.length;i++){var q=T.req[i];if(i)await new Promise(function(r){setTimeout(r,250)});
   var v=await invRead(c,T,q[0],q[1]);for(var k=0;k<q[1];k++)regs[q[0]+k]=v[k]}
  var R=function(a){return regs[a]==null?null:regs[a]};INV.d=T.map(R);INV.t=Date.now();INV.err='';invLog('OK',JSON.stringify(INV.d))}
 catch(e){INV.err=String(e&&e.message||e);invLog('ERR',INV.err)}
 INV.busy=0;invUi()}
function invStart(){INV.on=1;invPoll(true);clearInterval(INV.timer);INV.timer=setInterval(function(){if(INV.on&&!document.hidden)invPoll()},10000);invUi()}
function invStop(){INV.on=0;clearInterval(INV.timer);INV.timer=0;invUi()}
async function invFind(){var N=invNet();if(!N||!N.discover){INV.err='потрібна нова версія застосунку (модуль локальної мережі)';invUi();return}
 INV.found=null;INV.err='';INV.busy=1;invUi();try{var r=await N.discover({timeout:2500});INV.found=(r&&r.items)||[];invLog('FIND',JSON.stringify(INV.found))}catch(e){INV.err='пошук: '+(e&&e.message||e)}INV.busy=0;invUi(true)}
function invPick(i){var it=INV.found&&INV.found[i];if(!it)return;var c=invCfg();c.host=it.ip;c.sn=it.serial;save();invUi(true)}
function invSet(k,v){var c=invCfg();if(k==='type'){c.type=v;var T=INV_TYPES[v];c.link=T.link;c.port=T.port;c.id=T.id;invStop();INV.d=null;INV.err=''}else if(k==='link'){c.link=v;c.port=INV_LINKS[v].port;INV.err=''}else c[k]=(k==='port'||k==='id')?(parseInt(v,10)||''):String(v).trim();save();if(k==='type'||k==='link')invUi(true)}
function iesc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function invW(v){return v==null?'—':(Math.abs(v)>=1000?(v/1000).toFixed(2).replace('.',',')+' кВт':Math.round(v)+' Вт')}
function invDataHtml(){var d=INV.d,c=invCfg(),T=INV_TYPES[c.type];
 var st=INV.busy?'опитування…':INV.err?'<span style="color:var(--bad,#EF665B)">'+iesc(INV.err)+'</span>':INV.t?'оновлено '+Math.max(0,Math.round((Date.now()-INV.t)/1000))+' с тому':'ще не опитувався';
 var h='<div class="mut" id="invst" style="margin:6px 0 10px;font-size:12.5px">'+st+'</div>';if(!d)return h;
 function cell(l,v,s){return '<div class="invc"><div class="mut">'+l+'</div><b>'+v+'</b>'+(s?'<div class="mut" style="font-size:11.5px">'+s+'</div>':'')+'</div>'}
 var bdir=d.bW==null?'':d.bW>0?'розряд':d.bW<0?'заряд':'без руху';if(T.link==='rtu'&&d.bW!=null)bdir=d.bW>0?'потік +':'потік −';
 var gdir=d.gW==null?'':d.gW>0?'з мережі':d.gW<0?'у мережу':'';if(T.link==='rtu'&&d.gW!=null)gdir='';
 h+='<div class="invg'+(INV.err?' old':'')+'">'+cell('Батарея',d.soc!=null?d.soc+'%':(d.bV!=null?String(d.bV).replace('.',',')+' В':'—'),[d.soc!=null&&d.bV!=null?String(d.bV).replace('.',',')+' В':'',d.bW!=null?invW(Math.abs(d.bW))+' '+bdir:''].filter(Boolean).join(' · '))
  +cell('Мережа',d.gV!=null?(d.gV>50?Math.round(d.gV)+' В':'немає'):'—',[d.gF&&d.gV>50?String(d.gF).replace('.',',')+' Гц':'',d.gW!=null?invW(Math.abs(d.gW))+(gdir?' '+gdir:''):'',d.onGrid===0?'автономно':d.onGrid===1?'підключено':''].filter(Boolean).join(' · '))
  +cell('Навантаження',invW(d.lW),[d.lV!=null?Math.round(d.lV)+' В':'',d.lPct!=null?d.lPct+'%':''].filter(Boolean).join(' · '))
  +cell('Сонце',invW(d.pv),d.pvV!=null?String(d.pvV).replace('.',',')+' В':'')
  +(d.gen!=null&&T.link==='v5'?cell('Порт GEN',invW(d.gen),''):'')+(d.run?cell('Стан',d.run,d.bSt?'батарея: '+d.bSt:''):'')+'</div>';
 if(T.link==='rtu')h+='<div class="mut" style="font-size:11.5px;margin-top:6px">Знак потужності Must ще не перевірено на живому інверторі — тому показано «+/−» без підпису напрямку.</div>';
 return h}
function invCard(){var c=invCfg(),T=INV_TYPES[c.type],N=invNet(),L=invLink(c,T);
 var opts=Object.keys(INV_TYPES).map(function(k){return '<option value="'+k+'"'+(k===c.type?' selected':'')+'>'+INV_TYPES[k].n+'</option>'}).join('');
 var h='<div class="card" id="invcard"><h2>Інвертор · Wi-Fi <span class="mut" style="font-size:11px">тест · лише читання</span></h2>'
  +'<label class="mut" style="font-size:12px">Модель</label><select id="invtype" onchange="invSet(\'type\',this.value)">'+opts+'</select>'
  +'<div class="mut" style="font-size:12px;margin:4px 0 10px">'+iesc(T.m)+'</div>'
  +'<label class="mut" style="font-size:12px">Зв’язок</label><select id="invlink" onchange="invSet(\'link\',this.value)">'+T.links.map(function(k){return '<option value="'+k+'"'+(k===L?' selected':'')+'>'+INV_LINKS[k].n+'</option>'}).join('')+'</select><div style="height:10px"></div>'
  +'<div class="invf"><label>'+(T.link==='v5'?'IP логера':'IP адаптера')+'<input id="invhost" inputmode="decimal" placeholder="192.168.1.50" value="'+iesc(c.host)+'" onchange="invSet(\'host\',this.value)"></label>'
  +'<label>Порт<input id="invport" inputmode="numeric" value="'+iesc(c.port)+'" onchange="invSet(\'port\',this.value)"></label></div>'
  +(L==='v5'?'<div class="invf"><label>Серійний номер логера<input id="invsn" inputmode="numeric" placeholder="напр. 2712345678" value="'+iesc(c.sn)+'" onchange="invSet(\'sn\',this.value)"></label>'
   +'<label>Адреса<input id="invid" inputmode="numeric" value="'+iesc(c.id)+'" onchange="invSet(\'id\',this.value)"></label></div>'
   +'<button class="sm" onclick="invFind()"'+(INV.busy?' disabled':'')+'>Знайти логер у мережі</button>'
   +(INV.found?'<div style="margin:8px 0">'+(INV.found.length?INV.found.map(function(it,i){return '<button class="sm" style="margin:0 6px 6px 0" onclick="invPick('+i+')">'+iesc(it.ip)+' · '+iesc(it.serial)+'</button>'}).join(''):'<span class="mut">логерів не знайдено — введіть IP і серійний номер вручну</span>')+'</div>':'')
  :(T.link==='v5'?'<button class="sm" onclick="invFind()"'+(INV.busy?' disabled':'')+'>Знайти логер у мережі</button>'+(INV.found?'<div style="margin:8px 0">'+(INV.found.length?INV.found.map(function(it,i){return '<button class="sm" style="margin:0 6px 6px 0" onclick="invPick('+i+')">'+iesc(it.ip)+'</button>'}).join(''):'<span class="mut">логерів не знайдено</span>')+'</div>':''):'')+'<div class="invf"><label>Адреса Modbus<input id="invid" inputmode="numeric" value="'+iesc(c.id)+'" onchange="invSet(\'id\',this.value)"></label><span></span></div>')
  +'<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="sm" onclick="invPoll(true)"'+(INV.busy?' disabled':'')+'>Перевірити зв’язок</button>'
  +(INV.on?'<button class="sm" onclick="invStop()">Зупинити опитування</button>':'<button class="sm" onclick="invStart()">Опитувати кожні 10 с</button>')+'</div>'
  +(N?'':'<div class="mut" style="margin-top:8px;font-size:12px;color:var(--warn,#EFB34F)">У цій версії застосунку немає модуля локальної мережі — встановіть нову збірку.</div>')
  +'<div id="invdata">'+invDataHtml()+'</div>'
  +'<details style="margin-top:8px"><summary class="mut" style="font-size:12px">Журнал обміну</summary><pre id="invlog" style="white-space:pre-wrap;word-break:break-all;font-size:10.5px;max-height:220px;overflow:auto">'+iesc(INV.log.slice(-14).join('\n'))+'</pre></details>'
  +'<div class="mut" style="font-size:11.5px;margin-top:8px">'+(T.link==='v5'?'Телефон і логер мають бути в одній Wi-Fi мережі. Старі логери Solarman (LSW-3, LSE): порт 8899 і серійний номер з наклейки логера. Нові логери Deye (Deye Cloud, прошивка 1.7+) закривають 8899 — оберіть «Modbus TCP (порт 502)»; якщо й він закритий, Modbus вмикається у веб-панелі логера.':'Must не має власного Wi-Fi з локальним доступом: потрібен адаптер RS485→Wi-Fi у режимі прозорого TCP (19200 бод, 8N1, як у інтеграції Home Assistant). Застосунок читає лише ті діапазони регістрів, які безпечно читає інтеграція Home Assistant.')+'</div></div>';
 return h}
function invUi(full){var e=document.getElementById('invcard');if(!e)return;if(full){var t=document.createElement('div');t.innerHTML=invCard();e.replaceWith(t.firstChild);try{btgApply(false)}catch(x){}return}
 var d=document.getElementById('invdata');if(d)d.innerHTML=invDataHtml();var l=document.getElementById('invlog');if(l)l.textContent=INV.log.slice(-14).join('\n');
 [].forEach.call(e.querySelectorAll('button.sm'),function(b){if(/Перевірити|Знайти/.test(b.textContent))b.disabled=!!INV.busy});
 var bs=[].filter.call(e.querySelectorAll('button.sm'),function(b){return /Опитувати|Зупинити/.test(b.textContent)})[0];if(bs){bs.textContent=INV.on?'Зупинити опитування':'Опитувати кожні 10 с';bs.setAttribute('onclick',INV.on?'invStop()':'invStart()')}
}
setInterval(function(){if(INV.t&&document.getElementById('invst')&&!INV.busy&&!INV.err){var s=document.getElementById('invst');s.textContent='оновлено '+Math.round((Date.now()-INV.t)/1000)+' с тому'}},1000);
