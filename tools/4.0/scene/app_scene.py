"""BLACKOUT 4.0 'scene 3' for the app: one SVG with every state; the app toggles classes from real data."""
import sys, json, re
sys.path.insert(0,'/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/gen2')
import scene as M
v=M.V((178,214))
H0=(0,0);G0=(-112,4);ST0=(110,30);CAR0=(-2,98);PY=(286,212)
o=[]
import random, math as _m
def E2(tag,**a):
    at=' '.join('%s="%s"'%(k.replace('_','-'),v_) for k,v_ in a.items());return '<%s %s></%s>'%(tag,at,tag)
def rrect(x0,y0,x1,y1,r,n=6):
    pts=[]
    for cx,cy,a0 in ((x1-r,y1-r,0),(x0+r,y1-r,90),(x0+r,y0+r,180),(x1-r,y0+r,270)):
        for i in range(n+1):
            an=_m.radians(a0+i*90/n);pts.append((cx+r*_m.cos(an),cy+r*_m.sin(an),0))
    return v.d(pts)
# lawn plot with a soft edge
o.append('<path d="%s" fill="#0d1a10" opacity=".9" filter="url(#f-soft)"></path>'%rrect(-150,-40,170,168,40))
o.append('<path d="%s" fill="url(#g-lawn)"></path>'%rrect(-142,-34,162,160,36))
o.append('<path d="%s" fill="none" stroke="#2f4a2c" stroke-opacity=".6" stroke-width="1"></path>'%rrect(-142,-34,162,160,36))
# grass tufts (deterministic)
random.seed(7);tf=[]
for i in range(120):
    x=random.uniform(-130,150);y=random.uniform(-25,150)
    if -6<x<104 and -6<y<84: continue          # under the house
    if -10<x<88 and 92<y<140: continue         # driveway
    if 104<x<160 and 22<y<66: continue         # station pad
    if -118<x<-70 and -2<y<34: continue        # generator pad
    a,b=v.p(x,y,0);h=random.uniform(2,3.6);tf.append('M%.1f %.1f l-1 -%.1f M%.1f %.1f l1.2 -%.1f'%(a,b,h,a+1.5,b,h*.8,))
o.append('<path d="%s" stroke="#3d6236" stroke-width=".9" stroke-linecap="round" opacity=".55" fill="none"></path>'%' '.join(tf))
# driveway under the car (pavers) to the plot edge, path to the porch, pads for the station and the generator
o.append('<path d="%s" fill="#2a302d"></path>'%rrect(-10,90,92,160,4))
o.append('<path d="%s" fill="none" stroke="#353c38" stroke-width=".7"></path>'%' '.join(v.d([(x,90,0),(x,160,0)],False) for x in range(2,92,12)))
o.append('<path d="%s" fill="#3a4240"></path>'%v.d([(50,80,0),(68,80,0),(68,90,0),(50,90,0)]))
o.append('<path d="%s" fill="#2c3330"></path>'%rrect(104,22,160,68,4))
o.append('<path d="%s" fill="#2c3330"></path>'%rrect(-120,-4,-68,36,4))
hx,hy=v.p(48,36,0)
o.append('<ellipse id="s3-pool" cx="%.1f" cy="%.1f" rx="130" ry="50" fill="#E9B866" opacity=".13" filter="url(#f-big)"></ellipse>'%(hx,hy+20))
gx,gy=v.p(G0[0]+17,G0[1]+12,0)
o.append('<ellipse id="s3-genpool" cx="%.1f" cy="%.1f" rx="60" ry="22" fill="#F0A542" opacity=".16" filter="url(#f-big)"></ellipse>'%(gx,gy))
# generator always drawn in 'on' form; CSS dims it when not running
gen=M.generator(v,*G0,on=True).replace('<g>','<g id="s3-gen" class="s3-tap">',1)
o.append(gen)
py_svg,arm=M.pylon(*PY,live=True)
o.append('<g id="s3-pyl">'+py_svg+'</g>')
wire_end=v.p(96,14,52)
wd='M%.1f %.1f Q %.1f %.1f %.1f %.1f'%(arm[0],arm[1],(arm[0]+wire_end[0])/2,(arm[1]+wire_end[1])/2+18,wire_end[0],wire_end[1])
def fl(id,d,kind,speed,w):
    return '<g id="%s" class="s3f"><g class="lv">%s</g><g class="dd">%s</g></g>'%(id,M.flow(id+'-p',d,kind,speed,w),M.dead(d))
