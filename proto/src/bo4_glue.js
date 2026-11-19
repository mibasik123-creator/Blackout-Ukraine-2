/* ---------- BLACKOUT 4.0 inside the app: shadow-DOM mount + real data adapters ----------
   The overview lives in its own shadow root, so its styles never touch other screens and
   the app's styles never touch it. Data comes only from what the app really measures. */
var HOST=null,ROOT=null,stT=0;
function ACTIVE(){return !!(HOST&&HOST.isConnected&&!document.hidden)}
function onVis(){var a=ACTIVE();Flow.pauseAll(!a);if(!a){for(var id in NUM){var e=$(id);if(e&&e._r){cancelAnimationFrame(e._r);e._r=0}}pending=0}else paint()}
document.addEventListener('visibilitychange',onVis);
function build(){HOST=document.createElement('div');HOST.id='bo4host';ROOT=HOST.attachShadow({mode:'open'});ROOT.innerHTML='<style>'+BO4_CSS+'</style>'+BO4_HTML;
 Flow.init();
 function go(id,f){var e=$(id);if(e)e.addEventListener('click',f)}
 go('dcard',function(){try{localStorage.setItem('bo_btg','st')}catch(e){}setTab('bt')});
 go('gcard',function(){setTab('gen')});
 go('ccard',function(){try{localStorage.setItem('bo_btg','car')}catch(e){}setTab('bt')});
 if(BO_DEV){startDev();var tl=$('testlbl');if(tl)tl.style.display=''}else{var lab=ROOT.querySelector('.lab');if(lab)lab.style.display='none'}}
function attach(){var slot=document.getElementById('bo4slot');
 if(!slot){if(HOST&&HOST.isConnected)HOST.remove();if(HOST)onVis();return}
 if(!HOST)build();slot.replaceWith(HOST);sync();onVis()}
/* rated AC output per known model: used only to flag overload, never to block anything */
function ratedW(name){name=String(name||'');return /F2400/i.test(name)?2400:/F1800/i.test(name)?1800:/AC2P/i.test(name)?300:null}
function stName(){try{var m=btDevModel(),c=BC(),idx=(c.map&&BT.id&&c.map[BT.id]!=null)?c.map[BT.id]:c.sti,sn=S.sts[idx!=null?idx:si];
  if(m&&m.brand==='Fossibot')return sn?sn.n:'Fossibot';if(m)return (m.brand+' '+(m.model||'')).trim();if(BT.on&&btIsEF())return 'EcoFlow '+((window.EF&&EF.model)||'');return sn?sn.n:(BT.name||'Станція')}catch(e){return 'Станція'}}
function sync(){if(BO_DEV)return;var now=Date.now();
 /* station: the connected station's own measurements, time = when its frame arrived */
 if(BT.on&&stT&&(BT.pct!=null||BT.w!=null||BT.wi!=null)){var nm=stName();BO_STATION_AC_MAX_W=ratedW(nm);
  Tel.set('station',{pct:BT.pct,inW:BT.wi,outW:BT.w,tf:BT.tf,te:BT.te,t:stT});txt('stname',nm);txt('stname2',nm)}
 else{var s0=Tel.get('station');if(s0&&s0.link!==false)Tel.markOffline('station')}
 /* generator: the generator sends no data; its state is the session started/stopped in the app */
 var g=S.gens[S.g]||S.gens[0];if(g){Tel.set('gen',{on:!!S.run,fuel:S.fills.length?Math.round(fuelLeft(g)/fuelCap(g)*100):null,t:now});txt('gname',g.n)}
 /* grid: confirmed only by the Fossibot AC-input measurement and only while the generator session is off */
 var fresh=BT.on&&stT&&now-stT<BO_LIMITS.station,acKnown=!!(BT.tx&&!(window.BLUP&&BLUP.on)&&!btIsEF()&&BT.regs&&BT.regs[22]!=null);
 if(S.run){if(Tel.d.grid){delete Tel.d.grid;Tel.emit('grid')}}
 else if(fresh&&acKnown)Tel.set('grid',{on:BT.hz!=null&&BT.vin>150,V:BT.vin,t:stT});
 /* car: Tesla over Bluetooth, time = when the car answered */
 try{var c=tsCfg();if(c.vin){var d=TS.d||c.last;var vi=vinInfo(c.vin);txt('cname',((vi.make||'Tesla')+' '+(vi.model||'')).trim());HOST&&HOST.style.setProperty('--carc',tsColor());
  if(d&&typeof d.t==='number')Tel.set('car',{pct:d.pct,kW:d.kw,st:d.st,t:d.t,link:!!(TS.on&&TS.d)});else if(Tel.d.car){delete Tel.d.car;Tel.emit('car')}}}catch(e){}
 /* grid V/A/Hz line (measured by the station) */
 var gl=$('gline');if(gl){var gt='';try{if(fresh)gt=pbGridTxt();if(gt&&S.run)gt=gt.replace(/^[^<]+/,'Вхід від генератора ')}catch(e){}if(gl.innerHTML!==gt)gl.innerHTML=gt;gl.hidden=!gt;gl.classList.toggle('gen',!!S.run)}
 txt('loc',S.locs&&S.locs[S.loc]?S.locs[S.loc]:'')}
setInterval(function(){if(ACTIVE())sync()},2000);
window.BO4={attach:attach,sync:sync,frame:function(){stT=Date.now();if(ACTIVE())sync()},lost:function(){if(ACTIVE())sync()},active:ACTIVE};
