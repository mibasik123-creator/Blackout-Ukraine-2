"""4.0.1 changes on top of the v5 overview (applied by build_40.py):
- no extra captions in the scene (flow 'немає даних', car caption, empty dashes)
- energy keeps moving whenever a confirmed source feeds something, even if its watts are unknown
- longer, smoother pulses and slower speed easing
- open-frame generator drawing; fuel drains while it runs, fuel line and exhaust animate
- action buttons on device rows; scene objects are tappable"""
import re

def rep(s, a, b, n=1):
    assert s.count(a) == n, (s.count(a), a[:100])
    return s.replace(a, b)

# generator, local box ≈ x -6..62, y 0..46 (labels stay at y 60/74/87)
TANK = 'M8 15.5C8 8 11 5 17 5H41C48 5 51 8 51 15.5Z'
GEN = ('<g class="gbody">'
       '<ellipse cx="29" cy="47" rx="32" ry="3.6" fill="#000" opacity=".5"/>'
       # tubular open frame + feet
       '<path d="M3 44V12C3 7 6 4 11 4M55 44V12C55 7 52 4 47 4M3 44H55M3 25H8M50 25H55" fill="none" stroke="#4A5650" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
       '<rect x="1" y="43" width="7" height="3" rx="1.2" fill="#202923"/><rect x="50" y="43" width="7" height="3" rx="1.2" fill="#202923"/>'
       # fuel tank (fill = real fuel level), cap
       '<path d="' + TANK + '" fill="#1B241F" stroke="#3A463F" stroke-width="1"/>'
       '<g clip-path="url(#genTank)"><g transform="translate(0 5) scale(1 .5)"><rect id="genfuel" x="8" y="22" width="43" height="22" fill="var(--gen)" opacity=".9"/></g></g>'
       '<path d="M12 8.5C14 7 16 6.6 19 6.6H39" stroke="#fff" stroke-opacity=".12" stroke-width="1" fill="none" stroke-linecap="round"/>'
       '<rect x="35" y="2" width="8" height="3.4" rx="1.4" fill="#29342E" stroke="#4A5650" stroke-width=".7"/>'
       # fuel line tank -> carburettor
       '<path class="fline" d="M16 15.5V19.5H13" fill="none" stroke="var(--gen)" stroke-width="1.3" stroke-linecap="round"/>'
       # engine with cooling fins + recoil starter
       '<rect x="9" y="19" width="20" height="21" rx="2.4" fill="url(#genB)" stroke="#29342E" stroke-width=".8"/>'
       '<path d="M12 23h14M12 26.5h14M12 30h14M12 33.5h14" stroke="#101613" stroke-width="1.3" stroke-linecap="round"/>'
       '<circle cx="9" cy="31" r="5.2" fill="#151C18" stroke="#3A463F" stroke-width="1"/><circle cx="9" cy="31" r="1.7" fill="#3A463F"/>'
       # alternator + control panel with sockets
       '<rect x="31" y="19" width="20" height="21" rx="3.4" fill="#202923" stroke="#29342E" stroke-width=".8"/>'
       '<rect x="34" y="22" width="14" height="15" rx="1.6" fill="#101613" stroke="#3A463F" stroke-width=".6"/>'
       '<circle cx="38" cy="27" r="2.3" fill="#151C18" stroke="#4A5650" stroke-width=".6"/><circle cx="44.4" cy="27" r="2.3" fill="#151C18" stroke="#4A5650" stroke-width=".6"/>'
       '<rect x="36" y="32.4" width="4" height="2.4" rx=".6" fill="#29342E"/><circle class="gled" cx="45" cy="33.6" r="1.1" fill="#3A463F"/>'
       # muffler
       '<rect x="49" y="12" width="7" height="5" rx="1.6" fill="#29342E" stroke="#3A463F" stroke-width=".6"/>'
       '</g>'
       '<circle class="smk" cx="58" cy="12" r="2.4" fill="#A0ADA4"/><circle class="smk b" cx="58" cy="12" r="2.4" fill="#A0ADA4"/>')