gen_out=(G0[0]+34,G0[1]+16,4);house_in=(0,64,3);st_in=(ST0[0]+4,ST0[1]+6,3);hs_from=(96,40,1)
o.append(fl('s3-gh',M.curve(v,gen_out,house_in,12),'gen','mid',2.4))
o.append(fl('s3-wire',wd,'grid','mid',1.6))
o.append('<g id="s3-house">'+M.house(v,*H0,lit=True)+'</g>')
# solar array on the front roof slope + inverter on the gable wall: hidden until an inverter is added and answering
HL,HD,HH,HR,OV=96,72,54,34,5
def rs(x,t,lift=.6):
    y=HD+OV-t*(HD/2+OV);z=HH-3+t*(HR+3);return (x,y,z+lift)
pv=[]
cols=[(8,26),(28,46),(50,68),(70,88)];rows=[(.14,.47),(.51,.84)]
for (x0,x1) in cols:
    for (t0,t1) in rows:
        pv.append('<path d="%s" fill="#0e1626"></path>'%v.d([rs(x0-.6,t0-.02,.4),rs(x1+.6,t0-.02,.4),rs(x1+.6,t1+.02,.4),rs(x0-.6,t1+.02,.4)]))
        pv.append('<path d="%s" fill="url(#g-pv)"></path>'%v.d([rs(x0,t0),rs(x1,t0),rs(x1,t1),rs(x0,t1)]))
        ln=[]
        for k in range(1,4):
            xx=x0+(x1-x0)*k/4;ln.append(v.d([rs(xx,t0,.7),rs(xx,t1,.7)],False))
        tm=(t0+t1)/2;ln.append(v.d([rs(x0,tm,.7),rs(x1,tm,.7)],False))
        pv.append('<path d="%s" stroke="#5f82b8" stroke-opacity=".45" stroke-width=".5" fill="none"></path>'%' '.join(ln))
        pv.append('<path d="%s" fill="#9EDCF5" opacity=".10"></path>'%v.d([rs(x0,t1-.12),rs(x0+(x1-x0)*.5,t1),rs(x0+(x1-x0)*.35,t1),rs(x0,t1-.04)]))
o.append('<g id="s3-pv">'+'\n'.join(pv)+'</g>')
IX=HL+.3;iy0,iy1,iz0,iz1=46,60,12,30
inv=['<path d="%s" fill="#000" opacity=".35" filter="url(#f-soft)"></path>'%v.d([(IX+.2,iy0-1,iz0-2),(IX+.2,iy1+1,iz0-2),(IX+.2,iy1+1,iz1),(IX+.2,iy0-1,iz1)]),
 '<path d="%s" fill="#D9DEDB"></path>'%v.d([(IX,iy0,iz0),(IX,iy1,iz0),(IX,iy1,iz1),(IX,iy0,iz1)]),
 '<path d="%s" fill="#AEB5B1"></path>'%v.d([(IX,iy0,iz1),(IX,iy1,iz1),(IX+2.2,iy1,iz1),(IX+2.2,iy0,iz1)]),
 '<path d="%s" fill="#1b2420"></path>'%v.d([(IX+.1,iy0+3,iz0+9),(IX+.1,iy1-3,iz0+9),(IX+.1,iy1-3,iz1-3),(IX+.1,iy0+3,iz1-3)])]
