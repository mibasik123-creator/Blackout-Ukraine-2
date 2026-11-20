import math, sys, json
C=math.cos(math.radians(30))
class V:
    def __init__(s,O,k=1.0):s.O=O;s.k=k
    def p(s,x,y,z=0):return (s.O[0]+(x-y)*C*s.k, s.O[1]+((x+y)*.5-z)*s.k)
    def d(s,pts,close=True):
        t='M'+' L'.join('%.1f %.1f'%s.p(*q) for q in pts);return t+(' Z' if close else '')
    def cxz(s,cx,y,cz,r,n=28):return s.d([(cx+r*math.cos(2*math.pi*i/n),y,cz+r*math.sin(2*math.pi*i/n)) for i in range(n)])
    def cyz(s,x,cy,cz,r,n=28):return s.d([(x,cy+r*math.cos(2*math.pi*i/n),cz+r*math.sin(2*math.pi*i/n)) for i in range(n)])
def E(tag,**a):
    at=' '.join('%s="%s"'%(k.replace('_','-'),v) for k,v in a.items());return '<%s %s></%s>'%(tag,at,tag)

def house(v,x0,y0,lit=True):
    L,D,H,R=96,72,54,34;o=[]
    X=lambda x:x0+x;Y=lambda y:y0+y
    o.append('<ellipse cx="%.1f" cy="%.1f" rx="96" ry="26" fill="#000" opacity=".5" filter="url(#f-soft)"></ellipse>'%v.p(X(L/2),Y(D/2),0))
    # chimney (back slope)
    o.append(E('path',d=v.d([(X(60),Y(24),H+18),(X(68),Y(24),H+18),(X(68),Y(24),H+R+12),(X(60),Y(24),H+R+12)]),fill='#3b302a'))
    o.append(E('path',d=v.d([(X(68),Y(24),H+18),(X(68),Y(16),H+18),(X(68),Y(16),H+R+12),(X(68),Y(24),H+R+12)]),fill='#4c3d35'))
    o.append(E('path',d=v.d([(X(60),Y(16),H+R+12),(X(68),Y(16),H+R+12),(X(68),Y(24),H+R+12),(X(60),Y(24),H+R+12)]),fill='#5d4c43'))
    # walls
    o.append(E('path',d=v.d([(X(0),Y(D),0),(X(L),Y(D),0),(X(L),Y(D),H),(X(0),Y(D),H)]),fill='url(#g-wf)'))
    o.append(E('path',d=v.d([(X(L),Y(D),0),(X(L),Y(0),0),(X(L),Y(0),H),(X(L),Y(D/2),H+R),(X(L),Y(D),H)]),fill='url(#g-ws)'))
    # plinth
    o.append(E('path',d=v.d([(X(0),Y(D),0),(X(L),Y(D),0),(X(L),Y(D),5),(X(0),Y(D),5)]),fill='#141b17'))
    o.append(E('path',d=v.d([(X(L),Y(D),0),(X(L),Y(0),0),(X(L),Y(0),5),(X(L),Y(D),5)]),fill='#18201c'))
    # roof (front slope) with overhang + fascia + tiles
    ov=5
    o.append(E('path',d=v.d([(X(-ov),Y(D+ov),H-3),(X(L+ov),Y(D+ov),H-3),(X(L+ov),Y(D/2),H+R),(X(-ov),Y(D/2),H+R)]),fill='url(#g-roof)'))
    o.append(E('path',d=v.d([(X(-ov),Y(D+ov),H-3),(X(L+ov),Y(D+ov),H-3),(X(L+ov),Y(D+ov),H-6),(X(-ov),Y(D+ov),H-6)]),fill='#1f1815'))
    o.append(E('path',d=v.d([(X(L+ov),Y(D+ov),H-3),(X(L+ov),Y(D/2),H+R),(X(L+ov),Y(-ov),H-3),(X(L+ov),Y(-ov),H-6),(X(L+ov),Y(D/2),H+R-3),(X(L+ov),Y(D+ov),H-6)]),fill='#3b2f2a'))
    for i in range(1,9):
        xx=-ov+i*(L+2*ov)/9
        o.append(E('path',d=v.d([(X(xx),Y(D+ov),H-3),(X(xx),Y(D/2),H+R)],False),stroke='#2c231f',stroke_width='.8',fill='none'))
    o.append(E('path',d=v.d([(X(-ov),Y(D/2),H+R),(X(L+ov),Y(D/2),H+R)],False),stroke='#7a6458',stroke_width='1.4',fill='none'))
    # windows front (3) + door + porch light
    gl='url(#g-light)' if lit else '#1c2622'
    for (a,b) in ((6,24),(30,48),(70,88)):
        o.append(E('path',d=v.d([(X(a),Y(D)+.2,18),(X(b),Y(D)+.2,18),(X(b),Y(D)+.2,40),(X(a),Y(D)+.2,40)]),fill=gl,**({'class':'win'} if lit else {})))
        o.append(E('path',d=v.d([(X(a),Y(D)+.3,18),(X(b),Y(D)+.3,18),(X(b),Y(D)+.3,40),(X(a),Y(D)+.3,40)]),fill='none',stroke='#2a241c',stroke_width='1.2'))
        o.append(E('path',d=v.d([(X((a+b)/2),Y(D)+.3,18),(X((a+b)/2),Y(D)+.3,40)],False),stroke='#2a241c',stroke_width='1',fill='none'))
        o.append(E('path',d=v.d([(X(a-1.5),Y(D)+.3,17),(X(b+1.5),Y(D)+.3,17),(X(b+1.5),Y(D)+2.5,16),(X(a-1.5),Y(D)+2.5,16)]),fill='#3a4640'))
    o.append(E('path',d=v.d([(X(54),Y(D)+.2,0),(X(64),Y(D)+.2,0),(X(64),Y(D)+.2,30),(X(54),Y(D)+.2,30)]),fill='#5a3e2b'))
    o.append(E('path',d=v.d([(X(55.5),Y(D)+.3,20),(X(62.5),Y(D)+.3,20),(X(62.5),Y(D)+.3,28),(X(55.5),Y(D)+.3,28)]),fill=gl))
    a,b=v.p(X(62),Y(D)+.4,14);o.append('<circle cx="%.1f" cy="%.1f" r="1.1" fill="#E9B866"></circle>'%(a,b))
    # porch step
    o.append(E('path',d=v.d([(X(50),Y(D),3),(X(68),Y(D),3),(X(68),Y(D+8),3),(X(50),Y(D+8),3)]),fill='#3a4640'))
    o.append(E('path',d=v.d([(X(50),Y(D+8),0),(X(68),Y(D+8),0),(X(68),Y(D+8),3),(X(50),Y(D+8),3)]),fill='#232c28'))
    if lit:
        a,b=v.p(X(59),Y(D)+1,33);o.append('<circle cx="%.1f" cy="%.1f" r="9" fill="#FFE6B0" opacity=".35" filter="url(#f-soft)"></circle><circle cx="%.1f" cy="%.1f" r="1.6" fill="#FFE6B0"></circle>'%(a,b,a,b))
    # gable window + attic round
    o.append(E('path',d=v.d([(X(L)+.2,Y(48),18),(X(L)+.2,Y(24),18),(X(L)+.2,Y(24),40),(X(L)+.2,Y(48),40)]),fill=gl,**({'class':'win'} if lit else {})))
    o.append(E('path',d=v.d([(X(L)+.3,Y(48),18),(X(L)+.3,Y(24),18),(X(L)+.3,Y(24),40),(X(L)+.3,Y(48),40)]),fill='none',stroke='#2a241c',stroke_width='1.2'))
    o.append(E('path',d=v.d([(X(L)+.3,Y(36),18),(X(L)+.3,Y(36),40)],False),stroke='#2a241c',stroke_width='1',fill='none'))
    o.append(E('path',d=v.cyz(X(L)+.2,Y(D/2),H+14,5),fill=('#FFE6B0' if lit else '#1c2622')))
    return '\n'.join(o)

