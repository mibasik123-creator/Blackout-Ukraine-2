/* ---------- BLACKOUT 4.0.12: tabs by purpose ----------
   Станції  — live station data, output switches, per-port readings.
   Авто     — the car: charge level, charging control, Tesla card.
   Підключення — only finding / pairing devices. */
ICO.car='<path d="M4 16v-3.2l1.8-4.3A2 2 0 0 1 7.6 7.3h8.8a2 2 0 0 1 1.8 1.2L20 12.8V16"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="16.8" r="1.6"/><circle cx="16.5" cy="16.8" r="1.6"/><path d="M5.5 12.5h13"/>';
TABS=['pan','gen','st','car','hist','bt','set','cat'];
try{ACC_OPEN.st=(ACC_OPEN.st||[]).concat(['Данные','Дані','Station data','Управление','Керування','Output','EcoFlow','Виходи'])}catch(e){}
var BO_VBT=vBt;
function boIsLive(el){if(el.id==='fbcard'||el.id==='efcard')return true;var h=el.querySelector&&el.querySelector(':scope>h2');return !!(h&&/Данные со станции|Дані зі станції|Station data/.test(h.textContent))}
function boBtNodes(){var d=document.createElement('div');d.innerHTML=BO_VBT();return d}
/* Підключення: connection only */
vBt=function(){var d=boBtNodes();[].slice.call(d.children).forEach(function(el){if(boIsLive(el))el.remove()});
 var sm=d.querySelector('#tssum');if(sm)sm.remove();
 var pc=d.querySelector('.pc');if(pc&&BT.on){var n=document.createElement('div');n.className='mut bo-goto';n.innerHTML='Показники та керування виходами — у вкладці <a href="#" onclick="setTab(\'st\');return false">«Станції»</a>';pc.after(n)}
 var ts=d.querySelector('#tscard');if(ts&&tsCfg().vin){var n2=document.createElement('div');n2.className='mut bo-goto';n2.innerHTML='Заряд і керування — у вкладці <a href="#" onclick="setTab(\'car\');return false">«Авто»</a>';ts.appendChild(n2)}
 return d.innerHTML};
/* Станції: live block on top */
function boStLive(){var h='';
 if(!BT.on){h+='<div class="card bo-stoff"><div class="kv"><span>Станція</span><b>не підключена</b></div><div class="row"><button onclick="btConnect()">Підключити по Bluetooth</button></div></div>';return h}
 var d=boBtNodes();[].slice.call(d.children).forEach(function(el){if(boIsLive(el)){el.removeAttribute('hidden');h+=el.outerHTML}});
 return h+boOutCard()}
(function(){var v=vSt;vSt=function(){return boStLive()+v.apply(this,arguments)}})();
/* Fossibot F2400 per-output readings (registers found with the user's station, 20.11.2026):
   18 AC out V×10 · 19 AC out Hz×10 · 20 AC out W · 34 USB-C 100 W (×0.1 W) · 35/37/36 USB-C 20 W №1/2/3 (×0.1 W) */
var BO_PORTS=[[34,'USB-C 100 Вт'],[35,'USB-C 20 Вт · 1'],[37,'USB-C 20 Вт · 2'],[36,'USB-C 20 Вт · 3']];
function boOutOk(){try{return fbIs()&&BT.regs&&BT.regs.length>40&&BT.regs[19]>400&&BT.regs[19]<700}catch(e){return false}}
function boW(x){return x==null?'—':(x<10?x.toFixed(1).replace('.',','):String(Math.round(x)))+' Вт'}
function boOutVals(){var r=BT.regs,ac=fbState('ac'),usb=fbState('usb'),o={};
 o.acv=ac?(r[18]/10).toFixed(0)+' В · '+(r[19]/10).toFixed(0)+' Гц':'вимкнено';o.acw=ac?boW(r[20]):'';
 BO_PORTS.forEach(function(p){o['p'+p[0]]=usb?(r[p[0]]>0?boW(r[p[0]]/10):'—'):''});return o}