a,b=v.p(IX+.2,iy0+4.5,iz0+5);inv.append('<circle id="s3-invled" cx="%.1f" cy="%.1f" r="1.1" fill="#A8D957"></circle>'%(a,b))
a,b=v.p(IX+.2,iy0+(iy1-iy0)/2,iz0+12.5);inv.append('<text id="s3-invw" x="%.1f" y="%.1f" text-anchor="middle" fill="#C4E58A" font-size="3.6" font-weight="600" font-family="Inter, sans-serif"></text>'%(a,b))
o.append('<g id="s3-inv">'+'\n'.join(inv)+'</g>')
pvd=v.d([(HL+OV,HD-4,HH-3),(HL+OV,HD-4,HH-8),(IX+.4,iy1-2,iz1+2),(IX+.4,iy1-2,iz1)],False)
pvf=M.flow('s3-pvf-p',pvd,'grid','slow',1.4).replace('#48B9E8','#F5C842').replace('#2c5b6e','#6b5a1e').replace('#CDEFFB','#FCE9A8').replace('#EAF8FD','#FFF6D6')
o.append('<g id="s3-pvf" class="s3f"><g class="lv">%s</g><g class="dd"></g></g>'%pvf)
import carr
# charge = liquid fill of the body side (A) + neon outline with a spark (C); geometry of the side plane goes to the app
hook=('<clipPath id="cl-side"><path d="SIDEPATH"></path></clipPath><g id="s3-liqw" clip-path="url(#cl-side)">'
      '<path id="s3-liq" d="" fill="url(#g-liq)" opacity=".92"></path><path id="s3-liqg" d="" fill="#C4E58A" opacity=".3" filter="url(#f-soft)"></path>'
      '<path id="s3-liqs" d="" fill="none" stroke="#F1FFD6" stroke-width="1" opacity=".85" filter="url(#f-dotsm)"></path></g>'
      '<g id="s3-neonw"><path id="s3-neonG" d="SIDEPATH" pathLength="100" fill="none" stroke="#A8D957" stroke-width="5" stroke-opacity=".5" filter="url(#f-glow)" stroke-linecap="round" stroke-dasharray="0 100"></path>'
      '<path id="s3-neon" d="SIDEPATH" pathLength="100" fill="none" stroke="#E3F5C4" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="0 100"></path>'
      '<circle id="s3-spark" r="2.2" fill="#F4FFE6" filter="url(#f-dot)" cx="-99" cy="-99"></circle></g>')
cs,port,portw=carr.car(v,*CAR0,charging=False,flip=True,hook=hook)
import math as _c
_C=_c.cos(_c.radians(30))
P0=v.p(CAR0[0]+82,CAR0[1]+34.6,0)
strip={'P0':[round(P0[0],2),round(P0[1],2)],'ex':[-_C*v.k,-.5*v.k],'ez':[0,-v.k]}
o.append('<g id="s3-car" class="s3-tap">'+cs+'</g>')
st=M.station(v,*ST0)
o.append('<g id="s3-st" class="s3-tap">'+st+'</g>')
# station <-> house: a real power cable, plugged into the station's AC socket and into a wall socket on the gable
import math as _mm
SX=ST0[0]+24.5;SY=ST0[1]+26
WALL=(96,66,9)
def ring_pts(cx,cy,cz,r,face,n=20):
    return [((cx,cy+r*_mm.cos(2*_mm.pi*i/n),cz+r*_mm.sin(2*_mm.pi*i/n)) if face=='x' else (cx+r*_mm.cos(2*_mm.pi*i/n),cy,cz+r*_mm.sin(2*_mm.pi*i/n))) for i in range(n)]
way=[(WALL[0]+4.4,WALL[1],WALL[2]-1.2),(WALL[0]+5.6,WALL[1]+.6,WALL[2]-4.5),(WALL[0]+6.2,WALL[1]+1.4,.7),(WALL[0]+11,WALL[1]+.6,.6),
     (ST0[0]+2,ST0[1]+35,.6),(SX-6,SY+7.5,.6),(SX-.4,SY+6.4,1.2),(SX,SY+4.6,5.5),(SX,SY+3.4,11.4)]