def wallbox(v,x,y,z,face='x'):
    if face=='x':pts=[(x+.3,y-3,z),(x+.3,y+3,z),(x+.3,y+3,z+9),(x+.3,y-3,z+9)]
    else:pts=[(x-3,y+.3,z),(x+3,y+.3,z),(x+3,y+.3,z+9),(x-3,y+.3,z+9)]
    a,b=v.p(*((x+.4,y,z+6) if face=='x' else (x,y+.4,z+6)))
    return E('path',d=v.d(pts),fill='#E8EEE9')+'<circle cx="%.1f" cy="%.1f" r="1.1" fill="#48B9E8"></circle>'%(a,b)

def generator(v,x0,y0,on=False):
    L,W,H=34,24,26;X=lambda x:x0+x;Y=lambda y:y0+y;o=[]
    o.append('<g%s>'%('' if on else ' opacity=".75"'))
    o.append('<ellipse cx="%.1f" cy="%.1f" rx="34" ry="10" fill="#000" opacity=".5" filter="url(#f-soft)"></ellipse>'%v.p(X(L/2),Y(W/2),0))
    # tank
    o.append(E('path',d=v.d([(X(5),Y(3),H-5),(X(L-5),Y(3),H-5),(X(L-5),Y(W-3),H-5),(X(5),Y(W-3),H-5)]),fill='#8a5c22'))
    o.append(E('path',d=v.d([(X(6),Y(4),H-1),(X(L-6),Y(4),H-1),(X(L-6),Y(W-4),H-1),(X(6),Y(W-4),H-1)]),fill='#c98a33'))
    o.append(E('path',d=v.d([(X(6),Y(W-4),H-1),(X(L-6),Y(W-4),H-1),(X(L-5),Y(W-3),H-5),(X(5),Y(W-3),H-5)]),fill='#a87228'))
    o.append(E('path',d=v.cxz(X(L-11),Y(W-4)+.1,H,2.2,16),fill='#2b3530'))
    # engine (front-left) + alternator (front-right)
    o.append(E('path',d=v.d([(X(3),Y(W-2),2),(X(18),Y(W-2),2),(X(18),Y(W-2),H-6),(X(3),Y(W-2),H-6)]),fill='#232c27'))
    for z in (8,11,14,17):
        o.append(E('path',d=v.d([(X(5),Y(W-1.8),z),(X(16),Y(W-1.8),z)],False),stroke='#111714',stroke_width='1.4',fill='none'))
    o.append(E('path',d=v.cxz(X(6),Y(W-1.6),11,4.2,20),fill='#151c18',stroke='#3a463f',stroke_width='.8'))
    o.append(E('path',d=v.d([(X(19),Y(W-2),2),(X(L-3),Y(W-2),2),(X(L-3),Y(W-2),H-6),(X(19),Y(W-2),H-6)]),fill='#2b3530'))
    o.append(E('path',d=v.d([(X(21),Y(W-1.8),6),(X(L-5),Y(W-1.8),6),(X(L-5),Y(W-1.8),H-8),(X(21),Y(W-1.8),H-8)]),fill='#101613',stroke='#3a463f',stroke_width='.6'))
    for sx in (24,29):
        o.append(E('path',d=v.cxz(X(sx),Y(W-1.7),12,1.8,14),fill='#151c18',stroke='#56635c',stroke_width='.6'))
    a,b=v.p(X(L-7),Y(W-1.6),9);o.append('<circle class="gled" cx="%.1f" cy="%.1f" r="1" fill="%s"></circle>'%(a,b,'#A8D957' if on else '#3a463f'))
    o.append(E('path',d=v.d([(X(L-3),Y(4),4),(X(L-3),Y(W-4),4),(X(L-3),Y(W-4),H-8),(X(L-3),Y(4),H-8)]),fill='#26302b'))
    # muffler
    o.append(E('path',d=v.cyz(X(L),Y(8),H-8,3,16),fill='#3a463f'))
    # tubular frame
    fr=[[(X(0),Y(W),0),(X(0),Y(W),H)],[(X(L),Y(W),0),(X(L),Y(W),H)],[(X(L),Y(0),0),(X(L),Y(0),H)],
        [(X(0),Y(W),H),(X(L),Y(W),H)],[(X(L),Y(W),H),(X(L),Y(0),H)],[(X(0),Y(W),0),(X(L),Y(W),0)],[(X(L),Y(W),0),(X(L),Y(0),0)],
        [(X(0),Y(0),H),(X(0),Y(W),H)],[(X(0),Y(0),H),(X(L),Y(0),H)]]
    for f in fr:o.append(E('path',d=v.d(f,False),stroke='#5f6c65',stroke_width='2.2',stroke_linecap='round',fill='none'))
    if on:
        a,b=v.p(X(L+2),Y(8),H-8)
        o.append('<circle class="smk" cx="%.1f" cy="%.1f" r="3" fill="#A0ADA4"></circle><circle class="smk b" cx="%.1f" cy="%.1f" r="3" fill="#A0ADA4"></circle>'%(a,b,a,b))
    o.append('</g>');return '\n'.join(o)

