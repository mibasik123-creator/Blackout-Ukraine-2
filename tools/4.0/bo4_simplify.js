/* ===== 4.0.6 simpler home: controls moved to their own tabs (nothing removed) ===== */
/* Generator tab: start / stop the generator session (was only on the home screen) */
function genCtl(){var g=S.gens[S.g]||S.gens[0];if(!g)return '';var r=S.run;
 return '<div class="card ctl'+(r?' on':'')+'"><div class="ctlh"><div><div class="ctln">'+esc(g.n)+'</div><div class="mut" id="tm">'+(r?L3('Работает ','Працює ','Running ')+dur(Date.now()-r):L3('Выключен','Вимкнено','Off'))+'</div></div>'
  +'<button class="ctlb'+(r?' stop':'')+'" onclick="'+(r?"if(confirm(L3('Остановить генератор?','Зупинити генератор?','Stop the generator?')))stopG()":'startG()')+'">'+(r?L3('Остановить','Зупинити','Stop'):L3('Запустить','Запустити','Start'))+'</button></div></div>'}
/* Stations tab: manual charge tracking for stations without Bluetooth (e.g. Must) */
function stCtl(){var sr=S.srun,s=S.sts[sr?sr.i:si];if(!s)return '';
 if(BT.on)return '<div class="card ctl on"><div class="ctlh"><div><div class="ctln">'+esc(s.n)+'</div><div class="mut">'+L3('Подключена по Bluetooth — учёт автоматический','Підключена по Bluetooth — облік автоматичний','Connected via Bluetooth — tracked automatically')+'</div></div></div></div>';
 var o=S.sts.length>1&&!sr?'<select onchange="si=+this.value;render()" style="margin-top:8px">'+S.sts.map(function(x,i){return '<option value="'+i+'"'+(i==si?' selected':'')+'>'+esc(x.n)+'</option>'}).join('')+'</select>':'';
 return '<div class="card ctl'+(sr?' on':'')+'"><div class="ctlh"><div><div class="ctln">'+esc(s.n)+'</div><div class="mut" id="stm">'+(sr?L3('Учёт идёт ','Облік триває ','Tracking ')+dur(Date.now()-sr.t)+' · '+L3('старт ','старт ','start ')+sr.p+'%':L3('Учёт заряда вручную: введите % в начале и в конце','Облік заряду вручну: введіть % на початку і в кінці','Manual tracking: enter % at start and end')+'</div>')+(sr?'</div>':'')+'</div>'
  +'<button class="ctlb'+(sr?' stop':'')+'" onclick="'+(sr?'stStop()':'stStart()')+'">'+(sr?L3('Завершить','Завершити','Finish'):L3('Начать','Почати','Start'))+'</button></div>'+o+'</div>'}
/* History tab: today's numbers and the chart (were on the home screen) */
function histTop(){var g=S.gens[S.g]||S.gens[0],t0=new Date().setHours(0,0,0,0),th=0,tf2=0,kc=0;
 S.ses.forEach(function(s){if(s.s>=t0){th+=s.h;tf2+=s.f}});S.logs.forEach(function(l){if(l.c&&l.t>=t0)kc+=l.wh/1000});
 function tl(v,l){return '<div><b>'+v+'</b><span>'+l+'</span></div>'}
 var h='<div class="stats">'+tl(f1(th),L3('ч генератора сегодня','год генератора сьогодні','gen hours today'))+tl(f1(tf2),L3('л топлива сегодня','л палива сьогодні','L fuel today'))+tl(f1(g?g.h:0),L3('ч наработка','год напрацювання','total hours'))+tl(kc.toFixed(2).replace('.',','),L3('кВт·ч заряд сегодня','кВт·год заряд сьогодні','kWh charged today'))+'</div>';
 try{h+=pbChart()}catch(e){}return h}
/* Settings: place and person (were on the home screen) */
function setTop(){return '<div class="card"><h2>'+L3('Место и пользователь','Місце й користувач','Place and person')+'</h2><div class="locrow" style="margin:0"><select onchange="S.loc=+this.value;save()">'+so(S.locs,S.loc)+'</select><button class="sec gb2" onclick="locDetect()">'+svgi('pin',20)+'</button><select onchange="S.usr=+this.value;save()">'+so(S.users,S.usr)+'</select></div></div>'}
(function(){var a=vGen,b=vSt,c=vHist,d=vSet;vGen=function(){return genCtl()+a.apply(this,arguments)};vSt=function(){return stCtl()+b.apply(this,arguments)};vHist=function(){return histTop()+c.apply(this,arguments)};vSet=function(){return setTop()+d.apply(this,arguments)}})();
