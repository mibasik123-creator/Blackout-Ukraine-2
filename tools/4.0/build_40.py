"""BLACKOUT 4.0 full test build: the complete 3.4.2 app (ec9.html) + 4.0 overview as the home screen.
Output: proto/overview-4.0-full.html in the design/blackout-4.0 branch (separate test app)."""
import re, json, sys
REPO = '/home/claude/blackout-ukraine-2'
app = open('/home/claude/ec/ec9.html', encoding='utf-8').read()
import subprocess
v5 = subprocess.run(['git','-C',REPO,'show','design/blackout-4.0:proto/overview-4.0-v5.html'],capture_output=True,check=True).stdout.decode('utf-8')

def rep(s, a, b, n=1):
    assert s.count(a) == n, (s.count(a), a[:90])
    return s.replace(a, b)

# ---------- 4.0 overview: CSS for the shadow root ----------
css = v5[v5.index('<style>') + 7:v5.index('</style>')]
css = rep(css, ':root{', ':host{')
css = re.sub(r'html,body\{[^}]*\}', ':host{display:block;color:var(--t1);font:400 15px/1.35 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}', css, count=1)
css = re.sub(r'\nbody\{[^}]*\}', '\n', css, count=1)
css = rep(css, '.wrap{max-width:430px;margin:0 auto;padding:0 20px 112px}', '.wrap{max-width:430px;margin:0 auto;padding:0 6px 6px}')
css = rep(css, '.top{height:52px;display:flex;align-items:center}', '.top{height:52px;display:flex;align-items:center;padding-right:52px}')
css = re.sub(r'/\* Navigation \*/.*?(?=/\* Prototype panel)', '', css, flags=re.S)
assert 'nav{' not in css
css += ('.gline{margin:8px 0 0;font-size:12px;color:var(--t2);font-variant-numeric:tabular-nums}.gline b{color:var(--grid-v);font-weight:600}.gline.gen b{color:var(--gen-v)}.gline[hidden]{display:none}'
        '.row{cursor:pointer}.row:active{opacity:.7}[hidden]{display:none!important}')

# ---------- markup ----------
html = v5[v5.index('<div class="wrap">'):v5.index('<nav>')].strip()
html = rep(html, 'Дніпро · <b id="fst">оновлено щойно</b> · <span class="test">тестові дані</span>',
           '<span id="loc"></span> · <b id="fst">—</b><span class="test" id="testlbl" style="display:none"> · тестові дані</span>')
html = rep(html, '<div class="dev">Fossibot F2400</div>', '<div class="dev" id="stname">Станція</div>')
html = rep(html, '<b>Fossibot F2400</b>', '<b id="stname2">Станція</b>')
html = rep(html, '<b>FORTE FG6500</b>', '<b id="gname">Генератор</b>')
html = rep(html, '<b>Tesla Model Y</b>', '<b id="cname">Tesla</b>')
html = rep(html, '<span id="rtu"></span></b></div></div>', '<span id="rtu"></span></b></div></div>\n <div class="gline" id="gline" hidden></div>') if '<span id="rtu"></span></b></div></div>' in html else html
if 'id="gline"' not in html:
    html = rep(html, '<small id="rtu"></small></b></div></div>', '<small id="rtu"></small></b></div></div>\n <div class="gline" id="gline" hidden></div>')

# ---------- engine + UI renderer, adapted to a shadow root ----------
js = v5[v5.index('<script>') + 8:v5.rindex('</script>')]
js = rep(js, 'var BO_DEV_DEFAULT=true; /* prototype file: test panel visible; set false for the app build */', 'var BO_DEV_DEFAULT=false;')
js = rep(js, "if(typeof module!=='undefined')module.exports={TelemetryStore:TelemetryStore,computeBalance:computeBalance,validate:validate,sourceState:sourceState,BO_LIMITS:BO_LIMITS};", '')
js = rep(js, "if(out.station.outW!=null&&out.station.outW>BO_STATION_AC_MAX_W)issues.push({level:'error',code:'overload',text:'вихід станції '+Math.round(out.station.outW)+' Вт перевищує номінальні 2400 Вт'})",
         "if(BO_STATION_AC_MAX_W&&out.station.outW!=null&&out.station.outW>BO_STATION_AC_MAX_W)issues.push({level:'error',code:'overload',text:'вихід станції '+Math.round(out.station.outW)+' Вт перевищує номінальні '+BO_STATION_AC_MAX_W+' Вт'})")