def station(v,x0,y0):
    L,W,H,r=42,26,28,3.2;X=lambda x:x0+x;Y=lambda y:y0+y;o=[]
    o.append('<ellipse cx="%.1f" cy="%.1f" rx="36" ry="10" fill="#000" opacity=".55" filter="url(#f-soft)"></ellipse>'%v.p(X(L/2),Y(W/2),0))
    def rr(a0,a1,z0,z1,fix,face):
        pts=[]
        for c1,c2,ang in ((a1-r,z1-r,0),(a0+r,z1-r,90),(a0+r,z0+r,180),(a1-r,z0+r,270)):
            for i in range(5):
                an=math.radians(ang+i*22.5);u,w=c1+r*math.cos(an),c2+r*math.sin(an)
                pts.append((X(u),Y(fix),w) if face=='y' else (X(fix),Y(u),w))
        return pts
    top=[(X(r),Y(0),H),(X(L-r),Y(0),H),(X(L),Y(r),H),(X(L),Y(W-r),H),(X(L-r),Y(W),H),(X(r),Y(W),H),(X(0),Y(W-r),H),(X(0),Y(r),H)]
    o.append(E('path',d=v.d(top),fill='url(#g-sttop)'))
    o.append(E('path',d=v.d(rr(0,W,0,H,L,'x')),fill='url(#g-stside)',stroke='#2b3430',stroke_width='.6'))
    o.append(E('path',d=v.d(rr(0,L,0,H,W,'y')),fill='url(#g-stfront)',stroke='#2b3430',stroke_width='.6'))
    o.append(E('path',d=v.d([(X(r),Y(W),H-.3),(X(L-r),Y(W),H-.3)],False),stroke='#9aa7a0',stroke_opacity='.6',stroke_width='.9',fill='none'))
    for hx in (5,L-11):
        o.append(E('path',d=v.d([(X(hx),Y(6),H),(X(hx+6),Y(6),H),(X(hx+6),Y(W-6),H),(X(hx),Y(W-6),H)]),fill='#0c110f'))
        o.append(E('path',d=v.d([(X(hx+1),Y(6.5),H+2.6),(X(hx+5),Y(6.5),H+2.6),(X(hx+5),Y(W-6.5),H+2.6),(X(hx+1),Y(W-6.5),H+2.6)]),fill='#5b6862'))
    o.append(E('path',d=v.d([(X(4),Y(W)+.1,26),(X(17),Y(W)+.1,26),(X(17),Y(W)+.1,17),(X(4),Y(W)+.1,17)]),fill='#070b09',stroke='#3a463f',stroke_width='.5'))
    o.append(E('path',d=v.d([(X(5.5),Y(W)+.2,20.5),(X(13),Y(W)+.2,20.5),(X(13),Y(W)+.2,18.6),(X(5.5),Y(W)+.2,18.6)]),fill='#A8D957'))
    o.append(E('path',d=v.d([(X(5.5),Y(W)+.2,24.5),(X(10),Y(W)+.2,24.5),(X(10),Y(W)+.2,22.5),(X(5.5),Y(W)+.2,22.5)]),fill='#C4E58A',opacity='.8'))
    for sx in (24.5,34.5):
        o.append(E('path',d=v.cxz(X(sx),Y(W)+.1,13,4.3,24),fill='#0c110f',stroke='#59665f',stroke_width='.7'))
        for dd in (-1.5,1.5):
            a,b=v.p(X(sx+dd),Y(W)+.2,13);o.append('<circle cx="%.1f" cy="%.1f" r=".75" fill="#9aa7a0"></circle>'%(a,b))
    for ux in (5,9,13):
        o.append(E('path',d=v.d([(X(ux),Y(W)+.1,8.4),(X(ux+2.6),Y(W)+.1,8.4),(X(ux+2.6),Y(W)+.1,6.8),(X(ux),Y(W)+.1,6.8)]),fill='#0c110f',stroke='#59665f',stroke_width='.4'))
    o.append(E('path',d=v.cxz(X(9.5),Y(W)+.1,12.6,2,16),fill='none',stroke='#A8D957',stroke_width='.9'))
    for i in range(6):
        z=8+i*2.6;o.append(E('path',d=v.d([(X(L)+.1,Y(6),z),(X(L)+.1,Y(W-6),z)],False),stroke='#151c18',stroke_width='1.1',stroke_linecap='round',fill='none'))
    return '\n'.join(o)

