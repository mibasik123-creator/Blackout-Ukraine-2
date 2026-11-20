/* ---------- 4.0.16: tank volume + "full tank" reset ----------
   g.tank — tank volume, L. g.fz — reset point {t, l}: from that moment the tank holds l litres,
   then refills are added and generator runs are subtracted (never above the tank volume). */
function boTank(g){if(g.tank>0)return g.tank;return /FG\s*6500/i.test(g.n||'')?25:null}
function boUsedSince(g,t0){var u=0;S.ses.forEach(function(s){if(s.g!=g.n||!(s.e>t0))return;var a=Math.max(s.s||s.e,t0),span=(s.e-(s.s||s.e))||1;u+=s.f*Math.min(1,(s.e-a)/span)});
 if(S.run&&S.gens[S.g]==g)u+=(Date.now()-Math.max(S.run,t0))/3600000*g.lph;return u}
(function(){var fl=fuelLeft,fc=fuelCap;
 fuelLeft=function(g){if(!g||!g.fz)return fl(g);var cap=boTank(g)||Infinity,b=g.fz.l;
  /* walk refills and use in time order so a refill can't push the tank above its volume */
  var ev=[];S.fills.forEach(function(f){if(f.g==g.n&&f.t>g.fz.t)ev.push({t:f.t,l:f.l})});ev.sort(function(a,b){return a.t-b.t});
  var t=g.fz.t;ev.forEach(function(e){b-=boUsedSince(g,t)-boUsedSince(g,e.t);b=Math.min(cap,Math.max(0,b)+e.l);t=e.t});
  b-=boUsedSince(g,t);return Math.max(0,Math.min(cap,b))};
 fuelCap=function(g){var k=g&&boTank(g);return k?k:fc(g)}})();
function boFullTank(){var g=S.gens[S.g];if(!g)return;var cap=boTank(g);if(!cap){toast('Спочатку вкажіть об’єм бака');return}
 if(!confirm('Обнулити облік палива і почати з повного бака '+cap+' л?'))return;g.fz={t:Date.now(),l:cap};save();render();try{boSheetFill(true)}catch(e){}toast('Бак: '+cap+' л')}
function boSetTank(v){var g=S.gens[S.g];if(!g)return;v=parseFloat(String(v).replace(',','.'));if(!(v>0&&v<500))return toast('Вкажіть об’єм у літрах');g.tank=v;save();render();try{boSheetFill(true)}catch(e){}}
fuelCard=function(g){var cap=boTank(g),b=fuelLeft(g),pct=cap?Math.round(b/cap*100):null;
 var h='<div class="card"><h2>'+L3('Топливо в баке','Паливо в баку','Fuel')+'</h2>';
 h+='<div class="kv"><span>'+L3('Остаток (расчёт)','Залишок (розрахунок)','Remaining (est.)')+'</span><b>'+f1(b)+' л'+(pct!=null?' · '+pct+'%':'')+'</b></div>';
 if(cap)h+='<div class="fuelbar"><i style="width:'+Math.max(0,Math.min(100,pct))+'%"></i></div>';
 h+='<div class="kv"><span>'+L3('Хватит примерно на','Вистачить приблизно на','Lasts about')+'</span><b>'+f1(b/(g.lph||1))+' '+L3('ч','год','h')+'</b></div>';
 h+='<div class="row" style="margin-top:8px"><input id="fl" type="number" step="0.1" inputmode="decimal" placeholder="'+L3('Залито, л','Залито, л','Added, L')+'"><button onclick="addFill()" style="margin-top:0">'+L3('Заправил','Заправив','Refueled')+'</button></div>';
 h+='<div class="row" style="margin-top:8px"><button class="sec" onclick="boFullTank()"'+(cap?'':' disabled')+'>'+L3('Полный бак','Повний бак','Full tank')+(cap?' · '+cap+' л':'')+'</button></div>';
 h+='<div class="rc" style="margin-top:8px"><span>'+L3('Объём бака, л','Об’єм бака, л','Tank, L')+'</span><input type="number" step="0.5" inputmode="decimal" value="'+(cap||'')+'" placeholder="25" onchange="boSetTank(this.value)"></div>';
 if(g.fz)h+='<div class="mut" style="font-size:12px;margin-top:6px">'+L3('Учёт с ','Облік з ','Tracking since ')+new Date(g.fz.t).toLocaleString('uk-UA',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+L3('полный бак','повний бак','full tank')+' '+g.fz.l+' л</div>';
 return h+'</div>'};