js = rep(js, 'function $(id){return document.getElementById(id)}', 'function $(id){return ROOT?ROOT.getElementById(id):null}')
js = rep(js, 'function render(){var R=computeBalance', 'function paint(){if(!ROOT)return;var R=computeBalance')
js = rep(js, 'var pending=0;function schedule(){if(pending)return;pending=1;requestAnimationFrame(function(){pending=0;render()})}',
         'var pending=0;function schedule(){if(pending||!ACTIVE())return;pending=1;requestAnimationFrame(function(){pending=0;if(ACTIVE())paint()})}')
js = rep(js, 'var ageTimer=setInterval(function(){if(!document.hidden)render()},5000);', 'var ageTimer=setInterval(function(){if(ACTIVE())paint()},5000);')
js = re.sub(r"document\.addEventListener\('visibilitychange',function\(\)\{Flow\.pauseAll\(document\.hidden\);.*?else render\(\)\}\);", '', js, count=1, flags=re.S)
assert "else render()})" not in js
js = rep(js, "this.textContent='Анімація: '+(MOTION?'увімк':'вимк');render()", "this.textContent='Анімація: '+(MOTION?'увімк':'вимк');paint()")
js = rep(js, "document.querySelector('#carico .evport')", "ROOT.querySelector('#carico .evport')")
js = rep(js, "document.querySelectorAll('#scen button')", "ROOT.querySelectorAll('#scen button')")
js = rep(js, "document.documentElement.style.setProperty('--carc'", "HOST.style.setProperty('--carc'")
js = js.replace("var lab=document.querySelector('.lab')", "var lab=ROOT.querySelector('.lab')")
js = js.replace('document.hidden', '!ACTIVE()')
i = js.index('/* ---------- boot ---------- */'); js = js[:i]
assert 'render(' not in js.replace('paint(', ''), [m.start() for m in re.finditer(r'render\(', js)]
import importlib.util as _u
_sp=_u.spec_from_file_location('p41','/home/claude/ec/bo4_patch41.py');P41=_u.module_from_spec(_sp);_sp.loader.exec_module(P41)
css = P41.patch_css(css); html = P41.patch_html(html); js = P41.patch_js(js)
css = P41.patch_css2(css); html = P41.patch_html2(html); js = P41.patch_js2(js)
css = P41.patch_css3(css); html = P41.patch_html3(html); js = P41.patch_js3(js)
glue = open('/home/claude/ec/bo4_glue.js', encoding='utf-8').read()
core = ('/* ===== BLACKOUT 4.0 overview (engine + renderer from proto/overview-4.0-v5.html) ===== */\n(function(){\n'
        'var BO4_CSS=' + json.dumps(css, ensure_ascii=False) + ';\nvar BO4_HTML=' + json.dumps(html, ensure_ascii=False) + ';\n'
        + js + '\n' + glue + '\n})();\n')