GEN_ICON = ('<svg viewBox="-2 0 62 48"><path d="M3 44V12C3 7 6 4 11 4M55 44V12C55 7 52 4 47 4M3 44H55" fill="none" stroke="#4A5650" stroke-width="2.6" stroke-linecap="round"/>'
            '<path d="' + TANK + '" fill="#1B241F" stroke="#3A463F"/>'
            '<g clip-path="url(#genTank)"><g transform="translate(0 -2) scale(1 .5)"><rect id="gfuel2" x="8" y="25" width="43" height="11" fill="#F0A542" opacity=".9"/></g></g>'
            '<rect x="9" y="19" width="20" height="21" rx="2.4" fill="#202923"/><path d="M12 24h14M12 28.5h14M12 33h14" stroke="#101613" stroke-width="1.6"/>'
            '<circle cx="9" cy="31" r="5" fill="#151C18" stroke="#3A463F"/><rect x="31" y="19" width="20" height="21" rx="3.4" fill="#202923"/>'
            '<circle cx="38" cy="27" r="2.3" fill="#101613" stroke="#4A5650" stroke-width=".7"/><circle cx="44.4" cy="27" r="2.3" fill="#101613" stroke="#4A5650" stroke-width=".7"/></svg>')

CSS = (
 '.lp{stroke-dasharray:5 10.5!important;stroke-width:2!important}'
 '#n-gen,#n-st,#carico{cursor:pointer}'
 '#n-gen .smk{opacity:0;transform-box:fill-box;transform-origin:center}'
 '#n-gen.run .smk{animation:bo-smoke 2.6s ease-out infinite}#n-gen.run .smk.b{animation-delay:1.3s}'
 '@keyframes bo-smoke{0%{opacity:0;transform:translate(0,0) scale(.5)}25%{opacity:.32}100%{opacity:0;transform:translate(5px,-16px) scale(1.9)}}'
 '#n-gen .fline{stroke-dasharray:2 2.6;opacity:.25}'
 '#n-gen.run .fline{opacity:1;animation:bo-fuel .7s linear infinite}@keyframes bo-fuel{to{stroke-dashoffset:-4.6}}'
 '#n-gen.run .gbody{animation:bo-vib .11s linear infinite}@keyframes bo-vib{50%{transform:translate(.3px,-.25px)}}'
 '#n-gen.run .gled{fill:var(--st)}'
 '#genfuel,#gfuel2{transition:y 2s linear,height 2s linear}'
 '.row .act{flex:0 0 auto;height:32px;padding:0 13px;border-radius:16px;border:1px solid var(--b1);background:var(--s2);color:var(--t1);font:600 12.5px/1 inherit;letter-spacing:.01em;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .2s,border-color .2s,color .2s,transform .12s}'
 '.row .act:active{transform:scale(.95)}.row .act[disabled]{opacity:.5}'
 '.row .act.gen{border-color:rgba(240,165,66,.55);color:var(--gen-v)}.row .act.go{border-color:rgba(168,217,87,.5);color:var(--st)}'
 '.row .act[hidden]{display:none}'
 '.row .act.tg{position:relative;width:50px;height:28px;padding:0;border-radius:14px;background:var(--s2);margin-bottom:12px}'
 '.row .act.tg i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--t3);transition:transform .25s var(--ease),background .25s}'
 '.row .act.tg.on i{transform:translateX(22px);background:#0B1405}'
 '.row .act.tg.on.st{background:var(--st);border-color:var(--st)}.row .act.tg.on.gen{background:var(--gen);border-color:var(--gen)}'
 '.row .act.tg::after{content:attr(data-l);position:absolute;left:50%;top:31px;transform:translateX(-50%);font-size:9.5px;font-weight:500;color:var(--t3);white-space:nowrap;letter-spacing:.02em}'
 '.row b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 '@media (max-width:400px){.row{gap:10px}.row .ic{flex-basis:46px}.row .ic svg{max-width:46px}.row .act{padding:0 10px;font-size:12px}.row .v{min-width:44px;font-size:16.5px}}'
 '@media (prefers-reduced-motion:reduce){#n-gen .smk,#n-gen .fline,#n-gen .gbody{animation:none!important}}'
)

