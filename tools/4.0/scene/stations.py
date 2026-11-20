"""Brand-styled power stations for the home scene. Generic shapes in each brand's colour scheme,
no logos or wordmarks. Same footprint and AC socket position as the original, so the cable fits all."""
import math
from scene import E

def _shade(c,k):
    c=c.lstrip('#');r,g,b=int(c[0:2],16),int(c[2:4],16),int(c[4:6],16)
    f=lambda x:max(0,min(255,int(x*k)))
    return '#%02x%02x%02x'%(f(r),f(g),f(b))

STYLES={
 # body, front panel, accent, handle type, display colour, height
 'fossibot':dict(body='#3c4842',front=None,acc='#A8D957',handle='slots',disp='#A8D957',H=28),
 'ecoflow': dict(body='#c3c8cb',front='#16191b',acc='#e9eef0',handle='bars',disp='#e9eef0',H=28),
 'bluetti': dict(body='#2c3035',front='#1a1d21',acc='#6fb6ff',handle='side',disp='#6fb6ff',H=30),
 'jackery': dict(body='#4a4f53',front='#2f3337',acc='#f28c28',handle='arch',disp='#f2f4f5',H=26),
 'anker':   dict(body='#dfe2e3',front='#202426',acc='#4fb3ff',handle='bridge',disp='#bfe6ff',H=28),
 'must':    dict(body='#eef0ef',front='#d5d9d8',acc='#3f8fd6',handle='rack',disp='#1d2a33',H=40),
 'generic': dict(body='#4a504d',front=None,acc='#b9c2bd',handle='slots',disp='#b9c2bd',H=28),
}