core += '\n' + open('/home/claude/ec/inv.js', encoding='utf-8').read() + '\n'
core += '\n' + open('/home/claude/ec/aes.js', encoding='utf-8').read().replace("if(typeof module!=='undefined')module.exports=AES128;",'') + '\n' + open('/home/claude/ec/tuya.js', encoding='utf-8').read().split("if(typeof module!=='undefined')")[0] + '\nsetTimeout(function(){try{if(tyCfg().length)tyStart()}catch(e){}},2500);\n'
core += '\n' + open('/home/claude/ec/bo4_simplify.js', encoding='utf-8').read() + '\n'
core += '\n' + open('/home/claude/ec/regmap.js', encoding='utf-8').read() + '\n'
core += r"""
/* Tesla: start/stop charging (CarServer VehicleAction.chargingStartStopAction: start=2, stop=5; allowed for the Charging Manager role) */
async function tsCharge(start){if(!TS.on||TS.busy||TS.chgBusy)return;TS.chgBusy=1;TS.busy=1;try{BO4.sync()}catch(e){}
 try{var body=await tsCommand(3,pbB(2,pbB(6,pbB(start?2:5,[]))));var resp=pbD(body),as=pbSub(resp,1),res=as?(pb1(as,1)||0):0;
  if(res){var rr=pbSub(as,2),tx=rr&&pb1(rr,1),why='';try{why=tx?new TextDecoder().decode(Uint8Array.from(tx)):''}catch(e){}
   var M={is_charging:'вже заряджається',not_charging:'не заряджається',disconnected:'кабель не підключено',complete:'заряджання завершено',cable:'кабель не підключено'};var k=Object.keys(M).filter(function(x){return why.indexOf(x)>=0})[0];
   throw new Error(k?M[k]:(why||'авто відхилило команду'))}
  tsLog('CMD','charging '+(start?'start':'stop')+' ok');toast(start?'Tesla: заряджання запущено':'Tesla: заряджання зупинено')}
 catch(e){var m=String(e&&e.message||e);if(/timeout/.test(m))m='авто не відповідає — можливо, спить';tsLog('ERR','charge '+m);toast('Tesla: '+m)}
 TS.busy=0;TS.chgBusy=0;setTimeout(function(){tsRead()},2500);try{BO4.sync()}catch(e){}}

/* app hooks: station frames, link loss, every render */
(function(){var u=btUi;btUi=function(){var r=u.apply(this,arguments);try{BO4.frame()}catch(e){}return r}})();
(function(){var d=btDown;btDown=function(){var r=d.apply(this,arguments);try{BO4.lost()}catch(e){}return r}})();
(function(){var r=render;render=function(){try{document.body.classList.add('bo4')}catch(e){}r.apply(this,arguments);try{BO4.attach()}catch(e){console.error('BLACKOUT 4.0 overview',e)}}})();
"""
# ---------- the app ----------
t = app
# home: the 4.0 overview replaces the old hero, metrics and car card; everything else stays
i = t.rindex('function vPan(){'); j = t.index('\nfunction ', i + 10); src = t[i:j]
a = src.index("var h='<div class=\"ech\">"); b = src.index("';", a) + 2
src = src[:a] + "var h='<div id=\"bo4slot\"></div>';" + src[b:]
src = rep(src, 'h+=pbHero(lvl,g,sn,gS,sS,bS);h+=pbMetrics(lvl,sn);h+=schCard(lvl,sn);', 'h+=schCard(lvl,sn);')
# 4.0.6: the home screen keeps only the overview and the outage schedule; the rest moved to its tabs (bo4_simplify.js)
a2 = src.index('h+=schCard(lvl,sn);'); src = src[:a2] + 'h+=schCard(lvl,sn);return h}' + '\n'
x1 = src.index("var h='<div id=\"bo4slot\"></div>';") + len("var h='<div id=\"bo4slot\"></div>';"); x2 = src.index('h+=schCard(lvl,sn);return h}'); src = src[:x1] + src[x2:]
t = t[:i] + src + t[j:]
t = rep(t, "\ntry{render()}catch(e){window.__bootCheck", '\n' + core + "\ntry{render()}catch(e){window.__bootCheck")
t = rep(t, "function btgGroup(el){if(el.id==='tscard')return 'car';", "function btgGroup(el){if(el.id==='tscard')return 'car';if(el.id==='invcard')return 'inv';if(el.id==='tycard')return 'plug';if(el.id==='rmcard')return 'svc';")
t = rep(t, "['car',L3('Авто','Авто','Car')],['svc',", "['car',L3('Авто','Авто','Car')],['inv',L3('Инвертор','Інвертор','Inverter')],['plug',L3('Розетки','Розетки','Plugs')],['svc',")
t = rep(t, "if(p==='always')return true;return tab==='pan'||!!BT.on}", "if(p==='always')return true;if(tab==='pan'||tab==='bt'||!!BT.on||!!S.run)return true;try{if(TS.on||TS.connecting||(window.TY&&TY.busy)||(window.INV&&INV.on))return true}catch(e){}return false}")
t = rep(t, "L3('Пока открыт главный экран или подключена станция','Поки відкрито головний екран або підключено станцію','On main screen or while a station is connected')", "L3('Пока открыта Главная или Подключения, или есть активное подключение','Поки відкрито Головну чи Підключення, або є активне з’єднання','On Home or Connect, or while a device is connected')")
t = rep(t, "var CS=[", "var CS=[['Must HBP1800-3024OS',3072,2024],['Must HBP1800-2024OS',2560,2024],['Must HBP1800-1012 (100 А·год)',1280,2024],['Must HBP1800-1012 (75 А·год)',960,2024],['Must EM1024S',1280,2024],")
t = rep(t, "\ntry{render()}catch(e){window.__bootCheck", "\n(function(){var v=vBt;vBt=function(){return v.apply(this,arguments)+invCard()+tyCardHtml()+rmCardHtml()}})();\ntry{render()}catch(e){window.__bootCheck")
t = rep(t, "\ntry{render()}catch(e){window.__bootCheck", "\n" + open('/home/claude/ec/bo4_tabs.js', encoding='utf-8').read() + "\ntry{render()}catch(e){window.__bootCheck")
t = rep(t, "\ntry{render()}catch(e){window.__bootCheck", "\n" + open('/home/claude/ec/bo4_home.js', encoding='utf-8').read() + "\ntry{render()}catch(e){window.__bootCheck")
t = rep(t, "\ntry{render()}catch(e){window.__bootCheck", "\n" + open('/home/claude/ec/bo4_fuel.js', encoding='utf-8').read() + "\ntry{render()}catch(e){window.__bootCheck")
t = rep(t, "\ntry{render()}catch(e){window.__bootCheck", "\n" + open('/home/claude/ec/bo4_tesla.js', encoding='utf-8').read() + "\ntry{render()}catch(e){window.__bootCheck")
t = rep(t, "vh=tr((tab=='pan'||tab=='bt'?'':heroH(tab))+({pan:vPan,gen:vGen,st:vSt,hist:vHist,set:vSet,cat:vCat,bt:vBt}[tab])())", "vh=tr((tab=='pan'||tab=='bt'||tab=='car'?'':heroH(tab))+({pan:vPan,gen:vGen,st:vSt,car:vCar,hist:vHist,set:vSet,cat:vCat,bt:vBt}[tab])())")
t = rep(t, "T=['gen','st','pan','hist','bt'],L={gen:[svgi('gen'),'Генератор'],st:[svgi('bat'),'Станции'],pan:[svgi('bolt',30),'Панель'],hist:[svgi('hist'),'История'],bt:[svgi('bt'),'Bluetooth']};",
 "T=['hist','pan','cfg'],L={cfg:[svgi('set'),L3('Настройки','Налаштування','Settings')],pan:[svgi('home'),L3('Главная','Головна','Home')],hist:[svgi('hist'),'История']};")
