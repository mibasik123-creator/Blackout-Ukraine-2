/* ---------- BLACKOUT 4.0.15: three tabs, bottom sheets on the home screen ----------
   Головна · Історія · Налаштування. Device screens (Пристрої, Генератор, Станції, Авто, Загальні)
   live inside Налаштування as a segment bar; on the home screen a tap opens a bottom sheet. */
var BO_CFG=[['bt','Пристрої'],['gen','Генератор'],['st','Станції'],['car','Авто'],['set','Загальні']];
TABS=['pan','hist','bt','gen','st','car','set','cat'];
function boInCfg(t){return t==='cat'||BO_CFG.some(function(x){return x[0]===t})}
function boCfgLast(){var t='bt';try{t=localStorage.getItem('bo_cfg')||'bt'}catch(e){}return boInCfg(t)&&t!=='cat'?t:'bt'}
(function(){var s=setTab;setTab=function(t){if(t==='cfg')t=boCfgLast();if(boInCfg(t)&&t!=='cat'){try{localStorage.setItem('bo_cfg',t)}catch(e){}}boSheetClose(true);return s.call(this,t)}})();
(function(){var r=render;render=function(){r.apply(this,arguments);try{boCfgBar()}catch(e){console.error(e)}}})();
function boCfgBar(){var ap=document.getElementById('app');if(!ap||!boInCfg(tab))return;var cur=tab==='cat'?'set':tab;
 var d=document.createElement('div');d.id='bocfg';d.className='bocfg';d.setAttribute('role','tablist');
 d.innerHTML=BO_CFG.map(function(x){return '<button role="tab" class="'+(x[0]===cur?'on':'')+'" onclick="setTab(\''+x[0]+'\')">'+x[1]+'</button>'}).join('');
 ap.insertBefore(d,ap.firstChild);var on=d.querySelector('.on');if(on&&on.scrollIntoView)try{d.scrollLeft=on.offsetLeft-12}catch(e){}}
/* ---- bottom sheet ---- */
var BOSH={kind:'',key:'',el:null};
function boSheetEl(){if(BOSH.el)return BOSH.el;var bg=document.createElement('div');bg.id='bosh-bg';bg.onclick=function(){boSheetClose()};
 var sh=document.createElement('div');sh.id='bosheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');
 sh.innerHTML='<div class="grab" aria-hidden="true"><i></i></div><button class="shx" aria-label="Закрити" onclick="boSheetClose()">×</button><div id="bosh-c"></div>';
 document.body.appendChild(bg);document.body.appendChild(sh);BOSH.el=sh;
 var y0=null,dy=0,grab=sh.querySelector('.grab');
 function st(e){var c=document.getElementById('bosh-c');if(e.target!==grab&&!grab.contains(e.target)&&c.scrollTop>0)return;y0=e.touches[0].clientY;dy=0;sh.style.transition='none'}
 function mv(e){if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);if(dy>0){sh.style.transform='translateY('+dy+'px)';if(e.cancelable&&dy>8)e.preventDefault()}}
 function en(){if(y0==null)return;y0=null;sh.style.transition='';sh.style.transform='';if(dy>90)boSheetClose()}
 sh.addEventListener('touchstart',st,{passive:true});sh.addEventListener('touchmove',mv,{passive:false});sh.addEventListener('touchend',en);
 return sh}
function boSheet(kind){var sh=boSheetEl();BOSH.kind=kind;BOSH.key='';boSheetFill(true);
 requestAnimationFrame(function(){document.body.classList.add('bosh-open');sh.classList.add('open')});
 try{history.pushState({bosh:1},'')}catch(e){}}
function boSheetClose(silent){if(!BOSH.el||!BOSH.kind)return;BOSH.kind='';BOSH.el.classList.remove('open');document.body.classList.remove('bosh-open');
 if(!silent)try{if(history.state&&history.state.bosh)history.back()}catch(e){}}
window.addEventListener('popstate',function(){if(BOSH.kind){BOSH.kind='';BOSH.el.classList.remove('open');document.body.classList.remove('bosh-open')}});
function boSheetKey(){var k=BOSH.kind;
 if(k==='st')return [BT.on?1:0,boOutOk()?1:0,BT.regs?1:0,S.srun?1:0,BT.name||''].join('|');
 if(k==='gen')return [S.run?1:0,S.g,S.fills.length,Math.floor(Date.now()/60000)].join('|');
 if(k==='car'){var d=TS.d;return [TS.st,TS.on?1:0,TS.chgBusy?1:0,TS.busy?1:0,tsCfg().paired?1:0,d?d.st+'/'+Math.round(d.pct||0)+'/'+(d.kw||0):''].join('|')}
 return ''}
function boMore(t,label){return '<button class="sec bo-more" onclick="setTab(\''+t+'\')">'+label+'</button>'}
function boSheetHtml(){var k=BOSH.kind,h='';
 if(k==='st'){h+='<h2 class="shh">'+esc(BT.on&&BT.name?BT.name:'Станція')+'</h2>'+boStLive()+(BT.on?'':stCtl())+boMore('st','Усі дані та налаштування станцій')}
 else if(k==='gen'){var g=S.gens[S.g]||S.gens[0];h+='<h2 class="shh">'+esc(g?g.n:'Генератор')+'</h2>'+genCtl();
  try{var d=document.createElement('div');d.innerHTML=vGen();[].forEach.call(d.children,function(el){var t=el.querySelector&&el.querySelector(':scope>h2');if(t&&/Паливо|Топливо|Fuel|Мотогодин|Моточас|Engine hours/i.test(t.textContent))h+=el.outerHTML})}catch(e){}
  h+=boMore('gen','Усі налаштування генератора')}
 else if(k==='car'){h+=boCarHero()+boMore('car','Налаштування авто')}
 return tr(h)}
function boSheetFill(force){if(!BOSH.kind)return;var c=document.getElementById('bosh-c');if(!c)return;var a=document.activeElement;
 if(!force&&a&&c.contains(a)&&/INPUT|SELECT|TEXTAREA/.test(a.tagName))return;var k=boSheetKey();if(!force&&k===BOSH.key)return;BOSH.key=k;
 var y=c.scrollTop;c.innerHTML=boSheetHtml();c.scrollTop=y;try{fbUi()}catch(e){}try{btUi()}catch(e){}try{boOutUi()}catch(e){}}
setInterval(function(){if(BOSH.kind&&!document.hidden)boSheetFill(false)},1500);
/* home schedule goes right under the scene (slotted into the overview) */
function boSlotSchedule(){var host=document.getElementById('bo4host');if(!host)return;
 [].slice.call(host.children).forEach(function(c){if(c.getAttribute('slot')==='sch')c.remove()});
 var n=host.nextElementSibling;if(n&&n.classList&&n.classList.contains('sch')){n.setAttribute('slot','sch');host.appendChild(n)}}
(function(){var r=render;render=function(){r.apply(this,arguments);if(tab==='pan')try{boSlotSchedule()}catch(e){}}})();