pts=[v.p(*q) for q in way];cd=M.catmull(pts)
shd=M.catmull([v.p(q[0]+1.2,q[1]+1.2,0) for q in way[2:7]])
cab=[]
cab.append('<path d="%s" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3.6" stroke-linecap="round" filter="url(#f-soft)"></path>'%shd)
# wall socket plate + plug body (house side)
wx,wy,wz=WALL
cab.append(E2('path',d=v.d([(wx+.2,wy-4.2,wz-4.2),(wx+.2,wy+4.2,wz-4.2),(wx+.2,wy+4.2,wz+4.2),(wx+.2,wy-4.2,wz+4.2)]),fill='#E7ECE9',stroke='#9aa7a0',stroke_width='.4'))
cab.append(E2('path',d=v.d(ring_pts(wx+.3,wy,wz,2.9,'x')),fill='#cfd6d2'))
cab.append(E2('path',d=v.d([(wx+.4,wy-2.2,wz-2.2),(wx+3.8,wy-2.2,wz-2.2),(wx+3.8,wy+2.2,wz-2.2),(wx+3.8,wy+2.2,wz+2.2),(wx+.4,wy+2.2,wz+2.2)]),fill='#1c2326'))
cab.append(E2('path',d=v.d([(wx+3.8,wy-2.2,wz-2.2),(wx+3.8,wy+2.2,wz-2.2),(wx+3.8,wy+2.2,wz+2.2),(wx+3.8,wy-2.2,wz+2.2)]),fill='#2a3236'))
cab.append(E2('path',d=v.d([(wx+.4,wy-2.2,wz+2.2),(wx+3.8,wy-2.2,wz+2.2),(wx+3.8,wy+2.2,wz+2.2),(wx+.4,wy+2.2,wz+2.2)]),fill='#3a4448'))
# the cable itself
cab.append('<path id="s3-cab-p" d="%s" fill="none" stroke="#151b1e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path>'%cd)
cab.append('<path d="%s" fill="none" stroke="#56636b" stroke-width=".7" stroke-linecap="round" stroke-opacity=".75" transform="translate(-.4 -.6)"></path>'%cd)
# plug in the station's AC socket (station side)
cab.append(E2('path',d=v.d([(SX-2.4,SY+.2,13-2.6),(SX+2.4,SY+.2,13-2.6),(SX+2.4,SY+3.4,13-2.6),(SX+2.4,SY+3.4,13+2.6),(SX-2.4,SY+3.4,13+2.6),(SX-2.4,SY+.2,13+2.6)]),fill='#1c2326'))
cab.append(E2('path',d=v.d([(SX-2.4,SY+3.4,13-2.6),(SX+2.4,SY+3.4,13-2.6),(SX+2.4,SY+3.4,13+2.6),(SX-2.4,SY+3.4,13+2.6)]),fill='#2a3236'))
cab.append(E2('path',d=v.d([(SX-2.4,SY+.2,13+2.6),(SX+2.4,SY+.2,13+2.6),(SX+2.4,SY+3.4,13+2.6),(SX-2.4,SY+3.4,13+2.6)]),fill='#3a4448'))
o.append('<g id="s3-cab">'+'\n'.join(cab)+'</g>')
def cable_live(gid,col,core,dot,rev,dur):
    k='1;0' if rev else '0;1'
    s='<path d="%s" fill="none" stroke="%s" stroke-opacity=".45" stroke-width="7" stroke-linecap="round" filter="url(#f-glow)"><animate attributeName="stroke-opacity" values=".25;.55;.25" dur="2.4s" repeatCount="indefinite"></animate></path>'%(cd,col)
    s+='<path d="%s" fill="none" stroke="#151b1e" stroke-width="2.6" stroke-linecap="round"></path>'%cd
    s+='<path class="fl evd" d="%s" fill="none" stroke="%s" stroke-width="1.1" stroke-linecap="round" filter="url(#f-dotsm)"%s></path>'%(cd,core,' style="animation-direction:reverse"' if rev else '')
    for i,b in enumerate((0,dur/3,2*dur/3)):
        s+='<circle r="%s" fill="%s" filter="url(#f-dot)"><animateMotion dur="%.2fs" begin="-%.2fs" repeatCount="indefinite" keyPoints="%s" keyTimes="0;1" calcMode="linear"><mpath href="#s3-cab-p"></mpath></animateMotion></circle>'%((2.2,1.8,1.5)[i],dot,dur,b,k)
    # glow at both plugs
    for (q,r0) in ((WALL,8),((SX,SY+2,13),8)):
        a,b2=v.p(q[0]+(2 if q is WALL else 0),q[1],q[2]);s+='<circle cx="%.1f" cy="%.1f" r="%d" fill="%s" opacity=".3" filter="url(#f-glow)"><animate attributeName="opacity" values=".15;.45;.15" dur="2.4s" repeatCount="indefinite"></animate></circle>'%(a,b2,r0,col)
    return '<g id="%s" class="s3f"><g class="lv">%s</g><g class="dd"></g></g>'%(gid,s)
