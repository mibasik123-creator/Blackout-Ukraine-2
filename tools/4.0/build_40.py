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
glue = open('/home/claude/ec/bo4_glue.js', encoding='utf-8').read()
core = ('/* ===== BLACKOUT 4.0 overview (engine + renderer from proto/overview-4.0-v5.html) ===== */\n(function(){\n'
        'var BO4_CSS=' + json.dumps(css, ensure_ascii=False) + ';\nvar BO4_HTML=' + json.dumps(html, ensure_ascii=False) + ';\n'
        + js + '\n' + glue + '\n})();\n')
core += r"""
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
t = t[:i] + src + t[j:]
t = rep(t, "\ntry{render()}catch(e){window.__bootCheck", '\n' + core + "\ntry{render()}catch(e){window.__bootCheck")
# 4.0 palette for the other screens: colour tokens only, scoped to this test build (body.bo4)
pal = ('body.bo4:not(.pbl){--bg:#090D0B;--bg2:#101613;--card:#151C18;--surf:#151C18;--elev:#1B241F;--bd:#29342E;'
       '--t1:#F1F5F2;--t2:#A0ADA4;--t3:#65736A;--tx:#F1F5F2;--mut:#A0ADA4;--em:#A8D957;--ac:#A8D957;--ok:#A8D957;--cy:#8FC24A;--bl:#48B9E8;'
       '--lg1:#A8D957;--lg2:#8FC24A;--emrgb:168,217,87;--em2:#C7E89A;--warn:#EFB34F;--bad:#EF665B;--off:#65736A;--on-em:#0B1405;--glow:rgba(168,217,87,.28);'
       'background:#090D0B!important;background-image:radial-gradient(120% 55% at 50% 0%,#101613 0%,#090D0B 70%)!important}\n')
k = t.rindex('</style>', 0, t.index('</head>')); t = t[:k] + pal + t[k:]
REL = '--release' in sys.argv
NAME = 'BLACKOUT 4.0' if REL else 'BLACKOUT 4.0 test'
t = rep(t, 'BLACKOUT 3.4.2', NAME, t.count('BLACKOUT 3.4.2'))
t = re.sub(r'<title>[^<]*</title>', '<title>' + NAME + '</title>', t, count=1)
out = sys.argv[sys.argv.index('--release') + 1] if REL else REPO + '/proto/overview-4.0-full.html'
open(out, 'w', encoding='utf-8').write(t)
open('/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/p4/full.js', 'w').write(re.findall(r'<script[^>]*>(.*?)</script>', t, re.S)[-1])
print('ok', out, len(t))