t = rep(t, "return '<button class=\"'+(k=='pan'?'cn ':'')+(k=='pan'&&S.run?'run ':'')+(k==tab?'on':'')+'\"", "return '<button class=\"'+(k=='pan'?'cn ':'')+(k=='pan'&&S.run?'run ':'')+(k==tab||(k=='cfg'&&boInCfg(tab))?'on':'')+'\"")
_pill = r"""'<div class="pill'+(S.run?' on':'')+'" style="margin-top:10px;cursor:pointer" onclick="setTab(\'pan\')"><i></i>'+(S.run?'Работает сейчас · управление на Панели':'Выключен · запуск на Панели')+'</div>"""
t = rep(t, _pill, "'")
# 4.0 palette for the other screens: colour tokens only, scoped to this test build (body.bo4)
pal_inv = ('#invcard .invf{display:grid;grid-template-columns:1fr 96px;gap:10px;margin-bottom:8px}#invcard .invf label{font-size:12px;color:var(--t2,#A0ADA4)}#invcard .invf input{width:100%;margin-top:4px;box-sizing:border-box}'
           '#invcard .invg{display:grid;grid-template-columns:1fr 1fr;gap:8px;transition:opacity .3s}#invcard .invg.old{opacity:.45}'
           '#invcard .invc{background:var(--elev,#1B241F);border:1px solid var(--bd,#29342E);border-radius:12px;padding:10px 12px;min-width:0}#invcard .invc b{display:block;font-size:20px;margin:2px 0;font-variant-numeric:tabular-nums}#invcard select{width:100%}'
           '.ctl .ctlh{display:flex;align-items:center;justify-content:space-between;gap:14px}.ctl .ctln{font-size:17px;font-weight:600;margin-bottom:3px}'
           '.ctl .ctlh>div{flex:1;min-width:0}.ctl .ctlb{flex:0 0 auto;width:auto!important;padding:0 22px!important;margin:0!important;min-width:118px;height:46px;border-radius:23px;font-size:15px;font-weight:700}.ctl .ctlb.stop{background:transparent!important;border:1.5px solid var(--warn,#EFB34F)!important;color:var(--warn,#EFB34F)!important;box-shadow:none!important}'
           '.ctl.on{border-color:rgba(168,217,87,.35)}'
           '#tycard .typ{border:1px solid var(--bd,#29342E);border-radius:14px;padding:10px 12px;margin:8px 0}#tycard .typh{display:flex;align-items:center;gap:10px}#tycard .tyname{flex:1;min-width:0;background:transparent!important;border:0!important;font-size:16px;font-weight:600;color:inherit;padding:0!important;box-shadow:none!important}#tycard .tyst{font-size:12.5px;margin:4px 0 6px}#tycard label{display:block;margin-top:6px}#tycard input,#tycard select{width:100%;box-sizing:border-box}'
           '#tycard .act.tg{position:relative;flex:0 0 auto;width:50px!important;height:28px;padding:0!important;margin:0!important;border-radius:14px;border:1px solid var(--bd,#29342E);background:var(--elev,#1B241F)!important;box-shadow:none!important}#tycard .act.tg i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#65736A;transition:transform .25s,background .25s}#tycard .act.tg.on{background:#A8D957!important;border-color:#A8D957}#tycard .act.tg.on i{transform:translateX(22px);background:#0B1405}#tycard .act.tg[disabled]{opacity:.45}')