def patch_css(css):
    css = rep(css, '.row .v{font-size:18px;font-weight:600;text-align:right;min-width:62px}', '.row .v{font-size:18px;font-weight:600;text-align:right;min-width:52px}')
    return css + CSS

def patch_html(html):
    a = html.index('<g class="node" id="n-gen" transform="translate(38 18)">')
    b = html.index('<text x="27" y="60" text-anchor="middle" class="nm">ГЕНЕРАТОР</text>', a)
    html = html[:a] + '<g class="node" id="n-gen" transform="translate(36 16)">' + GEN + html[b:]
    html = rep(html, '<clipPath id="tankClip"><rect x="0" y="0" width="7" height="22" rx="2"/></clipPath>',
               '<clipPath id="tankClip"><rect x="0" y="0" width="7" height="22" rx="2"/></clipPath><clipPath id="genTank"><path d="' + TANK + '"/></clipPath>')
    a = html.index('<div class="row" id="gcard"><div class="ic">'); b = html.index('</div>', a + 40)
    html = html[:a] + '<div class="row" id="gcard"><div class="ic">' + GEN_ICON + html[b:]
    html = rep(html, '<text x="61" y="67" text-anchor="middle" class="val" id="carlbl" style="fill:var(--t3)">Tesla</text>', '')
    # row action buttons (state set by the app adapter)
    html = rep(html, '<span id="dpct">—</span><small>%</small></div></div>', '<span id="dpct">—</span><small>%</small></div><button class="act go" id="dact" hidden></button></div>')
    html = rep(html, '<span id="gpct">—</span><small>% бак</small></div></div>', '<span id="gpct">—</span><small>%</small></div><button class="act" id="gact" hidden></button></div>')
    html = rep(html, '<span id="cpct">—</span><small>%</small></div></div>', '<span id="cpct">—</span><small>%</small></div><button class="act go" id="cact" hidden></button></div>')
    return html

def patch_js(js):
    # flows: no 'немає даних' captions; supply (source confirmed, watts unknown) still moves
    js = rep(js, "var w=f.w,on=f.state==='on'&&w>BO_MIN_FLOW_W,k=Math.min(1,.2+Math.log10(Math.max(w||1,1))/4.2);",
             "var w=f.w,on=f.state==='on'&&w>BO_MIN_FLOW_W,sup=f.state==='supply',k=Math.min(1,.2+Math.log10(Math.max(w||1,1))/4.2);")
    js = rep(js, "l.el.style.opacity=on?.95:0;l.core.style.opacity=on?(.4+.55*k):(f.state==='supply'?.35:0);l.gl.style.opacity=on?(.4+.6*k):0;",
             "l.el.style.opacity=on?.95:sup?.75:0;l.core.style.opacity=on?(.4+.55*k):(sup?.5:0);l.gl.style.opacity=on?(.4+.6*k):(sup?.35:0);")
    js = rep(js, "if(l.tx){l.tx.textContent=f.state==='stale'?'немає даних':on?fmtW(w):'';l.tx.style.opacity=f.state==='stale'?.55:1}",
             "if(l.tx){l.tx.textContent=on?fmtW(w):''}")
    js = rep(js, "this.tween(l,on&&MOTION?this.rateFor(w):0)}", "this.tween(l,MOTION?(on?this.rateFor(w):sup?.85:0):0)}")
    js = rep(js, "t0=performance.now(),D=700;", "t0=performance.now(),D=1200;")
    # scene captions: nothing instead of dashes; car caption removed
    js = rep(js, "txt('genv',g.state!=='ONLINE'?'—':", "txt('genv',g.state!=='ONLINE'?'':")
    js = rep(js, "?'вимкн.':'—');", "?'вимкн.':'');")
    js = rep(js, "txt('gridv',gr.state!=='ONLINE'?'—':", "txt('gridv',gr.state!=='ONLINE'?'':")
    js = rep(js, "gr.on===false?'немає':'—');", "gr.on===false?'немає':'');")
    js = re.sub(r" txt\('carlbl',[^;]*\);", '', js, count=1)
    js = rep(js, "g.on?'працює · '+(g.load!=null?fmtW(g.load):'потужність невідома'):'вимкнено'", "g.on?(g.load!=null?'працює · '+fmtW(g.load):'працює'):'вимкнено'")
    # fuel shown with a decimal while the generator runs, so the draining is visible
    js = rep(js, "txt('genfuelv','бак '+Math.round(g.fuel)+'%');txt('gpct',String(Math.round(g.fuel)))",
             "var fv=g.on?(Math.round(g.fuel*10)/10).toFixed(1).replace('.',','):String(Math.round(g.fuel));txt('genfuelv','бак '+fv+'%');txt('gpct',fv)")
    return js

