/* ---------- 4.0.25: Smart Life plug through Tuya Cloud (when the plug refuses local Wi-Fi) ----------
   Only with the user's explicit opt-in: the Access ID / Secret of THEIR OWN cloud project are kept on this phone.
   Poll every 2 min (free Tuya plan has a monthly API quota). Plug offline in the cloud = it has no power. */
var TYC={tk:'',exp:0,busy:0};
function tycCfg(){return S.tyc&&S.tyc.id&&S.tyc.sec?S.tyc:null}
async function tycCall(method,path,bodyObj){var c=tycCfg();if(!c)throw new Error('хмарний режим не налаштовано');var N=tyNet();if(!N||!N.http)throw new Error('потрібна нова версія застосунку');
 async function call(tok,m,p,b){var t=String(Date.now()),body=b?JSON.stringify(b):'',str=m+'\n'+await tySha(body)+'\n\n'+p;
  var sig=tyHex(await tyHmac(tyStr(c.sec),tyStr(c.id+(tok||'')+t+str))).toUpperCase(),h={client_id:c.id,sign:sig,t:t,sign_method:'HMAC-SHA256'};if(tok)h.access_token=tok;if(b)h['Content-Type']='application/json';
  var r=await N.http({url:'https://'+TY_HOSTS[c.reg||'eu']+p,method:m,headers:h,body:b?body:undefined});var j=JSON.parse(r.body||'{}');
  if(!j.success){var e=new Error(j.msg||('HTTP '+r.status));e.code=j.code;throw e}return j.result}
 if(!TYC.tk||Date.now()>TYC.exp){var tk=await call('', 'GET','/v1.0/token?grant_type=1');TYC.tk=tk.access_token;TYC.exp=Date.now()+Math.max(60,(tk.expire_time||7200)-120)*1000}
 try{return await call(TYC.tk,method,path,bodyObj)}catch(e){if(e.code===1010||e.code===1011){TYC.tk='';return tycCall(method,path,bodyObj)}throw e}}
function tycRead(res){var d={},st={};(res.status||[]).forEach(function(x){st[x.code]=x.value});
 d.on=st.switch_1!=null?!!st.switch_1:st.switch!=null?!!st.switch:null;if(st.cur_voltage!=null)d.V=st.cur_voltage/10;if(st.cur_power!=null)d.W=st.cur_power/10;if(st.cur_current!=null)d.A=st.cur_current/1000;
 d.online=res.online!==false;if(!d.online){d.V=0;d.W=0;d.A=0}else if(d.V==null)d.V=230;return d}
async function tycPoll(i,set){var p=tyCfg()[i];if(!p)return;var st=TY.plugs[p.dev]||(TY.plugs[p.dev]={});if(st.busy)return;st.busy=1;tyUi();
 try{if(set){var on=set['1'];await tycCall('POST','/v1.0/devices/'+p.dev+'/commands',{commands:[{code:p.swc||'switch_1',value:!!on}]});tyLog('CLOUD','switch '+(on?'on':'off'))}
  var r=await tycCall('GET','/v1.0/devices/'+p.dev);st.d=tycRead(r);if(!p.swc)p.swc=(r.status||[]).some(function(x){return x.code==='switch'})&&!(r.status||[]).some(function(x){return x.code==='switch_1'})?'switch':'switch_1';
  st.t=Date.now();st.err=st.d.online?'':'офлайн у хмарі — розетка без живлення або не підключена до Wi-Fi';tyLog('CLOUD',p.name+': '+(st.d.online?'online':'offline')+(st.d.V!=null?' '+st.d.V+'V':''))}
 catch(e){st.err='хмара: '+String(e&&e.message||e);if(/offline/i.test(st.err))st.err='розетка офлайн у хмарі — команду не доставлено';if(/permission|subscription|expire/i.test(st.err))st.err+=' — перевірте пробний період IoT Core на iot.tuya.com'}
 st.busy=0;tyUi();try{BO4.sync()}catch(e){}}
