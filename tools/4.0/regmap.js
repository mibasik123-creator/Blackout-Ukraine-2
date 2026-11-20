/* ---------- Карта регістрів станції (Підключення › Сервіс) ----------
   Read-only: only looks at the frames the station already sends. Lets the user tag a moment
   ("USB-C 1 — телефон") and produces a short report of which registers changed between tags. */
var RM={on:0,prev:null,hit:{},steps:[],ui:0};
var RM_PORTS=['Нічого не підключено','USB-A 1','USB-A 2','USB-C 1','USB-C 2','USB-C 3','USB-C 100 Вт','Прикурювач','DC 5521','XT60','AC — навантаження'];
(function(){var f=btFrame2;btFrame2=function(){f.apply(this,arguments);try{rmFrame()}catch(e){}}})();
function rmFrame(){if(!RM.on||!BT.regs)return;var r=BT.regs,now=Date.now();
 if(RM.prev)for(var i=0;i<r.length;i++)if(r[i]!==RM.prev[i])RM.hit[i]=now;RM.prev=r.slice();
 if(!RM.ui){RM.ui=setTimeout(function(){RM.ui=0;rmGrid()},700)}}
function rmStart(){if(!BT.on||!BT.regs){toast('Спочатку підключіть станцію по Bluetooth');return}RM.on=1;RM.prev=BT.regs.slice();RM.hit={};RM.steps=[];rmUi()}
function rmStop(){RM.on=0;rmUi()}
function rmMark(label){if(!RM.on||!BT.regs)return;RM.steps.push({t:Date.now(),n:label,r:BT.regs.slice(),w:BT.w});toast('Записано: '+label);rmUi()}
function rmMarkTxt(){var e=document.getElementById('rmtxt');if(!e||!e.value.trim())return;rmMark(e.value.trim());e.value=''}
function rmReport(){var S0=RM.steps;if(!S0.length)return '';var o=['BLACKOUT карта регістрів · '+(BT.name||'')+' · '+new Date(S0[0].t).toLocaleString(),'Крок 1 «'+S0[0].n+'» (усі ненульові): '+S0[0].r.map(function(v,i){return v?i+'='+v:''}).filter(Boolean).join(' ')];
 for(var k=1;k<S0.length;k++){var a=S0[k-1].r,b=S0[k].r,d=[];for(var i=0;i<b.length;i++)if(a[i]!==b[i])d.push(i+':'+a[i]+'→'+b[i]);
  o.push('Крок '+(k+1)+' «'+S0[k].n+'» (+'+Math.round((S0[k].t-S0[k-1].t)/1000)+' с, вихід '+(S0[k].w!=null?S0[k].w+' Вт':'?')+'): '+(d.join(' ')||'без змін'))}
 return o.join('\n')}
function rmCopy(){var t=rmReport();if(!t){toast('Немає кроків');return}var ta=document.getElementById('rmout');if(ta){ta.value=t;ta.style.display=''}
 try{navigator.clipboard.writeText(t).then(function(){toast('Скопійовано — вставте в чат')},function(){if(ta){ta.select();document.execCommand('copy');toast('Скопійовано')}})}catch(e){if(ta){ta.select();document.execCommand('copy')}}}
function rmGrid(){var g=document.getElementById('rmgrid');if(!g)return;var r=BT.regs||[],now=Date.now(),h='';
 for(var i=0;i<r.length;i++){var a=RM.hit[i],c=a&&now-a<6000?'hot':a?'warm':'';h+='<span class="'+c+'"><i>'+i+'</i>'+r[i]+'</span>'}g.innerHTML=h}
function rmCardHtml(){var h='<div class="card" id="rmcard"><h2>Карта регістрів станції</h2>';
 h+='<div class="mut" style="font-size:12.5px;line-height:1.5;margin-bottom:8px">Нічого не змінює в станції — лише читає. 1) «Почати». 2) Від’єднайте все й натисніть «Нічого не підключено». 3) Підключіть телефон в один порт, зачекайте ~15 с і натисніть назву цього порту. 4) Від’єднайте, знову «Нічого не підключено». Повторіть для інших портів. 5) «Копіювати звіт» і вставте в чат.</div>';
 h+='<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="sm" onclick="'+(RM.on?'rmStop()':'rmStart()')+'">'+(RM.on?'Зупинити':'Почати')+'</button><button class="sm" onclick="rmCopy()"'+(RM.steps.length?'':' disabled')+'>Копіювати звіт ('+RM.steps.length+')</button></div>';
 if(RM.on){h+='<div style="margin-top:10px">'+RM_PORTS.map(function(p){return '<button class="sm" style="margin:0 6px 6px 0" onclick="rmMark(\''+p+'\')">'+p+'</button>'}).join('')+'</div>'
  +'<div class="rc" style="margin-top:4px"><input id="rmtxt" placeholder="Своя позначка, напр. «чайник 2000 Вт»"><button onclick="rmMarkTxt()">+</button></div>'
  +'<div class="mut" style="font-size:11.5px;margin-top:8px">Зелене — змінилося щойно, жовте — змінювалося раніше.</div><div id="rmgrid" class="rmg"></div>'}
 h+='<textarea id="rmout" readonly style="display:none;height:120px;margin-top:8px"></textarea></div>';return h}
function rmUi(){var e=document.getElementById('rmcard');if(!e)return;var t=document.createElement('div');t.innerHTML=rmCardHtml();e.replaceWith(t.firstChild);rmGrid();try{btgApply(false)}catch(x){}}