# ---------------- 4.0.2: hero = what powers the house; scene proportions ----------------
HERO_CSS = (
 '.charge[data-src=gen] .fg,.charge[data-src=gen] .gl{stroke:var(--gen)}.charge[data-src=gen] .state span{color:var(--gen-v)}.charge[data-src=gen] .pct{font-size:46px;letter-spacing:-1.5px}'
 '.charge[data-src=grid] .fg,.charge[data-src=grid] .gl{stroke:var(--grid)}.charge[data-src=grid] .state span{color:var(--grid-v)}'
 '.charge.assumed .fg{opacity:.5}.charge.assumed .gl{opacity:.04}'
 '.charge[data-src=conflict] .fg,.charge[data-src=conflict] .gl{stroke:var(--err)}.charge[data-src=conflict] .state span{color:var(--err)}'
 '.charge[data-src=none] .state span{color:var(--t2)}'
 '.ring .c svg.hico{width:62px;height:80px;color:var(--grid-v);display:block;transform:none}'
 '.hico{width:44px;height:56px;color:var(--grid-v);display:block}.charge[data-src=none] .hico{color:var(--t3)}.charge[data-src=conflict] .hico{color:var(--err)}'
 '.hsrc{font-weight:500;color:var(--t1)}.eta b{font-weight:600;color:var(--grid-v)}'
)
PYLON = ('<svg id="hico" class="hico" viewBox="0 0 44 56" style="display:none"><path d="M22 2 13 54M22 2l9 52M10 12h24M12 22h20M15 36h14M14 22l15 14M30 22 15 36M16 36l13 18M28 36 16 54" '
         'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>')
HERO_JS = r"""
/* hero ring = the source that powers the house. Default is the grid: the house is on the grid unless
   the generator runs, the station is measured feeding it, or the grid is confirmed off. */
function heroSrc(R){var f=R.feed,src=f==='gen'?'gen':f==='station'?'station':f==='conflict'?'conflict':f==='none'?'none':'grid';
 var hw=$('heroWrap');if(hw&&hw.getAttribute('data-src')!==src)hw.setAttribute('data-src',src);
 var ico=$('hico'),pc=$('pctw');function show(icon){if(ico)ico.style.display=icon?'':'none';if(pc)pc.style.display=icon?'none':''}
 cls('heroWrap','assumed',false);
 if(src==='station'){show(false);txt('hsrc','Станція');txt('hdev',(typeof BO4_STN!=='undefined'&&BO4_STN)||'Станція');return src}
 cls('heroWrap','stale',false);
 if(src==='gen'){var g=R.gen,fu=g.fuel;show(false);
  if(fu!=null){txt('pct',fu>=99.95?'100':(Math.round(fu*10)/10).toFixed(1).replace('.',','));setArc(fu)}else{txt('pct','—');setArc(null)}
  txt('hdev','бак');txt('hsrc',(typeof BO4_GEN!=='undefined'&&BO4_GEN)||'Генератор');txt('mode',g.load!=null?'живить будинок · '+fmtW(g.load):'живить будинок');
  var h=null;try{var gg=S.gens[S.g];if(gg&&gg.lph>0&&S.fills.length)h=fuelLeft(gg)/gg.lph}catch(e){}
  txt('eta',h!=null?'палива приблизно на '+Math.floor(h)+' год '+Math.round((h%1)*60)+' хв':'');return src}
 show(true);setArc(src==='none'?null:100);var eta=$('eta');
 if(src==='grid'){var conf=f==='grid';cls('heroWrap','assumed',!conf);txt('hdev','');txt('hsrc','Мережа');txt('mode',conf?'живить будинок':'основне живлення');
  var gt='';if(conf){try{gt=pbGridTxt().replace(/^[^<]+/,'')}catch(e){}}if(eta&&eta.innerHTML!==gt)eta.innerHTML=gt;return src}
 if(eta)eta.textContent='';
 if(src==='none'){txt('hdev','');txt('hsrc','Мережа');txt('mode','немає живлення');return src}
 txt('hdev','');txt('hsrc','Конфлікт джерел');txt('mode','генератор і мережа одночасно');return src}
"""
NEW_LINKS = """var LINKS=[
 {id:'genhome',cls:'gen',d:'M80 110 C90 113 97 119 101 127',lx:104,ly:112,a:'start'},
 {id:'genst',cls:'gen',d:'M54 112 C42 138 40 168 46 194',lx:36,ly:156,a:'end'},
 {id:'gridhome',cls:'grid',d:'M284 98 C280 108 276 118 271 128',lx:290,ly:122,a:'start'},
 {id:'gridst',cls:'grid',d:'M294 100 C286 112 276 124 268 136 M98 184 C93 188 88 192 84 197',lx:92,ly:178,a:'end'},
 {id:'use',cls:'st',d:'M84 214 C91 210 96 204 99 196',lx:104,ly:222,a:'start'},
 {id:'gridcar',cls:'grid',d:'M306 100 C322 130 318 166 300 194',lx:322,ly:150,a:'end'}];"""