def car(v,x0,y0,charging=False,flip=False):
    L,W=82,34;X=(lambda x:x0+(L-x)) if flip else (lambda x:x0+x);Y=lambda y:y0+y;o=[]
    prof=[(0,9),(0,19),(4,22.5),(20,24),(30,35),(55,35.5),(67,25),(79,22.5),(82,19.5),(82,10),(78,8)]
    o.append('<ellipse cx="%.1f" cy="%.1f" rx="64" ry="16" fill="#000" opacity=".55" filter="url(#f-soft)"></ellipse>'%v.p(X(L/2),Y(W/2),0))
    o.append(E('path',d=v.d([(X(67),Y(3),25),(X(79),Y(3),22.5),(X(82),Y(4),19.5),(X(82),Y(W-4),19.5),(X(79),Y(W-3),22.5),(X(67),Y(W-3),25)]),fill='url(#g-ctop)'))
    o.append(E('path',d=v.d([(X(55),Y(4),35.5),(X(67),Y(3),25),(X(67),Y(W-3),25),(X(55),Y(W-4),35.5)]),fill='url(#g-glass)'))
    o.append(E('path',d=v.d([(X(31),Y(4),35.2),(X(54),Y(4),35.6),(X(54),Y(W-4),35.6),(X(31),Y(W-4),35.2)]),fill='#0f1518'))
    o.append(E('path',d=v.d([(X(33),Y(6),35.3),(X(52),Y(6),35.6),(X(52),Y(14),35.6),(X(33),Y(14),35.3)]),fill='url(#g-roofhl)',opacity='.55'))
    if flip:
        o.append(E('path',d=v.d([(X(20),Y(3),24),(X(30),Y(4),35),(X(30),Y(W-4),35),(X(20),Y(W-3),24)]),fill='url(#g-glass)'))
        o.append(E('path',d=v.d([(X(0),Y(1.5),9),(X(0),Y(W-1.5),9),(X(0),Y(W-1.5),19),(X(2.5),Y(W-3),22.8),(X(2.5),Y(3),22.8),(X(0),Y(1.5),19)]),fill='url(#g-crear)',stroke='#2c3338',stroke_width='.5'))
        o.append(E('path',d=v.d([(X(0),Y(1.5),9),(X(0),Y(W-1.5),9),(X(0),Y(W-1.5),12),(X(0),Y(1.5),12)]),fill='#101417'))
        o.append(E('path',d=v.d([(X(0),Y(4),17.6),(X(0),Y(W-4),17.6)],False),fill='none',stroke='#e5484d',stroke_width='1.8',stroke_linecap='round'))
        o.append(E('path',d=v.d([(X(0),Y(5),17.6),(X(0),Y(W-5),17.6)],False),fill='none',stroke='#ff6b6f',stroke_width='4',stroke_opacity='.35',filter='url(#f-dot)'))
    else:
        o.append(E('path',d=v.d([(X(82),Y(3),10),(X(82),Y(W-3),10),(X(82),Y(W-4),19.5),(X(82),Y(4),19.5)]),fill='url(#g-cfront)'))
    o.append(E('path',d=v.d([(X(x),Y(W),z) for x,z in prof]),fill='url(#g-cside)',stroke='#2c3338',stroke_width='.6',stroke_linejoin='round'))
    o.append(E('path',d=v.d([(X(4),Y(W),22.3),(X(20),Y(W),23.6),(X(67),Y(W),24.6),(X(79),Y(W),22.2)],False),fill='none',stroke='#c9d2d8',stroke_opacity='.55',stroke_width='1',stroke_linecap='round'))
    o.append(E('path',d=v.d([(X(22),Y(W-.2),24.6),(X(31),Y(W-.6),33.5),(X(54),Y(W-.6),33.8),(X(64),Y(W-.2),25.2)]),fill='url(#g-glass)'))
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

def pylon(bx,by,live=True):
    c='#7f98a6' if live else '#4d5a61'
    s='<ellipse cx="%.1f" cy="%.1f" rx="18" ry="5.5" fill="#000" opacity=".5"></ellipse>'%(bx,by+1)
    s+='<g stroke="%s" stroke-width="1.4" stroke-linecap="round" fill="none">'%c
    s+='<path d="M{a} {b} L{c} {d} M{e} {b} L{f} {d} M{c} {d} H{f}"></path>'.format(a=bx-13,b=by,c=bx-2,d=by-108,e=bx+13,f=bx+2)
    for i,h in enumerate((20,42,64,86)):
        w=13-h*0.1;s+='<path d="M%.1f %.1f H%.1f"></path>'%(bx-w,by-h,bx+w)
    s+='<path d="M%.1f %.1f L%.1f %.1f M%.1f %.1f L%.1f %.1f M%.1f %.1f L%.1f %.1f M%.1f %.1f L%.1f %.1f"></path>'%(bx-11,by-20,bx+9,by-42,bx+11,by-20,bx-9,by-42,bx-9,by-42,bx+7,by-64,bx+9,by-42,bx-7,by-64)
    s+='<path d="M%.1f %.1f H%.1f M%.1f %.1f H%.1f"></path>'%(bx-24,by-86,bx+24,bx-18,by-72,bx+18) if False else '<path d="M%.1f %.1f H%.1f M%.1f %.1f H%.1f"></path>'%(bx-24,by-86,bx+24,bx-18,by-72,bx+18)
    s+='</g>'
    s+='<g fill="#c8d6de"><rect x="%.1f" y="%.1f" width="3" height="6" rx="1"></rect><rect x="%.1f" y="%.1f" width="3" height="6" rx="1"></rect></g>'%(bx-22.5,by-86,bx+19.5,by-86)
    return s,(bx-21,by-80)

