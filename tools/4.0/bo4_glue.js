/* ---------- BLACKOUT 4.0 inside the app: shadow-DOM mount + real data adapters ----------
   The overview lives in its own shadow root, so its styles never touch other screens and
   the app's styles never touch it. Data comes only from what the app really measures. */
var HOST=null,ROOT=null,stT=0,BO4_STN='',BO4_GEN='';
function ACTIVE(){return !!(HOST&&HOST.isConnected&&!document.hidden)}
function onVis(){var a=ACTIVE();Flow.pauseAll(true);var s3=$('s3');if(s3&&s3.pauseAnimations){if(a)s3.unpauseAnimations();else s3.pauseAnimations()}if(a){try{s3Liq()}catch(e){}}if(!a){for(var id in NUM){var e=$(id);if(e&&e._r){cancelAnimationFrame(e._r);e._r=0}}pending=0}else paint()}
document.addEventListener('visibilitychange',onVis);
function build(){HOST=document.createElement('div');HOST.id='bo4host';ROOT=HOST.attachShadow({mode:'open'});ROOT.innerHTML='<style>'+BO4_CSS+'</style>'+BO4_HTML;var hd2=ROOT.querySelector('.hd2');if(hd2){var sl=document.createElement('slot');sl.name='sch';hd2.parentNode.insertBefore(sl,hd2)}
 Flow.init();
 function go(id,f){var e=$(id);if(e)e.addEventListener('click',f)}
 go('dcard',function(){boSheet('st')});
 go('gcard',function(){boSheet('gen')});
 go('ccard',function(){boSheet('car')});
 go('n-gen',function(){boSheet('gen')});go('s3-gen',function(){boSheet('gen')});go('s3-st',function(){boSheet('st')});go('s3-car',function(){boSheet('car')});go('n-st',function(){boSheet('st')});go('carico',function(){boSheet('car')});
 /* row buttons: real app actions; the tap does not open the row */
 function act(id,f){var e=$(id);if(e)e.addEventListener('click',function(ev){ev.stopPropagation();if(e.disabled)return;try{f()}catch(x){console.error(x)}setTimeout(sync,60);setTimeout(sync,1500)})}
 /* on/off switches: generator session, station AC output (Fossibot), Tesla charging */
 act('gact',function(){if(S.run){if(confirm('Зупинити генератор?'))stopG()}else startG()});
 act('dact',function(){if(!BT.on){btConnect();return}if(fbIs()){var a=fbState('ac');if(a!=null)fbSet('ac',!a);return}if(confirm('Відключити станцію від застосунку?'))btDisc()});
 act('cact',function(){var c=tsCfg();if(!c.paired){boSheet('car');return}if(!TS.on){tsConnect();return}
  var d=TS.d,chg=d&&(d.st===4||d.st===5);if(chg){if(confirm('Зупинити заряджання Tesla?'))tsCharge(false)}else tsCharge(true)});
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
  Tel.set('station',{pct:BT.pct,inW:BT.wi,outW:BT.w,tf:BT.tf,te:BT.te,t:stT});BO4_STN=nm;txt('stname2',nm)}
 else{var s0=Tel.get('station');if(s0&&s0.link!==false)Tel.markOffline('station')}
 /* generator: the generator sends no data; its state is the session started/stopped in the app */
 var g=S.gens[S.g]||S.gens[0];if(g){
  /* fuel: the app's own estimate — fills minus sessions, the running one included at the generator's rated l/h */
  var fl=null;if(S.fills.length){var left=fuelLeft(g);fl=Math.max(0,Math.min(100,left/fuelCap(g)*100))}
  Tel.set('gen',{on:!!S.run,fuel:fl,t:now});txt('gname',g.n);BO4_GEN=g.n}
 var ng=$('n-gen');if(ng)ng.classList.toggle('run',!!S.run&&MOTION);
 /* row buttons */
 function btn(id,label,show,c,dis){var e=$(id);if(!e)return;e.hidden=!show;if(e.textContent!==label)e.textContent=label;e.className='act '+(c||'');e.disabled=!!dis;e.removeAttribute('data-l')}
 function sw(id,on,c,cap,dis){var e=$(id);if(!e)return;e.hidden=false;if(!e.querySelector('i'))e.innerHTML='<i></i>';var k='act tg '+(c||'')+(on?' on':'');if(e.className!==k)e.className=k;e.disabled=!!dis;e.setAttribute('data-l',cap);e.setAttribute('aria-pressed',on?'true':'false')}
 if(g)sw('gact',!!S.run,'gen',S.run?'працює':'вимкн.');else btn('gact','',false);
 if(!BT.on)btn('dact','Підключити',true,'go');
 else if(fbIs()){var ac=fbState('ac');sw('dact',ac===true,'st',ac==null?'AC …':'AC '+(ac?'увімк.':'вимк.'),ac==null||(typeof FBO_BUSY!=='undefined'&&FBO_BUSY))}
 else btn('dact','Відключити',true,'');
 try{var tc=tsCfg(),td=TS.d,tchg=!!(td&&(td.st===4||td.st===5));
  if(!tc.vin)btn('cact','',false);else if(!tc.paired)btn('cact','Налаштувати',true,'go');else if(!TS.on)btn('cact',TS.connecting?'Підключення…':'Підключити',true,'go',!!TS.connecting);
  else sw('cact',tchg,'st',TS.chgBusy?'…':tchg?'заряд':'не заряд.',!!(TS.busy||TS.chgBusy||!td))}catch(e){}
 /* grid: confirmed only by the Fossibot AC-input measurement and only while the generator session is off */
 var fresh=BT.on&&stT&&now-stT<BO_LIMITS.station,acKnown=!!(BT.tx&&!(window.BLUP&&BLUP.on)&&!btIsEF()&&BT.regs&&BT.regs[22]!=null);
 var tg=(typeof tyGrid==='function')?tyGrid():null;
 if(S.run){if(Tel.d.grid){delete Tel.d.grid;Tel.emit('grid')}}
 else if(tg&&now-tg.t<BO_LIMITS.grid)Tel.set('grid',{on:tg.V>150,V:tg.V,t:tg.t});  /* Smart Life plug marked as city-grid sensor */
 else if(fresh&&acKnown)Tel.set('grid',{on:BT.hz!=null&&BT.vin>150,V:BT.vin,t:stT});
 /* car: Tesla over Bluetooth, time = when the car answered */
 try{var c=tsCfg();if(c.vin){var d=TS.d||c.last;var vi=vinInfo(c.vin);txt('cname',((vi.make||'Tesla')+' '+(vi.model||'')).trim());HOST&&HOST.style.setProperty('--carc',tsColor());
  if(d&&typeof d.t==='number')Tel.set('car',{pct:d.pct,kW:d.kw,st:d.st,t:d.t,link:!!(TS.on&&TS.d)});else if(Tel.d.car){delete Tel.d.car;Tel.emit('car')}}}catch(e){}
 /* grid V/A/Hz line (measured by the station) */
 var gl=$('gline');if(gl){var gt='';try{if(fresh&&S.run)gt=pbGridTxt();if(gt&&S.run)gt=gt.replace(/^[^<]+/,'Вхід від генератора ')}catch(e){}if(gl.innerHTML!==gt)gl.innerHTML=gt;gl.hidden=!gt;gl.classList.toggle('gen',!!S.run)}
 txt('loc',S.locs&&S.locs[S.loc]?S.locs[S.loc]:'');try{s3Inv()}catch(e){}}
setInterval(function(){if(ACTIVE())sync()},2000);
window.BO4={attach:attach,sync:sync,frame:function(){stT=Date.now();if(ACTIVE())sync()},lost:function(){if(ACTIVE())sync()},active:ACTIVE};