def patch_css2(css):
    return css + HERO_CSS

def patch_html2(html):
    html = rep(html, '<div class="pct num"><span id="pct">', PYLON + '<div class="pct num" id="pctw"><span id="pct">')
    html = rep(html, '<div class="dev" id="stname">Станція</div>', '<div class="dev" id="hdev"></div>')
    html = rep(html, '<div class="state">Станція · <span id="mode">', '<div class="state"><b class="hsrc" id="hsrc">Мережа</b> · <span id="mode">')
    html = rep(html, '<g transform="translate(116 96)">', '<g transform="translate(100 74) scale(1.28)">')
    html = rep(html, '<g transform="translate(28 182)" id="n-st">', '<g transform="translate(22 197) scale(.72)" id="n-st">')
    html = rep(html, '<g id="carico" transform="translate(236 192)">', '<g id="carico" transform="translate(206 184) scale(1.25)">')
    html = rep(html, '<text x="61" y="55" text-anchor="middle" class="sv" id="carpct">', '<text x="61" y="54" text-anchor="middle" class="sv" id="carpct" style="font-size:10.5px">')
    html = rep(html, '<ellipse cx="72" cy="232" rx="70" ry="16" fill="url(#stpool)"', '<ellipse cx="54" cy="236" rx="50" ry="12" fill="url(#stpool)"')
    return html

def patch_js2(js):
    a = js.index('var LINKS=['); b = js.index('];', a) + 2
    js = js[:a] + NEW_LINKS + js[b:]
    # station hero block runs only when the station is the house's source
    s0 = " cls('heroWrap','stale',!stOn);cls('met','stale',!stOn);\n"
    i = js.index(s0); j = js.index(" num('vin',st.inW);", i)
    block = js[i + len(s0):j]
    js = js[:i] + " cls('met','stale',!stOn);\n if(heroSrc(R)==='station'){cls('heroWrap','stale',!stOn);\n" + block + " }\n" + js[j:]
    js = rep(js, 'var LAST=null;', HERO_JS + 'var LAST=null;')
    # house on the grid by default -> energy visibly flows from the grid
    js = rep(js, " for(var k in R.flows)Flow.set(k,R.flows[k]);", " for(var k in R.flows)Flow.set(k,R.flows[k]);if(R.feed==='unknown'&&R.flows.gridhome.state!=='conflict')Flow.set('gridhome',{state:'supply',w:null});")
    js = rep(js, "var lit=R.feed==='gen'||R.feed==='grid'||", "var lit=R.feed==='gen'||R.feed==='grid'||R.feed==='unknown'||")
    js = rep(js, "cls('n-grid','off',!(gr.state==='ONLINE'&&gr.on===true));", "cls('n-grid','off',!(gr.state==='ONLINE'&&gr.on===true)&&R.feed!=='unknown');")
    return js