def flow(pid,d,kind,speed,width):
    col={'grid':('#48B9E8','#2c5b6e','#CDEFFB','#EAF8FD'),'gen':('#F0A542','#6b4a1d','#FFD9A0','#FFE7C2')}[kind]
    dur={'fast':'1s','mid':'1.6s','slow':'2.4s'}[speed]
    s='<path id="%s" d="%s" fill="none" stroke="%s" stroke-opacity=".5" stroke-width="%s" filter="url(#f-glow)"></path>'%(pid,d,col[0],width*3.4)
    s+='<path d="%s" fill="none" stroke="%s" stroke-width="%s"></path>'%(d,col[1],width)
    s+='<path class="fl %s" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"></path>'%(speed,d,col[2],width*0.9)
    s+='<circle r="%s" fill="%s" filter="url(#f-dot)"><animateMotion dur="%s" repeatCount="indefinite"><mpath href="#%s"></mpath></animateMotion></circle>'%(width*1.3,col[3],dur,pid)
    s+='<circle r="%s" fill="%s"><animateMotion dur="%s" begin="-%.2fs" repeatCount="indefinite"><mpath href="#%s"></mpath></animateMotion></circle>'%(width*.8,col[3],dur,float(dur[:-1])/2,pid)
    return s
def catmull(pts):
    d='M%.1f %.1f'%pts[0]
    for i in range(len(pts)-1):
        p0=pts[i-1] if i>0 else pts[i];p1=pts[i];p2=pts[i+1];p3=pts[i+2] if i+2<len(pts) else pts[i+1]
        c1=(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6);c2=(p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6)
        d+=' C %.1f %.1f %.1f %.1f %.1f %.1f'%(c1[0],c1[1],c2[0],c2[1],p2[0],p2[1])
    return d
def wallcharger(v,x,y,z,face):
    o=[]
    if face=='y':
        F=lambda a,b,c:v.p(x+a,y+c,z+b)  # a along x, b up, c out of wall
        fr=[(-4,0,2.4),(4,0,2.4),(4,12,2.4),(-4,12,2.4)];sd=[(4,0,0),(4,0,2.4),(4,12,2.4),(4,12,0)];tp=[(-4,12,0),(4,12,0),(4,12,2.4),(-4,12,2.4)]
        P=lambda q:'M'+' L'.join('%.1f %.1f'%F(*t) for t in q)+' Z'
        o.append('<path d="%s" fill="#2a3530"></path>'%P(sd))
        o.append('<path d="%s" fill="#cfd6d2"></path>'%P(tp))
        o.append('<path d="%s" fill="url(#g-wbx)"></path>'%P(fr))
        o.append('<path d="%s" fill="#0d1311"></path>'%P([(-2.6,6.2,2.5),(2.6,6.2,2.5),(2.6,10,2.5),(-2.6,10,2.5)]))
        cx,cy=F(0,4,2.5)
        o.append('<circle cx="%.1f" cy="%.1f" r="2.1" fill="none" stroke="#A8D957" stroke-width="1.1"><animate attributeName="stroke-opacity" values=".35;1;.35" dur="1.8s" repeatCount="indefinite"></animate></circle>'%(cx,cy))
        o.append('<circle cx="%.1f" cy="%.1f" r="5" fill="#A8D957" opacity=".25" filter="url(#f-soft)"><animate attributeName="opacity" values=".1;.35;.1" dur="1.8s" repeatCount="indefinite"></animate></circle>'%(cx,cy))
        a,b=F(-1.3,8.3,2.6);o.append('<path d="M%.1f %.1f l3 1.6" stroke="#A8D957" stroke-width="1.1" stroke-linecap="round"></path>'%(a,b))
        return '\n'.join(o),(x,y+2.4,z)
    return '',(x,y,z)