def station(v,x0,y0,style='fossibot'):
    if style=='fossibot':
        import scene as _M;return _M.station(v,x0,y0)
    s=STYLES[style];L,W,H,r=42,26,s['H'],3.2;X=lambda x:x0+x;Y=lambda y:y0+y;o=[]
    o.append('<ellipse cx="%.1f" cy="%.1f" rx="36" ry="10" fill="#000" opacity=".55" filter="url(#f-soft)"></ellipse>'%v.p(X(L/2),Y(W/2),0))
    def rr(a0,a1,z0,z1,fix,face,rad=r):
        pts=[]
        for c1,c2,ang in ((a1-rad,z1-rad,0),(a0+rad,z1-rad,90),(a0+rad,z0+rad,180),(a1-rad,z0+rad,270)):
            for i in range(5):
                an=math.radians(ang+i*22.5);u,w=c1+rad*math.cos(an),c2+rad*math.sin(an)
                pts.append((X(u),Y(fix),w) if face=='y' else (X(fix),Y(u),w))
        return pts
    body=s['body'];top=_shade(body,1.12);side=_shade(body,.72);front=body
    tp=[(X(r),Y(0),H),(X(L-r),Y(0),H),(X(L),Y(r),H),(X(L),Y(W-r),H),(X(L-r),Y(W),H),(X(r),Y(W),H),(X(0),Y(W-r),H),(X(0),Y(r),H)]
    o.append(E('path',d=v.d(tp),fill=top))
    o.append(E('path',d=v.d(rr(0,W,0,H,L,'x')),fill=side,stroke=_shade(body,.5),stroke_width='.6'))
    o.append(E('path',d=v.d(rr(0,L,0,H,W,'y')),fill=front,stroke=_shade(body,.5),stroke_width='.6'))
    # subtle top highlight on the front edge
    o.append(E('path',d=v.d([(X(r),Y(W),H-.3),(X(L-r),Y(W),H-.3)],False),stroke='#ffffff',stroke_opacity='.35',stroke_width='.8',fill='none'))
    # front panel (dark inset) where the brand uses one
    if s['front']:
        o.append(E('path',d=v.d(rr(2.2,L-2.2,2.2,H-2.6,W+.08,'y',2.2)),fill=s['front']))
    # handles
    hd=s['handle']
    if hd=='slots':
        for hx in (5,L-11):
            o.append(E('path',d=v.d([(X(hx),Y(6),H),(X(hx+6),Y(6),H),(X(hx+6),Y(W-6),H),(X(hx),Y(W-6),H)]),fill='#0c110f'))
            o.append(E('path',d=v.d([(X(hx+1),Y(6.5),H+2.6),(X(hx+5),Y(6.5),H+2.6),(X(hx+5),Y(W-6.5),H+2.6),(X(hx+1),Y(W-6.5),H+2.6)]),fill=_shade(body,1.35)))
    elif hd=='bars':
        for hx in (2.5,L-7.5):
            o.append(E('path',d=v.d([(X(hx),Y(2.5),H+3),(X(hx+5),Y(2.5),H+3),(X(hx+5),Y(W-2.5),H+3),(X(hx),Y(W-2.5),H+3)]),fill='#1c2023'))
            o.append(E('path',d=v.d([(X(hx),Y(W-2.5),H),(X(hx+5),Y(W-2.5),H),(X(hx+5),Y(W-2.5),H+3),(X(hx),Y(W-2.5),H+3)]),fill='#101315'))
            o.append(E('path',d=v.d([(X(hx+5),Y(2.5),H),(X(hx+5),Y(W-2.5),H),(X(hx+5),Y(W-2.5),H+3),(X(hx+5),Y(2.5),H+3)]),fill='#0b0d0e'))
    elif hd=='arch':
        c=s['acc'];yy=W/2
        for col,w in ((_shade(c,.6),3.6),(c,2.2)):
            o.append(E('path',d=v.d([(X(7),Y(yy),H),(X(7),Y(yy),H+6),(X(35),Y(yy),H+6),(X(35),Y(yy),H)],False),fill='none',stroke=col,stroke_width=str(w),stroke_linejoin='round',stroke_linecap='round'))
        for hx in (7,35):
            o.append(E('path',d=v.cxz(X(hx),Y(yy),H,1.8,12),fill=_shade(c,.5)))
    elif hd=='bridge':
        hc=_shade(body,.8)
        for hx in (2.5,L-7.5):
            o.append(E('path',d=v.d([(X(hx),Y(2.5),H+3),(X(hx+5),Y(2.5),H+3),(X(hx+5),Y(W-2.5),H+3),(X(hx),Y(W-2.5),H+3)]),fill=_shade(body,.95)))
            o.append(E('path',d=v.d([(X(hx),Y(W-2.5),H),(X(hx+5),Y(W-2.5),H),(X(hx+5),Y(W-2.5),H+3),(X(hx),Y(W-2.5),H+3)]),fill=hc))
            o.append(E('path',d=v.d([(X(hx+5),Y(2.5),H),(X(hx+5),Y(W-2.5),H),(X(hx+5),Y(W-2.5),H+3),(X(hx+5),Y(2.5),H+3)]),fill=_shade(body,.65)))
    elif hd=='side':
        for yy in (8,W-8):
            o.append(E('path',d=v.d([(X(L)+.1,Y(yy-2.5),H-6),(X(L)+.1,Y(yy+2.5),H-6),(X(L)+.1,Y(yy+2.5),H-3),(X(L)+.1,Y(yy-2.5),H-3)]),fill='#0c0e10'))
        o.append(E('path',d=v.d([(X(6),Y(6),H+.1),(X(L-6),Y(6),H+.1),(X(L-6),Y(W-6),H+.1),(X(6),Y(W-6),H+.1)]),fill=_shade(body,.85)))
    elif hd=='rack':
        for z in (H*.33,H*.66):
            o.append(E('path',d=v.d([(X(2),Y(W)+.1,z),(X(L-2),Y(W)+.1,z)],False),stroke='#b9bfbe',stroke_width='.7',fill='none'))
        for yy in (5,W-5):
            o.append(E('path',d=v.d([(X(L)+.1,Y(yy),6),(X(L)+.1,Y(yy),H-6)],False),stroke='#a9b0ae',stroke_width='1.4',stroke_linecap='round',fill='none'))
    # display (top-left of the front)
    dz1,dz0=(H-2,H-11) if style!='must' else (H-4,H-14)
    o.append(E('path',d=v.d([(X(4),Y(W)+.15,dz1),(X(17),Y(W)+.15,dz1),(X(17),Y(W)+.15,dz0),(X(4),Y(W)+.15,dz0)]),fill='#070b09',stroke=_shade(body,.6),stroke_width='.5'))
    dc=s['disp']
    o.append(E('path',d=v.d([(X(5.5),Y(W)+.25,dz0+3.5),(X(13),Y(W)+.25,dz0+3.5),(X(13),Y(W)+.25,dz0+1.6),(X(5.5),Y(W)+.25,dz0+1.6)]),fill=dc))
    o.append(E('path',d=v.d([(X(5.5),Y(W)+.25,dz0+7.5),(X(10),Y(W)+.25,dz0+7.5),(X(10),Y(W)+.25,dz0+5.5),(X(5.5),Y(W)+.25,dz0+5.5)]),fill=dc,opacity='.75'))
    # accent strip
    if style in ('ecoflow','bluetti','anker'):
        o.append(E('path',d=v.d([(X(20),Y(W)+.2,H-4),(X(L-4),Y(W)+.2,H-4)],False),stroke=s['acc'],stroke_width='1',stroke_opacity='.8',fill='none'))
    if style=='jackery':
        o.append(E('path',d=v.d([(X(0),Y(W)+.12,H-1.2),(X(L),Y(W)+.12,H-1.2)],False),stroke=s['acc'],stroke_width='1.6',fill='none'))
    # AC sockets — same place on every model (the house cable plugs into the first one)
    sk='#0c110f' if s['front'] is None or style=='must' else '#05070a'
    for sx in (24.5,34.5):
        o.append(E('path',d=v.cxz(X(sx),Y(W)+.2,13,4.3,24),fill=sk,stroke=_shade(body,1.2) if s['front'] is None else '#59665f',stroke_width='.7'))
        for dd in (-1.5,1.5):
            a,b=v.p(X(sx+dd),Y(W)+.3,13);o.append('<circle cx="%.1f" cy="%.1f" r=".75" fill="#9aa7a0"></circle>'%(a,b))
    # USB row + power button
    for ux in (5,9,13):
        o.append(E('path',d=v.d([(X(ux),Y(W)+.2,8.4),(X(ux+2.6),Y(W)+.2,8.4),(X(ux+2.6),Y(W)+.2,6.8),(X(ux),Y(W)+.2,6.8)]),fill='#0c110f',stroke='#59665f',stroke_width='.4'))
    o.append(E('path',d=v.cxz(X(9.5),Y(W)+.2,12.6,2,16),fill='none',stroke=s['acc'],stroke_width='.9'))
    # side vents
    for i in range(5 if H<35 else 8):
        z=8+i*2.6;o.append(E('path',d=v.d([(X(L)+.1,Y(6),z),(X(L)+.1,Y(W-6),z)],False),stroke=_shade(side,.6),stroke_width='1.1',stroke_linecap='round',fill='none'))
    return '\n'.join(o)

BRAND_RE=[('fossibot',r'fossibot|power-'),('ecoflow',r'ecoflow|delta|river'),('bluetti',r'bluetti|ac\d|eb\d|elite'),('jackery',r'jackery|explorer'),
          ('anker',r'anker|solix'),('must',r'\bmust\b|hbp|em1024')]
