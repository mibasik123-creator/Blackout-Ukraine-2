/* ---------- 4.0.21: Tesla — step-by-step setup anyone can follow ----------
   1 VIN → 2 find the car nearby → 3 add a charging-only key (key card on the console) → done. */
var TZ={t0:0,vinWarn:''};
function tzVinCheck(v){/* ISO 3779 check digit (position 9) — a hint only, never blocks */
 var tr={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9},w=[8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2],s=0;
 for(var i=0;i<17;i++){var ch=v[i],n=/[0-9]/.test(ch)?+ch:tr[ch];if(n==null)return false;s+=n*w[i]}var c=s%11;return (c===10?'X':String(c))===v[8]}
function tzStep(){var c=tsCfg();if(!c.vin)return 1;if(c.paired)return 4;if(TS.on)return 3;return 2}
function tzErr(){var e=String(TS.err||'');if(!e)return '';
 if(/HMAC|справжност|подлинност/i.test(e))return 'Схоже, VIN не збігається з цим авто. Перевірте VIN — одна неправильна літера заважає підключенню.';
 if(/не знайдено|not found|No device|cancel/i.test(e))return 'Авто з цим VIN поруч не знайдено. Підійдіть ближче, розбудіть авто (відчиніть двері) і спробуйте ще раз.';
 if(/за хвилину|minute/i.test(e))return 'Ключ-карту не приклали вчасно. Натисніть «Додати ключ» ще раз і одразу прикладіть картку.';
 return e}
function tzDots(n){var h='<div class="tz-dots">';for(var i=1;i<=3;i++)h+='<i class="'+(i<n?'done':i===n?'on':'')+'"></i>';return h+'</div>'}
function tzHead(n,title){return tzDots(n)+'<div class="tz-k">Крок '+n+' з 3</div><h2 class="tz-h">'+title+'</h2>'}
function tzHtml(){var c=tsCfg(),n=tzStep(),h='<div class="card tz" id="tzcard">',er=tzErr();
 if(n===1){h+=tzHead(1,'Введіть VIN автомобіля');
  h+='<div class="tz-p">VIN — 17 літер і цифр. Де його знайти:</div><ul class="tz-l"><li><b>Застосунок Tesla</b> — розділ «Характеристики»</li><li><b>Екран авто</b> — «Керування» → «Програмне забезпечення»</li><li><b>Лобове скло</b> — табличка зліва внизу, видно ззовні</li><li><b>Техпаспорт</b> авто</li></ul>';
  h+='<input id="tzvin" class="tz-vin" maxlength="20" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="5YJ… / 7SA… / LRW…" oninput="tzVinInput(this)" value="'+esc(TZ.draft||'')+'"><div class="tz-cnt" id="tzcnt">'+(TZ.draft||'').length+' / 17</div><div class="tz-warn" id="tzwarn">'+esc(TZ.vinWarn)+'</div>';
  h+='<button class="tz-b" onclick="tzVinSave()">Далі</button>'}
 else if(n===2){h+=tzHead(2,'Знайдемо ваше авто');
  h+='<ul class="tz-c"><li><span class="tz-o"></span>Сядьте в авто або станьте поруч — до 3 метрів</li><li><span class="tz-o"></span>Bluetooth на телефоні увімкнено</li><li><span class="tz-o"></span>Розбудіть авто: відчиніть двері або торкніться екрана</li></ul>';
  h+='<button class="tz-b" onclick="tzFind()"'+(TS.connecting?' disabled':'')+'>'+(TS.connecting?'Шукаємо авто…':'Знайти авто')+'</button>';
  h+='<div class="tz-mut">Телефон покаже вікно вибору пристрою — оберіть пристрій, назва якого починається на «S».</div>';
  if(er)h+='<div class="tz-e">'+esc(er)+'</div>';
  h+='<button class="sec tz-l2" onclick="tzEditVin()">Змінити VIN …'+esc(c.vin.slice(-6))+'</button>'}
 else if(n===3){var busy=TS.st==='pairing',left=busy?Math.max(0,60-Math.floor((Date.now()-TZ.t0)/1000)):60;
  h+=tzHead(3,busy?'Прикладіть ключ-карту':'Додайте телефон як ключ');
  if(!busy){h+='<div class="tz-ok">✓ Авто знайдено і підключено</div><div class="tz-p">Застосунок стане ключем <b>лише для зарядки</b>: бачить заряд, вмикає і вимикає зарядку. Відчинити чи завести авто він <b>не може</b>.</div>';
   h+='<button class="tz-b" onclick="tzPair()">Додати ключ</button><div class="tz-mut">Після натискання майте під рукою ключ-карту Tesla.</div>'}
  else{h+=tzCardArt()+'<div class="tz-p">Покладіть ключ-карту на <b>центральну консоль</b> — туди, де зарядка для телефонів, і потримайте 2–3 секунди. Якщо на екрані авто з’явиться запит — натисніть «Підтвердити».</div>';
   h+='<div class="tz-cd"><b id="tzcd">'+left+'</b><span>секунд</span></div>'}
  if(er&&!busy)h+='<div class="tz-e">'+esc(er)+'</div>'}
 else{var d=TS.d||c.last;h+='<div class="tz-done"><div class="tz-big">✓</div><h2 class="tz-h">Tesla підключена</h2><div class="tz-p">'+(d&&d.pct!=null?'Заряд: <b>'+Math.round(d.pct)+'%</b>':'Дані з’являться за кілька секунд')+'</div></div>'}
 return h+'</div>'}