def ev_charge(v,way,portw,port):
    qx,qy,qz=portw
    w=list(way)+[(qx,qy,qz)]
    pts=[v.p(*q) for q in w];d=catmull(pts)
    sh=catmull([v.p(q[0]+1.5,q[1]+1.5,0) for q in w[1:-1]])
    (x1,y1),(x2,y2)=pts[0],pts[-1]
    o=['<linearGradient id="g-ev" gradientUnits="userSpaceOnUse" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"><stop offset="0%%" stop-color="#48B9E8"></stop><stop offset="100%%" stop-color="#A8D957"></stop></linearGradient>'%(x1,y1,x2,y2),
       '<linearGradient id="g-evc" gradientUnits="userSpaceOnUse" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"><stop offset="0%%" stop-color="#E2F6FD"></stop><stop offset="100%%" stop-color="#F0FFD8"></stop></linearGradient>'%(x1,y1,x2,y2)]
    o.append('<path d="%s" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" filter="url(#f-soft)"></path>'%sh)
    o.append('<path d="%s" fill="none" stroke="url(#g-ev)" stroke-opacity=".55" stroke-width="10" stroke-linecap="round" filter="url(#f-glow)"></path>'%d)
    o.append('<path id="ev-path" d="%s" fill="none" stroke="#1a2024" stroke-width="3.6" stroke-linecap="round"></path>'%d)
    o.append('<path d="%s" fill="none" stroke="#5c6870" stroke-width="1" stroke-linecap="round" stroke-opacity=".7" transform="translate(-.6 -.8)"></path>'%d)
    o.append('<path class="fl evd" d="%s" fill="none" stroke="url(#g-evc)" stroke-width="1.5" stroke-linecap="round" filter="url(#f-dotsm)"></path>'%d)
    for i,b in enumerate((0,.45,.9)):
        o.append('<circle r="%s" fill="#F4FFE6" filter="url(#f-dot)"><animateMotion dur="1.35s" begin="-%ss" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .6 1"><mpath href="#ev-path"></mpath></animateMotion></circle>'%((2.8,2.2,1.8)[i],b))
    # plug + port glow + ripples in the car side plane
    px,py=port
    o.append('<circle cx="%.1f" cy="%.1f" r="9" fill="#A8D957" opacity=".35" filter="url(#f-glow)"><animate attributeName="opacity" values=".2;.5;.2" dur="1.6s" repeatCount="indefinite"></animate></circle>'%(px,py))
    ring=lambda rr:'M'+' L'.join('%.2f %.2f'%(v.p(qx+rr*math.cos(2*math.pi*i/24),qy+.6,qz+rr*math.sin(2*math.pi*i/24))[0]-px,v.p(qx+rr*math.cos(2*math.pi*i/24),qy+.6,qz+rr*math.sin(2*math.pi*i/24))[1]-py) for i in range(24))+' Z'
    for b in (0,.9):
        o.append('<g transform="translate(%.1f %.1f)"><path d="%s" fill="none" stroke="#C4E58A" stroke-width="1"><animateTransform attributeName="transform" type="scale" values=".5;2.4" dur="1.8s" begin="%ss" repeatCount="indefinite"></animateTransform><animate attributeName="stroke-opacity" values=".9;0" dur="1.8s" begin="%ss" repeatCount="indefinite"></animate></path></g>'%(px,py,ring(3.2),b,b))
    o.append('<path d="%s" fill="#11171a" stroke="#6d7a82" stroke-width=".7"></path>'%('M'+' L'.join('%.1f %.1f'%(v.p(qx+3*math.cos(2*math.pi*i/20),qy+.7,qz+3*math.sin(2*math.pi*i/20))) for i in range(20))+' Z'))
    o.append('<circle cx="%.1f" cy="%.1f" r="1.3" fill="#E8FFC8"></circle>'%(px,py))
    return '\n'.join(o)
def dead(d):return '<path d="%s" fill="none" stroke="#3a463f" stroke-width="1.2" stroke-dasharray="2 5"></path>'%d
def curve(v,a,b,lift=0):
    (x1,y1),(x2,y2)=v.p(*a),v.p(*b);mx,my=(x1+x2)/2,(y1+y2)/2+lift
    return 'M%.1f %.1f Q %.1f %.1f %.1f %.1f'%(x1,y1,mx,my,x2,y2)
def T(x,y,txt,col='#65736A',size=11,w=None,ls=None):
    size=round(size/1.25,1)
    return '<text x="%.1f" y="%.1f" text-anchor="middle" fill="%s" font-size="%s"%s%s font-family="Inter, sans-serif">%s</text>'%(x,y,col,size,' font-weight="%s"'%w if w else '',' letter-spacing="%s"'%ls if ls else '',txt)

DEFS='''<defs>
<filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"></feGaussianBlur></filter>
<filter id="f-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"></feGaussianBlur></filter>
<filter id="f-dot" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8"></feGaussianBlur></filter>
<filter id="f-big" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"></feGaussianBlur></filter>
<linearGradient id="g-wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2e3a34"></stop><stop offset="100%" stop-color="#1c2521"></stop></linearGradient>
<linearGradient id="g-ws" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a4842"></stop><stop offset="100%" stop-color="#25302b"></stop></linearGradient>
<linearGradient id="g-roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55433a"></stop><stop offset="100%" stop-color="#33292400"></stop><stop offset="100%" stop-color="#332924"></stop></linearGradient>
<linearGradient id="g-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFE6B0"></stop><stop offset="100%" stop-color="#E9B866"></stop></linearGradient>
<linearGradient id="g-cside" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6b757c"></stop><stop offset="45%" stop-color="#4a5359"></stop><stop offset="100%" stop-color="#2a3035"></stop></linearGradient>
<linearGradient id="g-ctop" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8d979e"></stop><stop offset="100%" stop-color="#5a646a"></stop></linearGradient>
<linearGradient id="g-cfront" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4f585e"></stop><stop offset="100%" stop-color="#22282c"></stop></linearGradient>
<linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#34505e"></stop><stop offset="60%" stop-color="#121c22"></stop><stop offset="100%" stop-color="#0b1114"></stop></linearGradient>
<linearGradient id="g-roofhl" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#9EDCF5" stop-opacity="0"></stop><stop offset="50%" stop-color="#9EDCF5" stop-opacity=".35"></stop><stop offset="100%" stop-color="#9EDCF5" stop-opacity="0"></stop></linearGradient>
<linearGradient id="g-wbx" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#eef2ef"></stop><stop offset="100%" stop-color="#b8c1bc"></stop></linearGradient>
<linearGradient id="g-strip" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#6fa83a"></stop><stop offset="100%" stop-color="#C4E58A"></stop></linearGradient>
<linearGradient id="g-crear" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b4349"></stop><stop offset="100%" stop-color="#1b2024"></stop></linearGradient>
<filter id="f-dotsm" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".5"></feGaussianBlur></filter>
<radialGradient id="g-rim" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="#9aa4aa"></stop><stop offset="100%" stop-color="#4a5257"></stop></radialGradient>
<linearGradient id="g-sttop" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4b5852"></stop><stop offset="100%" stop-color="#36423c"></stop></linearGradient>
<linearGradient id="g-stfront" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c3631"></stop><stop offset="100%" stop-color="#1a211d"></stop></linearGradient>
<linearGradient id="g-stside" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#36423c"></stop><stop offset="100%" stop-color="#232b27"></stop></linearGradient>
</defs>'''