(function(){var lp=tyPoll;tyPoll=function(i,set){var p=tyCfg()[i];if(p&&p.cloud&&tycCfg())return tycPoll(i,set);return lp.apply(this,arguments)}})();
/* cloud plugs are polled every 2 min instead of every 15 s */
(function(){tyStart=function(){clearInterval(TY.timer);var n=0;TY.timer=setInterval(function(){if(document.hidden)return;n++;tyCfg().forEach(function(p,i){if(p.cloud&&tycCfg()){if(n%8===0)tyPoll(i)}else tyPoll(i)})},15000);tyCfg().forEach(function(p,i){tyPoll(i)})}})();
function tycEnable(){var id=((document.getElementById('tyaid')||{}).value||'').trim(),sec=((document.getElementById('tyasec')||{}).value||'').trim(),reg=(document.getElementById('tyreg')||{}).value||'eu',ok=document.getElementById('tycok');
 if(!id||!sec){TY.err='вкажіть Access ID і Access Secret вище';tyUi(true);return}if(!ok||!ok.checked){TY.err='поставте галочку згоди на збереження ключів';tyUi(true);return}
 S.tyc={id:id,sec:sec,reg:reg};TY.dId=TY.dSec='';TY.dOk=false;TYC.tk='';tyCfg().forEach(function(p){if(p.dev)p.cloud=true});save();TY.err='';TY.note='хмарний режим увімкнено';tyUi(true);tyCfg().forEach(function(p,i){tyPoll(i)})}
function tycDisable(){if(!confirm('Вимкнути хмарний режим і стерти ключі з телефона?'))return;delete S.tyc;TYC.tk='';tyCfg().forEach(function(p){delete p.cloud});save();TY.note='хмарний режим вимкнено, ключі стерто';tyUi(true)}
function tycSetPlug(i,v){var p=tyCfg()[i];if(!p)return;p.cloud=!!v;save();tyUi(true);tyPoll(i)}
(function(){var ch=tyCardHtml;tyCardHtml=function(){var h=ch.apply(this,arguments),c=tycCfg();
 var x='<div class="tyc">'+(c?'<div class="tyc-on">☁ Хмарний режим увімкнено · '+tyEsc(c.id.slice(0,4))+'…'+tyEsc(c.id.slice(-3))+'</div>'
   +tyCfg().map(function(p,i){return p.dev?'<label class="svtg"><input type="checkbox"'+(p.cloud?' checked':'')+' onchange="tycSetPlug('+i+',this.checked)"> <span>'+tyEsc(p.name)+' — через хмару</span></label>':''}).join('')
   +'<div class="mut" style="font-size:12px;line-height:1.45;margin:4px 0 8px">Оновлення раз на 2 хв. Якщо розетка зникла з мережі (немає світла) — вона «офлайн», і датчик «є світло» покаже, що світла немає. Потрібен інтернет на телефоні.</div>'
   +'<button class="sec sm" onclick="tycDisable()">Вимкнути і стерти ключі</button>'
  :'<details'+(TY.dOk||TY.dId?' open':'')+'><summary class="mut" style="font-size:12px">Розетка не відповідає по Wi-Fi? Хмарний режим</summary><div class="mut" style="font-size:12px;line-height:1.5;margin:6px 0">Деякі розетки на новій прошивці не дозволяють локальне підключення. Тоді застосунок може читати їх через хмару Tuya вашого проєкту (iot.tuya.com). Для цього Access ID і Access Secret <b>зберігаються на цьому телефоні</b>. Введіть їх у полях «Отримати Local Key» вище.</div>'
   +'<label class="svtg"><input type="checkbox" id="tycok"'+(TY.dOk?' checked':'')+' onchange="TY.dOk=this.checked"> <span>Дозволяю зберегти ключі мого хмарного проєкту на цьому телефоні</span></label><button class="sm" style="margin-top:8px" onclick="tycEnable()">Увімкнути хмарний режим</button></details>')+'</div>';
 var k=h.indexOf('<details style="margin-top:8px"><summary class="mut" style="font-size:12px">Журнал обміну');return k>0?h.slice(0,k)+x+h.slice(k):h+x}})();
tyGrid=function(){var best=null;tyCfg().forEach(function(p){var st=TY.plugs[p.dev];if(p.grid&&st&&st.t&&st.d&&st.d.V!=null&&(!best||st.t>best.t))best={t:st.t,V:st.d.V,cloud:!!(p.cloud&&tycCfg())}});return best};