function tzCardArt(){return '<svg class="tz-art" viewBox="0 0 220 120" aria-hidden="true"><defs><linearGradient id="tzg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3337"/><stop offset="1" stop-color="#171c1f"/></linearGradient></defs>'
 +'<rect x="40" y="30" width="140" height="80" rx="16" fill="url(#tzg)" stroke="#3a4448"/><rect x="62" y="44" width="96" height="40" rx="8" fill="#0f1416" stroke="#2f383c"/><text x="110" y="100" text-anchor="middle" fill="#6f7c83" font-size="9" font-family="Inter,sans-serif">центральна консоль</text>'
 +'<g class="tz-card"><rect x="78" y="8" width="64" height="40" rx="5" fill="#f3f5f6" stroke="#c8cfd2"/><rect x="86" y="16" width="20" height="4" rx="2" fill="#c8cfd2"/><path d="M126 22c4 4 4 12 0 16M131 18c7 7 7 19 0 26" fill="none" stroke="#9aa5ab" stroke-width="2" stroke-linecap="round"/></g>'
 +'<circle cx="110" cy="64" r="14" fill="none" stroke="#A8D957" stroke-width="2" opacity=".7"><animate attributeName="r" values="10;26" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.4s" repeatCount="indefinite"/></circle></svg>'}
function tzVinInput(e){var v=e.value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(e.value!==v)e.value=v;TZ.draft=v;var n=document.getElementById('tzcnt');if(n)n.textContent=v.length+' / 17';
 var w=document.getElementById('tzwarn'),m='';if(/[IOQ]/.test(v))m='У VIN немає літер I, O, Q — можливо, це цифри 1 або 0.';else if(v.length===17&&!tzVinCheck(v))m='Перевірте ще раз — схоже на помилку в одному символі. Якщо все вірно, натисніть «Далі».';
 TZ.vinWarn=m;if(w)w.textContent=m}
function tzVinSave(){var v=(TZ.draft||'').toUpperCase();if(v.length!==17){toast('VIN має 17 символів, зараз '+v.length);return}if(/[IOQ]/.test(v)){toast('Замініть I/O/Q на 1/0');return}
 var c=tsCfg();if(c.vin!==v){c.vin=v;delete c.id;delete c.paired}TS.err='';save();tzRefresh()}
function tzEditVin(){var c=tsCfg();TZ.draft=c.vin||'';TZ.vinWarn='';try{tsDisc()}catch(e){}delete c.vin;delete c.id;delete c.paired;TS.err='';save();tzRefresh()}
function tzFind(){TS.err='';var c=tsCfg();delete c.id;save();tsConnect();setTimeout(tzRefresh,50)}
function tzPair(){TZ.t0=Date.now();TS.err='';tsPair();setTimeout(tzRefresh,50)}
function tzRefresh(){try{if(tab==='car')render()}catch(e){}try{boSheetFill(true)}catch(e){}}
setInterval(function(){var e=document.getElementById('tzcd');if(e&&TS.st==='pairing'){e.textContent=Math.max(0,60-Math.floor((Date.now()-TZ.t0)/1000))}},500);
/* the Tesla page and the car sheet show the wizard until the key is added */
(function(){var vc=vCar;vCar=function(){var c=tsCfg();if(c.paired)return vc.apply(this,arguments);return tzHtml()+(c.vin?'<button class="sec tz-l2" style="margin-top:4px" onclick="if(confirm(\'Забути це авто?\'))tsForget()">Забути авто</button>':'')}})();
(function(){var h=boSheetHtml;boSheetHtml=function(){if(BOSH.kind==='car'&&!tsCfg().paired)return tr(tzHtml());return h.apply(this,arguments)}})();
(function(){var k=boSheetKey;boSheetKey=function(){var x=k.apply(this,arguments);return BOSH.kind==='car'?x+'|'+tzStep()+'|'+(TS.connecting?1:0)+'|'+(TS.err||''):x}})();
(function(){var u=tsUi;tsUi=function(){var k=tzStep()+'|'+TS.st+'|'+(TS.connecting?1:0)+'|'+(TS.err?1:0);if(k!==TZ.key){TZ.key=k;if(tab==='car'&&!tsCfg().paired){var a=document.activeElement;if(!(a&&a.id==='tzvin'))setTimeout(tzRefresh,0)}}return u.apply(this,arguments)}})();