def scene(layout,state):
    out=[];v=V((178,214))
    grid=state=='grid';gen_on=not grid
    if layout=='L1':
        H0=(0,0);G0=(-112,4);ST0=(4,96);CAR0=(104,22);PY=(286,212)
    else:
        H0=(0,0);G0=(-112,4);ST0=(110,30);CAR0=(-2,98);PY=(286,212)
    # ground + light pools
    out.append('<g stroke="#18201c" stroke-width="1">'+''.join('<path d="%s"></path>'%v.d([(-120,y,0),(220,y,0)],False) for y in (-40,40,120,200) )+''.join('<path d="%s"></path>'%v.d([(x,-120,0),(x,200,0)],False) for x in (-40,40,120,200))+'</g>')
    hx,hy=v.p(48,36,0)
    out.append('<ellipse cx="%.1f" cy="%.1f" rx="130" ry="50" fill="#E9B866" opacity=".13" filter="url(#f-big)"></ellipse>'%(hx,hy+20))
    if gen_on:
        gx,gy=v.p(G0[0]+17,G0[1]+12,0);out.append('<ellipse cx="%.1f" cy="%.1f" rx="60" ry="22" fill="#F0A542" opacity=".16" filter="url(#f-big)"></ellipse>'%(gx,gy))
    py_svg,arm=pylon(*PY,live=grid)
    # wire: from pylon arm to house gable (right wall top area)
    wire_end=v.p(96,14,52)
    wd='M%.1f %.1f Q %.1f %.1f %.1f %.1f'%(arm[0],arm[1],(arm[0]+wire_end[0])/2,(arm[1]+wire_end[1])/2+18,wire_end[0],wire_end[1])
    cs,port,portw=car(v,*CAR0,charging=grid,flip=(layout=='L2'))
    items=[]
    items.append((G0[0]+G0[1],generator(v,*G0,on=gen_on)))
    items.append((-999 if layout=='L1' else -998,py_svg))
    items.append((48+36,house(v,*H0,lit=True)))
    items.append((CAR0[0]+CAR0[1]+40,cs))
    items.append((ST0[0]+ST0[1]+20,station(v,*ST0)))
    items.sort(key=lambda t:t[0])
    # cables (drawn before objects in front, after objects behind): simplest -> draw flows above ground, then objects
    flows=[];ev='';late_wb=''
    if layout=='L1':
        wb=(96,60,0);gen_out=(G0[0]+34,G0[1]+16,4);house_in=(0,64,3);st_in=(ST0[0]+8,ST0[1]+4,3)
        hs_from=(14,72,1)
    else:
        wb=(30,72,0);gen_out=(G0[0]+34,G0[1]+16,4);house_in=(0,64,3);st_in=(ST0[0]+4,ST0[1]+6,3);hs_from=(96,40,1)
    if grid:
        flows.append(flow('w-%s'%layout,wd,'grid','mid',1.6))
        flows.append(flow('hs-%s'%layout,curve(v,hs_from,st_in,10),'grid','slow',1.8))
        if layout=='L2':
            wbs,wstart=wallcharger(v,92,72,10,'y');late_wb=wbs;qx,qy,qz=portw
            ev=ev_charge(v,[(92,74.6,10),(92,77.5,4),(93,85,1),(92,104,.6),(89,128,.8),(qx+9,qy+3.5,1.2),(qx+2.5,qy+1.2,9)],portw,port)
        else:
            cpx,cpy=port;a=v.p(*wb);ev=''
            flows.append(flow('hc-%s'%layout,'M%.1f %.1f Q %.1f %.1f %.1f %.1f'%(a[0],a[1],(a[0]+cpx)/2,(a[1]+cpy)/2+16,cpx,cpy),'grid','fast',2.2))
        flows.append(dead(curve(v,gen_out,house_in,12)))
    else:
        flows.append(dead(wd))
        flows.append(flow('gh-%s'%layout,curve(v,gen_out,house_in,12),'gen','mid',2.4))
        flows.append(flow('gs-%s'%layout,curve(v,gen_out,st_in,22),'gen','slow',2.2))
    # draw: ground, behind objects (generator/pylon), flows, rest
    behind=[s for d,s in items if d<48+36 and 'class="smk' not in s or (d<48+36)]
    for d,s in items:
        if d<0: out.append(s)
    for d,s in items:
        if 0>d: continue
        if s.startswith('<g') and d<48+36: out.append(s)
    out+=flows
    for d,s in items:
        if d>=48+36: out.append(s)
    # wallbox
    if late_wb: out.append(late_wb)
    elif layout=='L1': out.append(wallbox(v,96,60,14,'x'))
    else: out.append(wallcharger(v,92,72,10,'y')[0])
    if ev: out.append(ev)
    if ev:
        bx,by=port[0]+14,port[1]-50
        out.append('<g transform="translate(%.1f %.1f)"><rect x="-27" y="-10" width="54" height="17" rx="8.5" fill="#101613" stroke="#A8D957" stroke-opacity=".6" stroke-width=".8"></rect><path d="M-17 -6 L-21 0.5 H-17.6 L-19 5 L-14 -1.6 H-17.4 Z" fill="#C4E58A"></path><text x="5" y="2.6" text-anchor="middle" fill="#F1F5F2" font-size="7.6" font-weight="600" font-family="Inter, sans-serif">7,2 кВт</text></g>'%(bx,by))
    # labels
    sx,sy=v.p(ST0[0]+21,ST0[1]+13,0);out.append(T(sx,sy+30,'72%','#C4E58A',14,600));out.append(T(sx,sy+46,'+549 Вт' if grid else '+910 Вт від генератора'))
    cx,cy=v.p(CAR0[0]+41,CAR0[1]+17,0);out.append(T(cx,cy+34,'64%','#C4E58A',14,600));out.append(T(cx,cy+50,'+7,2 кВт' if grid else 'не заряджається'))
    gx,gy=v.p(G0[0]+17,G0[1]+12,0);out.append(T(gx,gy-52,'ГЕНЕРАТОР','#F3BA70' if gen_on else '#65736A',10.5,None,1));out.append(T(gx,gy-40,'працює · бак 82%' if gen_on else 'вимкнено','#F3BA70' if gen_on else '#65736A',10.5))
    out.append(T(PY[0],PY[1]-118,'МЕРЕЖА','#72C9ED' if grid else '#65736A',10.5,None,1))
    if not grid: out.append(T(PY[0],PY[1]-104,'немає','#65736A',10.5))
    return '<g transform="translate(-52 4) scale(1.25)">'+'\n'.join(out)+'</g>'