function boOutCard(){if(!boOutOk())return '';var o=boOutVals();
 var h='<div class="card" id="outcard"><h2>Виходи · показники</h2>';
 h+='<div class="kv"><span>AC розетки</span><b><span id="o-acv">'+o.acv+'</span> <span id="o-acw" class="bo-w">'+o.acw+'</span></b></div>';
 BO_PORTS.forEach(function(p){h+='<div class="kv"><span>'+p[1]+'</span><b id="o-p'+p[0]+'">'+o['p'+p[0]]+'</b></div>'});
 h+='<div class="mut" style="font-size:11.5px;margin-top:6px">USB-A і DC станція передає лише загальною сумою. Порядок трьох портів 20 Вт — за даними станції; якщо підписи не збігаються з корпусом, напишіть.</div></div>';return h}
function boOutUi(){if(!document.getElementById('outcard'))return;if(!boOutOk())return;var o=boOutVals();
 function s(id,v){var e=document.getElementById(id);if(e&&e.textContent!==v)e.textContent=v}
 s('o-acv',o.acv);s('o-acw',o.acw);BO_PORTS.forEach(function(p){s('o-p'+p[0],o['p'+p[0]])})}
(function(){var b=btFrame2;btFrame2=function(){b.apply(this,arguments);try{boOutUi()}catch(e){}}})();
/* station-tab live card appears/disappears with the connection */
var BO_STK='';setInterval(function(){if(tab!=='st')return;var k=(BT.on?1:0)+'|'+(boOutOk()?1:0)+'|'+(BT.regs?1:0);if(k!==BO_STK){var first=!BO_STK;BO_STK=k;if(!first){var y=window.scrollY;try{render()}catch(e){}window.scrollTo(0,y)}}},1500);
/* Авто */
function boCarHero(){var c=tsCfg(),d=TS.d||c.last||null,vi=c.vin?vinInfo(c.vin):{},nm=c.vin?((vi.make||'Tesla')+' '+(vi.model||'')).trim():'Авто';
 var chg=!!(d&&(d.st===4||d.st===5)),pct=d&&d.pct!=null?Math.round(d.pct):null,age=d&&d.t?Math.round((Date.now()-d.t)/60000):null;
 var h='<div class="hero"><div class="hi">'+(TS.on?'Tesla · Bluetooth':'Авто')+'</div><div class="ttl">'+svgi('car',26)+esc(nm)+'</div></div>';
 if(!c.vin)return h+'<div class="card"><div class="mut">Додайте авто: вкажіть VIN нижче — підключення напряму по Bluetooth, без хмари.</div></div>';
 h+='<div class="card" id="carbig"><div class="bo-cpct">'+(pct!=null?pct+'<small>%</small>':'—')+'</div><div class="mut" id="carst">'+
  (chg?'заряджається'+(d.kw!=null?' · '+String(d.kw).replace('.',',')+' кВт':''):pct!=null?'не заряджається':'ще немає даних')+(age!=null&&!TS.on?' · дані '+(age<1?'щойно':age+' хв тому'):'')+'</div>';
 if(c.paired&&TS.on&&d){h+='<div class="row"><button class="'+(chg?'stop':'')+'" onclick="boCarChg('+(chg?0:1)+')"'+(TS.chgBusy||TS.busy?' disabled':'')+'>'+(chg?'Зупинити заряджання':'Почати заряджання')+'</button></div>'}
 else if(c.paired&&!TS.on){h+='<div class="row"><button onclick="tsConnect()"'+(TS.connecting||TS.st==='conn'?' disabled':'')+'>Під’єднати</button></div>'}
 return h+'</div>'}
function boCarChg(on){if(!on&&!confirm('Зупинити заряджання Tesla?'))return;try{tsCharge(!!on)}catch(e){console.error(e)}setTimeout(function(){if(tab==='car')render()},1500)}
function vCar(){var d=document.createElement('div');d.innerHTML=BO_VBT();var ts=d.querySelector('#tscard');if(ts)ts.removeAttribute('hidden');return boCarHero()+(ts?ts.outerHTML:'')}
(function(){var u=tsUi;tsUi=function(){var k=TS.st+'|'+(TS.on?1:0)+'|'+(tsCfg().paired?1:0)+'|'+(TS.err?1:0)+'|'+(TS.chgBusy?1:0)+'|'+(TS.d?TS.d.st+'/'+Math.round(TS.d.pct||0):'');
 if(tab==='car'&&k!==TS.boKey){TS.boKey=k;var y=window.scrollY;try{render()}catch(e){}window.scrollTo(0,y)}u.apply(this,arguments)}})();
