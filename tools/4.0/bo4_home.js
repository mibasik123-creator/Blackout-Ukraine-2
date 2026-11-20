/* ---------- BLACKOUT 4.0.15: three tabs, bottom sheets on the home screen ----------
   Головна · Історія · Налаштування. Device screens (Пристрої, Генератор, Станції, Авто, Загальні)
   live inside Налаштування as a segment bar; on the home screen a tap opens a bottom sheet. */
var BO_CFG=[['bt',''],['gen',''],['st',''],['car',''],['set','']];
TABS=['pan','hist','bt','gen','st','car','set','cat'];
function boInCfg(t){return t==='cat'||BO_CFG.some(function(x){return x[0]===t})}
function boCfgLast(){return 'set'}
try{ACC_OPEN.bt=(ACC_OPEN.bt||[]).concat(['Інвертор','Инвертор','Inverter','Розетки','Plugs']);ACC_OPEN.gen=(ACC_OPEN.gen||[]).concat(['Паливо','Топливо','Fuel'])}catch(e){}
(function(){var s=setTab;setTab=function(t){if(t==='cfg')t='set';boSheetClose(true);return s.call(this,t)}})();
(function(){var r=render;render=function(){r.apply(this,arguments);try{boCfgBar()}catch(e){console.error(e)}}})();
/* ---- Налаштування: one clean list; every device opens its own page with a back button ---- */
var BO_SUB={st:'Станція',car:'Tesla',inv:'Інвертор',plug:'Розетки Wi-Fi',svc:'Діагностика'};
function boGo(t,g){if(g){try{localStorage.setItem('bo_btg',g)}catch(e){}}setTab(t)}
function boBtg(){try{return localStorage.getItem('bo_btg')||'st'}catch(e){return 'st'}}
function boSubTitle(){if(tab==='gen')return 'Генератор';if(tab==='st')return 'Облік станцій';if(tab==='car')return 'Tesla';if(tab==='bt')return BO_SUB[boBtg()]||'Пристрої';return ''}
function boCfgBar(){var ap=document.getElementById('app');if(!ap)return;
 if(tab==='set'&&!setSec){var l=ap.querySelector(':scope>.sl');if(l&&!document.getElementById('bodev')){var d=document.createElement('div');d.id='bodev';d.innerHTML=boDevList();l.parentNode.insertBefore(d,l);
   var h=document.createElement('div');h.className='bo-gh';h.textContent='Загальні';l.parentNode.insertBefore(h,l);
   var cat=ap.querySelector(':scope>.sr');var sv=document.createElement('div');sv.innerHTML='<div class="bo-gh">Сервіс</div><div class="sl">'+boRow('tool','Діагностика','Протокол станції, запис сеансу, карта регістрів',"boGo('bt','svc')")+'</div>';
   (cat||l).after(sv)}return}
 if(['bt','gen','st','car'].indexOf(tab)<0)return;
 var hero=ap.querySelector(':scope>.hero');if(hero)hero.remove();var seg=document.getElementById('btseg');if(seg)seg.style.display='none';
 var d2=document.createElement('div');d2.className='sh bo-sh';d2.innerHTML='<button class="sb" onclick="setTab(\'set\')" aria-label="Назад">'+svgi('back',20)+'<span>Налаштування</span></button><h1>'+boSubTitle()+'</h1>';
 ap.insertBefore(d2,ap.firstChild)}
function boRow(icon,title,sub,on){return '<button class="sr" onclick="'+on+'"><span class="si">'+svgi(icon,22)+'</span><span class="st"><b>'+title+'</b><small>'+esc(sub)+'</small></span><span class="sc">'+svgi('chev',18)+'</span></button>'}
function boDevList(){var g=S.gens[S.g]||S.gens[0],c=tsCfg(),ic=(typeof invCfg==='function')?invCfg():{},pl=(typeof tyCfg==='function')?tyCfg():[];
 var stSub=BT.on?(BT.name||'підключена')+(BT.pct!=null?' · '+Math.round(BT.pct)+'%':''):'не підключена · натисніть, щоб підключити';
 var gSub=g?g.n+(boTank(g)?' · бак '+Math.round(fuelLeft(g)/fuelCap(g)*100)+'%':''):'не додано';
 var tSub=c.vin?(c.paired?(TS.on?'на зв’язку':'ключ додано'):'потрібно додати ключ')+' · VIN …'+c.vin.slice(-6):'не додано';
 var iSub=ic&&ic.host?((typeof INV_TYPES!=='undefined'&&INV_TYPES[ic.type]?INV_TYPES[ic.type].n:ic.type)+' · '+ic.host):'не налаштовано';
 var pSub=pl.length?pl.length+' шт.'+(pl.some(function(p){return p.grid})?' · датчик «є світло»':''):'не додано';
 return '<div class="bo-gh">Пристрої</div><div class="sl">'+boRow('bt','Станція','Bluetooth: '+stSub,"boGo('bt','st')")+boRow('gen','Генератор',gSub,"setTab('gen')")+boRow('car','Tesla',tSub,"boGo('car')")
  +boRow('bolt','Інвертор',iSub,"boGo('bt','inv')")+boRow('plug','Розетки Wi-Fi',pSub,"boGo('bt','plug')")+boRow('bat','Облік станцій','Ручний облік заряду, час роботи, список станцій',"setTab('st')")+'</div>'}
/* single-card pages (inverter, plugs) always open, even after their card re-renders itself */
(function(){var a=btgApply;btgApply=function(){var r=a.apply(this,arguments);try{if(tab==='bt'){var g=boBtg();['invcard','tycard'].forEach(function(id){var e=document.getElementById(id);if(e&&((g==='inv'&&id==='invcard')||(g==='plug'&&id==='tycard'))){e.classList.add('acc','open')}})}}catch(e){}return r}})();
/* connection settings (auto-connect, which station this is) belong to the station page */
(function(){var g=btgGroup;btgGroup=function(el){var h=el.querySelector&&el.querySelector(':scope>h2'),t=(h?h.textContent:'').trim().toLowerCase();if(/^(подключение|підключення|connection)/.test(t))return 'st';return g(el)}})();
/* generator statistics live in Історія */
var BO_GSTAT=/^(Статистика|Statistics|Генератор по дням|Генератор за днями|Generator by day|По местам|За місцями|By place|По людям|За людьми|By person)/i;
(function(){var vg=vGen,vh=vHist;
 vGen=function(){var d=document.createElement('div');d.innerHTML=vg.apply(this,arguments);[].slice.call(d.children).forEach(function(el){var h=el.querySelector&&el.querySelector(':scope>h2');if(h&&BO_GSTAT.test(h.textContent.trim()))el.remove()});return d.innerHTML};
 vHist=function(){var h=vh.apply(this,arguments),d=document.createElement('div');d.innerHTML=vg();var x='';[].forEach.call(d.children,function(el){var t=el.querySelector&&el.querySelector(':scope>h2');if(t&&BO_GSTAT.test(t.textContent.trim()))x+=el.outerHTML});return h+(x?'<div class="bo-gh" style="margin-top:18px">Генератор</div>'+x:'')}})();
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