def page(title,layout,state,head,sub,note):
    body=scene(layout,state)
    dot='#48B9E8' if state=='grid' else '#F0A542'
    return '''<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<title>%s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
body{margin:0}
@keyframes k-flick{0%%,100%%{opacity:.86}50%%{opacity:1}}
@keyframes k-dash{to{stroke-dashoffset:-40}}
@keyframes k-smoke{0%%{opacity:.5;transform:translate(0,0) scale(.6)}100%%{opacity:0;transform:translate(8px,-22px) scale(1.9)}}
.win{animation:k-flick 4.5s ease-in-out infinite}
.fl{stroke-dasharray:8 32;animation:k-dash 1.6s linear infinite}
.fl.fast{animation-duration:.9s}.fl.slow{animation-duration:2.4s}
.fl.evd{stroke-dasharray:3 17;animation-duration:.8s;opacity:.85}
.smk{transform-box:fill-box;transform-origin:center;animation:k-smoke 2.8s ease-out infinite}
.smk.b{animation-delay:1.4s}
</style>
</helmet>
<div style="width: 390px; height: 844px; box-sizing: border-box; background: linear-gradient(180deg, #0b100e 0%%, #090D0B 55%%, #0b1210 100%%); color: #F1F5F2; font-family: Inter, system-ui, sans-serif; display: flex; flex-direction: column; padding: 28px 20px 24px; gap: 8px; overflow: hidden">
  <div style="display: flex; justify-content: space-between; align-items: center">
    <div style="font-size: 13px; letter-spacing: .14em; font-weight: 700">BLACKOUT</div>
    <div style="font-size: 12.5px; color: #A0ADA4; display: flex; align-items: center; gap: 6px"><span style="width: 7px; height: 7px; border-radius: 50%%; background: %s; box-shadow: 0 0 10px %s"></span>%s</div>
  </div>
  <div style="margin-top: 10px">
    <div style="font-size: 13px; color: #A0ADA4">%s</div>
  </div>
  <svg viewBox="0 0 350 500" width="350" height="500" role="img" aria-label="%s" style="margin-top: 4px">
%s
%s
  </svg>
  <div style="margin-top: auto; font-size: 12.5px; color: #A0ADA4; line-height: 1.5">%s</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
'''%(title,dot,dot,head,sub,note.replace('"',''),DEFS,body,note)

boards=[
 ('L1grid.dc.html','1 · Генератор за домом · світло є','L1','grid','Мережа · 8,9 кВт','Дім живиться від мережі','Струм іде з опори по дроту в дім, від дому — до станції і до зарядної коробки на стіні, звідки кабель до машини на під’їзді. Генератор стоїть за домом і вимкнений.'),
 ('L1out.dc.html','2 · Генератор за домом · відключення','L1','out','Відключення · генератор','Дім живиться від генератора','Мережі немає: дріт від опори згас. Генератор за домом працює, димить, живить дім і заряджає станцію. Машина не заряджається.'),
 ('L2grid.dc.html','3 · Авто біля ґанку · світло є','L2','grid','Мережа · 8,9 кВт','Дім живиться від мережі','Інша розстановка: машина стоїть перед будинком біля ґанку, станція — праворуч під стіною, генератор позаду ліворуч, опора праворуч.'),
 ('L2out.dc.html','4 · Авто біля ґанку · відключення','L2','out','Відключення · генератор','Дім живиться від генератора','Та сама розстановка під час відключення: генератор живить дім і заряджає станцію.'),
]
import os
if __name__=='__main__':
  root=sys.argv[1];  os.makedirs(root+'/project',exist_ok=True)
  for f,t,l,s,h,sub,n in boards:
    open(root+'/project/'+f,'w').write(page(t,l,s,h,sub,n))
  print('ok')
