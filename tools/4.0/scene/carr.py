import math,sys
sys.path.insert(0,'/tmp/claude-0/-home-claude/b376be36-0118-5eb7-9409-c56e988e0bd8/scratchpad/gen2')
from scene import E,V
def rd(v,pts,r=2.6):
    P=[v.p(*q) for q in pts];n=len(P);out=[]
    for i in range(n):
        a,b,c=P[i-1],P[i],P[(i+1)%n]
        def tow(p,q,k):
            dx,dy=q[0]-p[0],q[1]-p[1];L=math.hypot(dx,dy) or 1;k=min(k,L*.45);return (p[0]+dx/L*k,p[1]+dy/L*k)
        s1=tow(b,a,r);s2=tow(b,c,r);out.append((s1,b,s2))
    d='M%.2f %.2f'%out[0][0]
    for k,(s1,b,s2) in enumerate(out):
        if k: d+=' L%.2f %.2f'%s1
        d+=' Q%.2f %.2f %.2f %.2f'%(b[0],b[1],s2[0],s2[1])
    return d+' Z'
def car(v,x0,y0,charging=False,flip=False,hook='',rad=2.6):
    L,W=82,34;X=(lambda x:x0+(L-x)) if flip else (lambda x:x0+x);Y=lambda y:y0+y;o=[]
    prof=[(0,9),(0,19),(4,22.5),(20,24),(30,35),(55,35.5),(67,25),(79,22.5),(82,19.5),(82,10),(78,8)]
    o.append('<ellipse cx="%.1f" cy="%.1f" rx="64" ry="16" fill="#000" opacity=".55" filter="url(#f-soft)"></ellipse>'%v.p(X(L/2),Y(W/2),0))
    o.append(E('path',d=rd(v,[(X(67),Y(3),25),(X(79),Y(3),22.5),(X(82),Y(4),19.5),(X(82),Y(W-4),19.5),(X(79),Y(W-3),22.5),(X(67),Y(W-3),25)],rad),fill='url(#g-ctop)'))
    o.append(E('path',d=rd(v,[(X(55),Y(4),35.5),(X(67),Y(3),25),(X(67),Y(W-3),25),(X(55),Y(W-4),35.5)],rad),fill='url(#g-glass)'))
    o.append(E('path',d=rd(v,[(X(31),Y(4),35.2),(X(54),Y(4),35.6),(X(54),Y(W-4),35.6),(X(31),Y(W-4),35.2)],rad),fill='#0f1518'))
    o.append(E('path',d=v.d([(X(33),Y(6),35.3),(X(52),Y(6),35.6),(X(52),Y(14),35.6),(X(33),Y(14),35.3)]),fill='url(#g-roofhl)',opacity='.55'))
    if flip:
        o.append(E('path',d=rd(v,[(X(20),Y(3),24),(X(30),Y(4),35),(X(30),Y(W-4),35),(X(20),Y(W-3),24)],rad),fill='url(#g-glass)'))
        o.append(E('path',d=rd(v,[(X(0),Y(1.5),9),(X(0),Y(W-1.5),9),(X(0),Y(W-1.5),19),(X(2.5),Y(W-3),22.8),(X(2.5),Y(3),22.8),(X(0),Y(1.5),19)],rad),fill='url(#g-crear)',stroke='#2c3338',stroke_width='.5'))
        o.append(E('path',d=v.d([(X(0),Y(1.5),9),(X(0),Y(W-1.5),9),(X(0),Y(W-1.5),12),(X(0),Y(1.5),12)]),fill='#101417'))
        o.append(E('path',d=v.d([(X(0),Y(4),17.6),(X(0),Y(W-4),17.6)],False),fill='none',stroke='#e5484d',stroke_width='1.8',stroke_linecap='round'))
        o.append(E('path',d=v.d([(X(0),Y(5),17.6),(X(0),Y(W-5),17.6)],False),fill='none',stroke='#ff6b6f',stroke_width='4',stroke_opacity='.35',filter='url(#f-dot)'))
    else:
        o.append(E('path',d=v.d([(X(82),Y(3),10),(X(82),Y(W-3),10),(X(82),Y(W-4),19.5),(X(82),Y(4),19.5)]),fill='url(#g-cfront)'))
    SIDE=rd(v,[(X(x),Y(W),z) for x,z in prof],rad*1.3);o.append(E('path',d=SIDE,fill='url(#g-cside)',stroke='#2c3338',stroke_width='.6',stroke_linejoin='round'));o.append(hook.replace('SIDEPATH',SIDE))
    o.append(E('path',d=v.d([(X(4),Y(W),22.3),(X(20),Y(W),23.6),(X(67),Y(W),24.6),(X(79),Y(W),22.2)],False),fill='none',stroke='#c9d2d8',stroke_opacity='.55',stroke_width='1',stroke_linecap='round'))
    o.append(E('path',d=rd(v,[(X(22),Y(W-.2),24.6),(X(31),Y(W-.6),33.5),(X(54),Y(W-.6),33.8),(X(64),Y(W-.2),25.2)],rad),fill='url(#g-glass)'))
    o.append(E('path',d=v.d([(X(42),Y(W-.4),33.7),(X(43.5),Y(W-.4),33.7),(X(43.5),Y(W-.3),24.9),(X(42),Y(W-.3),24.9)]),fill='#05080a'))
    o.append(E('path',d=v.d([(X(26),Y(W-.3),25),(X(33),Y(W-.5),32.8),(X(38),Y(W-.5),32.9),(X(31),Y(W-.3),25)]),fill='#fff',opacity='.10'))
    for seg in ([(43,24.6),(43,10.5)],[(62,24.4),(64,11)],[(23,24.4),(22,11)]):
        o.append(E('path',d=v.d([(X(a),Y(W),b) for a,b in seg],False),fill='none',stroke='#1b2125',stroke_width='.8'))
    for xh in (35,54):o.append(E('path',d=v.d([(X(xh),Y(W),21.5),(X(xh+4),Y(W),21.6)],False),fill='none',stroke='#aab4ba',stroke_width='1.4',stroke_linecap='round'))
    o.append(E('path',d=v.d([(X(62),Y(W),25.5),(X(65),Y(W+3),25.5),(X(65),Y(W+3),23),(X(62),Y(W),23.2)]),fill='#3a4248'))
    o.append(E('path',d=v.d([(X(0),Y(W),9),(X(82),Y(W),10),(X(82),Y(W),12.5),(X(0),Y(W),11.5)]),fill='#14191c'))
    for wx in (16,66):
        o.append(E('path',d=v.cxz(X(wx),Y(W),9,10.3,32),fill='#0a0d0f'))
        o.append(E('path',d=v.cxz(X(wx),Y(W)+.5,8.6,8.6,32),fill='#15191b'))
        o.append(E('path',d=v.cxz(X(wx),Y(W)+.8,8.6,5.8,32),fill='url(#g-rim)'))
        for a in range(5):
            an=2*math.pi*a/5+.3
            o.append(E('path',d=v.d([(X(wx+1.2*math.cos(an)),Y(W)+.9,8.6+1.2*math.sin(an)),(X(wx+5.2*math.cos(an)),Y(W)+.9,8.6+5.2*math.sin(an))],False),fill='none',stroke='#2a3136',stroke_width='1.5',stroke_linecap='round'))
        o.append(E('path',d=v.cxz(X(wx),Y(W)+1,8.6,1.4,16),fill='#5d666c'))
    if not flip: o.append(E('path',d=v.d([(X(82),Y(6),18.4),(X(82),Y(W-6),18.4)],False),fill='none',stroke='#e8f4ff',stroke_width='1.6',stroke_linecap='round'))
    o.append(E('path',d=v.d([(X(79.5),Y(W),20.5),(X(82),Y(W-2),19)],False),fill='none',stroke='#e8f4ff',stroke_width='2.2',stroke_linecap='round'))
    o.append(E('path',d=v.d([(X(.5),Y(W),19.5),(X(4),Y(W),21.8)],False),fill='none',stroke='#e5484d',stroke_width='2',stroke_linecap='round'))
    px,py=v.p(X(8),Y(W),20.8)
    if charging:
        pct=.64;x1,x2=6,6+70*pct
        strip=v.d([(X(6),Y(W)+.4,10.4),(X(76),Y(W)+.4,10.4),(X(76),Y(W)+.4,12.2),(X(6),Y(W)+.4,12.2)])
        fill=v.d([(X(x1),Y(W)+.5,10.4),(X(x2),Y(W)+.5,10.4),(X(x2),Y(W)+.5,12.2),(X(x1),Y(W)+.5,12.2)])
        a1=v.p(X(x1),Y(W)+.5,11.3);a2=v.p(X(x2),Y(W)+.5,11.3)
        o.append('<path d="%s" fill="#0b1210" opacity=".9"></path>'%strip)
        o.append('<clipPath id="cl-strip"><path d="%s"></path></clipPath>'%fill)
        o.append('<path d="%s" fill="url(#g-strip)"></path>'%fill)
        o.append('<path d="%s" fill="#A8D957" opacity=".55" filter="url(#f-soft)"></path>'%fill)
        o.append('<path id="sh-path" d="M%.1f %.1f L%.1f %.1f" fill="none" stroke="none"></path>'%(a1[0],a1[1],a2[0],a2[1]))
        o.append('<g clip-path="url(#cl-strip)"><ellipse rx="7" ry="4" fill="#F4FFE0" opacity=".9" filter="url(#f-dot)"><animateMotion dur="2.2s" repeatCount="indefinite"><mpath href="#sh-path"></mpath></animateMotion></ellipse></g>')
    o.append('<circle cx="%.1f" cy="%.1f" r="1.9" fill="%s"></circle>'%(px,py,'#C4E58A' if charging else '#9EDCF5'))
    return '\n'.join(o),(px,py),(X(8),Y(W),20.8)