pal = ('body.bo4:not(.pbl){--bg:#090D0B;--bg2:#101613;--card:#151C18;--surf:#151C18;--elev:#1B241F;--bd:#29342E;'
       '--t1:#F1F5F2;--t2:#A0ADA4;--t3:#65736A;--tx:#F1F5F2;--mut:#A0ADA4;--em:#A8D957;--ac:#A8D957;--ok:#A8D957;--cy:#8FC24A;--bl:#48B9E8;'
       '--lg1:#A8D957;--lg2:#8FC24A;--emrgb:168,217,87;--em2:#C7E89A;--warn:#EFB34F;--bad:#EF665B;--off:#65736A;--on-em:#0B1405;--glow:rgba(168,217,87,.28);'
       'background:#090D0B!important;background-image:radial-gradient(120% 55% at 50% 0%,#101613 0%,#090D0B 70%)!important}\n')
pal_inv += '.bo-goto{font-size:12.5px;margin:-4px 6px 12px}.bo-goto a{color:var(--ac)}#tscard .bo-goto{margin:10px 0 0}#carbig{text-align:center}#carbig .bo-cpct{font-size:54px;font-weight:700;letter-spacing:-.02em;line-height:1.05}#carbig .bo-cpct small{font-size:24px;opacity:.6;margin-left:2px}#carbig .row{margin-top:12px}#outcard .bo-w{opacity:.7;margin-left:6px}#nb button{min-width:0;white-space:nowrap;overflow:hidden}#nb button.cn{overflow:visible!important;flex:0 0 72px!important;height:72px!important;margin:-28px 10px 4px!important}#nb button.cn i svg{width:32px!important;height:32px!important}nav{background:color-mix(in srgb,var(--card,#141a17) 94%,transparent)!important}#gear{display:none!important}.tsw{font-size:16px;line-height:1.45}.tsw h3{font-size:22px;margin:6px 0 10px;line-height:1.2}.tsw p{margin:0 0 10px}.tsw ul,.tsw ol{margin:0 0 12px;padding-left:22px}.tsw li{margin:0 0 6px}.tsw-steps{display:flex;gap:6px;margin:0 0 14px}.tsw-steps div{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11.5px;color:var(--t3,#65736A)}.tsw-steps i{font-style:normal;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid var(--bd,#2c3a31)}.tsw-steps .on{color:var(--fg,#F1F5F2)}.tsw-steps .on i{border-color:#A8D957;color:#A8D957}.tsw-steps .done i{background:#A8D957;border-color:#A8D957;color:#0b0f0d}.tsw-vin{width:100%;box-sizing:border-box;font:600 22px/1.2 ui-monospace,monospace!important;letter-spacing:.12em;text-transform:uppercase;padding:14px 12px!important;text-align:center}.tsw-row{display:flex;justify-content:flex-end;margin:4px 2px}.tsw-warn{color:#EFB34F;font-size:14px;min-height:0;margin:2px 0 6px}.tsw-err{background:rgba(239,102,91,.12);border:1px solid rgba(239,102,91,.4);color:#ffb3ab;border-radius:12px;padding:10px 12px;margin:6px 0 12px;font-size:15px}.tsw-big{width:100%!important;font-size:18px!important;padding:16px!important;margin-top:6px!important;border-radius:16px!important}.tsw-sm{width:100%!important;margin-top:8px!important}.tsw-vinl{margin-top:14px;font-size:13px;color:var(--t2,#8b978f)}.tsw-vinl a{color:#A8D957;margin-left:6px}.tsw-check{list-style:none;padding:0!important}.tsw-check li{padding:10px 12px 10px 40px;border-radius:12px;background:rgba(255,255,255,.04);position:relative}.tsw-check li:before{content:'';position:absolute;left:14px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;border:2px solid #A8D957}.tsw-spin{display:flex;justify-content:center;margin:14px 0}.tsw-spin i{width:54px;height:54px;border-radius:50%;border:5px solid rgba(168,217,87,.2);border-top-color:#A8D957;animation:tswr 1s linear infinite}@keyframes tswr{to{transform:rotate(360deg)}}.tsw-c{text-align:center}.tsw-card{display:flex;align-items:center;justify-content:space-around;margin:4px 0 12px}.tsw-kc{animation:tswk 2s ease-in-out infinite}@keyframes tswk{0%,100%{transform:translateY(-6px)}50%{transform:translateY(16px)}}.tsw-pulse{animation:tswp 2s ease-in-out infinite}@keyframes tswp{0%,40%{opacity:0}60%,100%{opacity:1}}.tsw-cdw{position:relative;width:64px;height:64px}.tsw-cdw b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:15px}.tz{padding:20px 18px 22px}.tz-dots{display:flex;gap:6px;margin-bottom:12px}.tz-dots i{flex:1;height:5px;border-radius:3px;background:var(--bd,#26302a)}.tz-dots i.done{background:#5f8a34}.tz-dots i.on{background:var(--ac,#A8D957)}.tz-k{font-size:13px;color:var(--t2,#8b978f);margin-bottom:2px}.tz-h{font-size:22px!important;line-height:1.25;margin:0 0 12px!important;letter-spacing:0!important;text-transform:none!important;color:var(--t1,#F1F5F2)!important;font-weight:700}.tz-h::before{display:none!important}.tz-p{font-size:16px;line-height:1.5;margin:0 0 12px}.tz-l,.tz-c{margin:0 0 14px;padding-left:20px;font-size:15.5px;line-height:1.55}.tz-c{list-style:none;padding:0}.tz-c li{position:relative;padding:8px 0 8px 34px;border-bottom:1px solid var(--bd,#222c26)}.tz-o{position:absolute;left:4px;top:10px;width:18px;height:18px;border-radius:50%;border:2px solid var(--ac,#A8D957);box-sizing:border-box}.tz-vin{width:100%;box-sizing:border-box;font:600 22px/1.2 ui-monospace,Menlo,monospace!important;letter-spacing:.08em;text-transform:uppercase;padding:14px!important;text-align:center}.tz-cnt{text-align:right;font-size:13px;color:var(--t2,#8b978f);margin:4px 2px}.tz-warn{color:#EFB34F;font-size:14px;min-height:2px;margin:2px 0 6px}.tz-b{width:100%!important;font-size:18px!important;font-weight:700;padding:16px!important;border-radius:16px!important;margin-top:10px}.tz-mut{font-size:13.5px;color:var(--t2,#8b978f);margin-top:10px;line-height:1.45}.tz-e{margin-top:12px;padding:12px 14px;border-radius:12px;background:rgba(239,102,91,.12);color:#ffb1a8;font-size:15px;line-height:1.45}.tz-l2{width:100%!important;margin-top:12px;font-size:14px}.tz-ok{color:var(--ac,#A8D957);font-weight:600;font-size:16px;margin-bottom:10px}.tz-art{display:block;width:100%;max-width:300px;margin:4px auto 10px}.tz-card{animation:tzc 2.4s ease-in-out infinite}@keyframes tzc{0%,100%{transform:translateY(0)}50%{transform:translateY(22px)}}.tz-cd{text-align:center;margin-top:6px}.tz-cd b{display:block;font-size:44px;line-height:1;color:var(--ac,#A8D957)}.tz-cd span{font-size:13px;color:var(--t2,#8b978f)}.tz-done{text-align:center;padding:10px 0}.tz-big{width:72px;height:72px;margin:0 auto 12px;border-radius:50%;background:var(--ac,#A8D957);color:#0b0f0d;font-size:40px;line-height:72px;font-weight:700}.bo-gh{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--t2,#8b978f);margin:18px 6px 8px}#bodev .bo-gh{margin-top:6px}.bo-sh{margin-bottom:10px}.bocfg{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 12px;padding:2px 16px 4px;position:sticky;top:0;z-index:5;background:linear-gradient(var(--bg,#0b0f0d) 80%,transparent)}.bocfg::-webkit-scrollbar{display:none}.bocfg button{flex:0 0 auto;width:auto!important;margin:0;padding:8px 14px;border-radius:999px;font-size:13.5px;background:var(--card,#141a17)!important;color:var(--t2,#A0ADA4);border:1px solid var(--bd,#222c26);box-shadow:none!important}.bocfg button.on{background:var(--ac,#A8D957)!important;color:#0b0f0d;border-color:transparent;font-weight:600}#bosh-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .25s;z-index:60}body.bosh-open #bosh-bg{opacity:1;pointer-events:auto}body.bosh-open{overflow:hidden}#bosheet{position:fixed;left:0;right:0;bottom:0;max-height:88vh;z-index:61;background:var(--bg2,#101512);border-radius:22px 22px 0 0;border-top:1px solid var(--bd,#222c26);box-shadow:0 -12px 40px rgba(0,0,0,.5);transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,0px)}#bosheet.open{transform:none}#bosheet .grab{padding:10px 0 4px;display:flex;justify-content:center;cursor:grab}#bosheet .grab i{width:42px;height:5px;border-radius:3px;background:var(--bd,#2c3a31)}#bosheet .shx{position:absolute;top:8px;right:12px;width:34px!important;height:34px;padding:0;margin:0;border-radius:50%;font-size:20px;line-height:1;background:var(--card,#141a17)!important;color:var(--t2,#A0ADA4);box-shadow:none!important}#bosh-c{overflow-y:auto;padding:4px 16px 20px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}#bosh-c .shh{font-size:20px;margin:2px 0 12px;padding-right:40px}#bosh-c .hero{margin-top:0}#bosh-c .bo-more{width:100%;margin-top:6px}#bo4host>.card.sch{margin:6px 0 14px}.fuelbar{height:8px!important;min-height:8px;padding:0!important;border-radius:4px;background:var(--bd,#222c26);overflow:hidden;margin:2px 0 8px}.fuelbar i{display:block;height:8px;border-radius:4px;background:linear-gradient(90deg,#F0A542,#F3BA70)}'
pal_inv += '#rmcard .rmg{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:4px;margin-top:6px;font:11px ui-monospace,monospace}#rmcard .rmg span{background:rgba(255,255,255,.04);border-radius:6px;padding:3px 5px;white-space:nowrap;overflow:hidden}#rmcard .rmg i{opacity:.5;font-style:normal;margin-right:4px}#rmcard .rmg .hot{background:rgba(155,214,90,.35)}#rmcard .rmg .warm{background:rgba(239,179,79,.18)}#rmcard button.sm{width:auto!important}#rmcard input{font-size:14px!important}'
k = t.rindex('</style>', 0, t.index('</head>')); t = t[:k] + pal + pal_inv + t[k:]
REL = '--release' in sys.argv
NAME = 'BLACKOUT 4.0' if REL else 'BLACKOUT 4.0 test'
t = rep(t, 'BLACKOUT 3.4.2', NAME, t.count('BLACKOUT 3.4.2'))
t = re.sub(r'<title>[^<]*</title>', '<title>' + NAME + '</title>', t, count=1)
out = sys.argv[sys.argv.index('--release') + 1] if REL else REPO + '/proto/overview-4.0-full.html'
open(out, 'w', encoding='utf-8').write(t)
open('/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/p4/full.js', 'w').write(re.findall(r'<script[^>]*>(.*?)</script>', t, re.S)[-1])
print('ok', out, len(t))