o.append(cable_live('s3-use','#A8D957','#E3F5C4','#F4FFE6',True,1.9))
o.append(cable_live('s3-hs','#48B9E8','#CDEFFB','#EAF8FD',False,2.4))
# generator charging the station goes the real way: generator -> house wiring -> the same cable -> station
o.append(cable_live('s3-gs','#F0A542','#FFD9A0','#FFE7C2',False,2.2))
wbs,_=M.wallcharger(v,92,72,10,'y')
o.append('<g id="s3-wb">'+wbs+'</g>')
qx,qy,qz=portw
ev=M.ev_charge(v,[(92,74.6,10),(92,77.5,4),(93,85,1),(92,104,.6),(89,128,.8),(qx+9,qy+3.5,1.2),(qx+2.5,qy+1.2,9)],portw,port)
# split ev into cable body (always) and live energy layers
parts=ev.split('\n')
body=[p for p in parts if ('#1a2024' in p or '#5c6870' in p or 'stroke-opacity=".55" stroke-width="5"' in p or '#11171a' in p or 'linearGradient' in p)]
live=[p for p in parts if p not in body]
o.append('<g id="s3-ev"><g class="evb">%s</g><g class="lv">%s</g></g>'%('\n'.join(body),'\n'.join(live)))
bx,by=port[0]+14,port[1]-50
o.append('<g id="s3-badge" transform="translate(%.1f %.1f)"><rect x="-27" y="-10" width="54" height="17" rx="8.5" fill="#101613" stroke="#A8D957" stroke-opacity=".6" stroke-width=".8"></rect><path d="M-17 -6 L-21 0.5 H-17.6 L-19 5 L-14 -1.6 H-17.4 Z" fill="#C4E58A"></path><text id="s3-kw" x="5" y="2.6" text-anchor="middle" fill="#F1F5F2" font-size="7.6" font-weight="600" font-family="Inter, sans-serif">—</text></g>'%(bx,by))
def T(id,x,y,txt,col,size,w=None,ls=None):
    return '<text id="%s" x="%.1f" y="%.1f" text-anchor="middle" fill="%s" font-size="%s"%s%s font-family="Inter, sans-serif">%s</text>'%(id,x,y,col,round(size/1.25,1),' font-weight="%s"'%w if w else '',' letter-spacing="%s"'%ls if ls else '',txt)
sx,sy=v.p(ST0[0]+21,ST0[1]+13,0);o.append(T('s3-stp',sx,sy+30,'—','#C4E58A',14,600));o.append(T('s3-sts',sx,sy+46,'','#8b978f',11))
cx,cy=v.p(CAR0[0]+41,CAR0[1]+17,0);o.append(T('s3-cp',cx,cy+34,'','#C4E58A',14,600));o.append(T('s3-cs',cx,cy+50,'','#8b978f',11))
o.append(T('s3-g1',gx,gy-52,'ГЕНЕРАТОР','#65736A',10.5,None,1));o.append(T('s3-g2',gx,gy-40,'','#65736A',10.5))
o.append(T('s3-p1',PY[0],PY[1]-118,'МЕРЕЖА','#72C9ED',10.5,None,1));o.append(T('s3-p2',PY[0],PY[1]-104,'','#65736A',10.5))
inner='\n'.join(o)
defs=M.DEFS.replace('<defs>','<defs>\n<linearGradient id="g-liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D4F59A"></stop><stop offset=".18" stop-color="#A8D957"></stop><stop offset="1" stop-color="#3f7a1e"></stop></linearGradient>\n<linearGradient id="g-pv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2c4a7a"></stop><stop offset="100%" stop-color="#16243f"></stop></linearGradient>\n<filter id="f-dotsm" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".5"></feGaussianBlur></filter>')
for need in ('g-wbx','g-crear','g-liq'):
    assert need in defs or need in inner, need
svg='<svg id="s3" viewBox="VIEWBOX" role="img" aria-label="Схема енергії: будинок, мережа, генератор, станція, авто">'+defs+'<g transform="translate(-52 4) scale(1.25)">'+inner+'</g></svg>'
css='''#s3{display:block;width:calc(100% + 40px);margin:0 -20px;height:auto;overflow:visible}
@keyframes k-flick{0%,100%{opacity:.86}50%{opacity:1}}@keyframes k-dash{to{stroke-dashoffset:-40}}
@keyframes k-smoke{0%{opacity:.5;transform:translate(0,0) scale(.6)}100%{opacity:0;transform:translate(8px,-22px) scale(1.9)}}
#s3 .win{animation:k-flick 4.5s ease-in-out infinite}#s3 .fl{stroke-dasharray:8 32;animation:k-dash 1.6s linear infinite}
#s3 .fl.fast{animation-duration:.9s}#s3 .fl.slow{animation-duration:2.4s}#s3 .fl.evd{stroke-dasharray:3 17;animation-duration:.8s;opacity:.85}
#s3 .smk{transform-box:fill-box;transform-origin:center;animation:k-smoke 2.8s ease-out infinite;display:none}#s3 .smk.b{animation-delay:1.4s}
#s3 .s3f .lv{display:none}#s3 .s3f.on .lv{display:inline}#s3 .s3f.on .dd{display:none}#s3 .s3f.cf .dd path{stroke:#EF665B;stroke-opacity:.8}
#s3 #s3-ev .lv,#s3 #s3-badge{display:none}#s3 #s3-ev.on .lv,#s3 #s3-badge.on{display:inline}#s3 #s3-ev.none{display:none}
#s3 #s3-gen{opacity:.62;transition:opacity .6s}#s3 #s3-gen.run{opacity:1}#s3 #s3-gen.run .smk{display:inline}
#s3 #s3-genpool{opacity:0;transition:opacity .8s}#s3 #s3-genpool.on{opacity:.16}
#s3 #s3-house.dark .win,#s3 #s3-house.dark [fill="url(#g-light)"]{fill:#1c2622;animation:none}#s3 #s3-pool{transition:opacity .8s}#s3 #s3-pool.off{opacity:0}
#s3 #s3-pyl.off{opacity:.55}#s3 #s3-car.idle #s3-liq{opacity:.55}#s3 #s3-car.idle #s3-liqg{display:none}#s3 #s3-neonw{display:none}#s3 #s3-car:not(.idle) #s3-neonw{display:inline}
#s3 #s3-pv,#s3 #s3-inv{display:none}#s3.pv #s3-pv,#s3.inv #s3-inv{display:inline}#s3 #s3-wb.off circle{display:none}#s3 .s3-tap{cursor:pointer}
@media (prefers-reduced-motion:reduce){#s3 *{animation:none!important}}'''
json.dump({'svg':svg,'css':css,'strip':strip},open('/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/gen2/s3.json','w'),ensure_ascii=False)
print(len(svg))
