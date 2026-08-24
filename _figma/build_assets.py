"""Split the Figma-traced screen exports into per-layer / per-card SVGs.

root.svg  -> src/assets/scene/*  + src/assets/frame/corner.svg   (hero)
root2.svg -> src/assets/episodes/*                              (episode cards)
"""
import xml.etree.ElementTree as ET, re, os
HERE=os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
SVG='http://www.w3.org/2000/svg'; XLINK='http://www.w3.org/1999/xlink'
ET.register_namespace('', SVG); ET.register_namespace('xlink', XLINK)
NS='{%s}'%SVG
OUT='../src/assets'

defmap={}
kids=[]

def load(src):
    """Point the module at one exported screen. Returns its top-level children."""
    global defmap, kids
    root=ET.parse(src).getroot()
    main=[c for c in root if c.tag==NS+'g'][0]
    defs=[c for c in root if c.tag==NS+'defs']
    defmap={c.get('id'):c for d in defs for c in d if c.get('id')}
    kids=list(main)
    return kids

REF=re.compile(r'url\(#([^)]+)\)')
NUM=re.compile(r'-?\d*\.?\d+(?:e-?\d+)?')

def refs_in(el,out):
    for k,v in el.attrib.items():
        for m in REF.finditer(v or ''): out.add(m.group(1))
        if k.endswith('href') and (v or '').startswith('#'): out.add(v[1:])
    for c in el: refs_in(c,out)
    return out

def collect_defs(els):
    need=set()
    for e in els: refs_in(e,need)
    seen=set()
    while True:
        new=set()
        for i in need-seen:
            if i in defmap: refs_in(defmap[i],new)
        seen|=need; need|=new
        if not new-seen: break
    return [defmap[i] for i in defmap if i in need]

# --- transform-aware bbox -------------------------------------------------
def parse_transform(s):
    m=(1,0,0,1,0,0)
    if not s: return m
    for fn,args in re.findall(r'(\w+)\s*\(([^)]*)\)', s):
        a=[float(x) for x in NUM.findall(args)]
        if fn=='translate': t=(1,0,0,1,a[0],a[1] if len(a)>1 else 0)
        elif fn=='scale':   t=(a[0],0,0,a[1] if len(a)>1 else a[0],0,0)
        elif fn=='matrix':  t=tuple(a[:6])
        else: continue
        m=(m[0]*t[0]+m[2]*t[1], m[1]*t[0]+m[3]*t[1],
           m[0]*t[2]+m[2]*t[3], m[1]*t[2]+m[3]*t[3],
           m[0]*t[4]+m[2]*t[5]+m[4], m[1]*t[4]+m[3]*t[5]+m[5])
    return m

def apply(m,x,y): return (m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5])

def bbox(el, m=(1,0,0,1,0,0), acc=None):
    if acc is None: acc=[]
    m=parse_transform(el.get('transform')) if el.get('transform') else m
    if el.get('transform'):
        p=parse_transform(el.get('transform'))
        m=(m[0],m[1],m[2],m[3],m[4],m[5])
    tag=el.tag.replace(NS,''); pts=[]
    if tag=='path' and el.get('d'):
        n=[float(v) for v in NUM.findall(el.get('d'))]
        pts=list(zip(n[0::2],n[1::2]))
    elif tag=='rect':
        x,y=float(el.get('x',0)),float(el.get('y',0))
        w,h=float(el.get('width',0)),float(el.get('height',0))
        pts=[(x,y),(x+w,y+h)]
    elif tag in ('circle','ellipse'):
        cx,cy=float(el.get('cx',0)),float(el.get('cy',0))
        rx=float(el.get('rx') or el.get('r') or 0); ry=float(el.get('ry') or el.get('r') or 0)
        pts=[(cx-rx,cy-ry),(cx+rx,cy+ry)]
    for p in pts: acc.append(apply(m,*p))
    for c in el: bbox(c,m,acc)
    return acc

def box(el):
    m=parse_transform(el.get('transform'))
    pts=bbox(el,m)
    if not pts: return None
    xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
    return (min(xs),min(ys),max(xs),max(ys))

def hits(b,w):
    return b and not (b[2]<w[0] or b[0]>w[2] or b[3]<w[1] or b[1]>w[3])

# The artboard reserves a margin around the illustration for the frame that used
# to be baked into it (top 48, right 49, bottom 73, left 52 px of rail + black).
# Scene layers are cut to the inside of that rail so the web frame — which is
# thinner and lives on the viewport edge — has no black gap to cover.
CONTENT = (52, 48, 1495, 903)

def write(path, idxs, viewbox='0 0 1596 1024', size=(1596,1024), window=None):
    els=[kids[i] for i in idxs]
    if window: els=[e for e in els if hits(box(e),window)]
    svg=ET.Element(NS+'svg',{'width':str(size[0]),'height':str(size[1]),
                             'viewBox':viewbox,'fill':'none'})
    d=ET.SubElement(svg,NS+'defs')
    for dn in collect_defs(els): d.append(dn)
    if not len(d): svg.remove(d)
    for e in els: svg.append(e)
    os.makedirs(os.path.dirname(path),exist_ok=True)
    ET.ElementTree(svg).write(path,encoding='utf-8',xml_declaration=False)
    print(os.path.basename(path).ljust(24), len(els),'els', os.path.getsize(path)//1024,'KB')

FRAME=list(range(116,150))+[153,154,155,156]+list(range(182,205))

SCENE=[  # (filename, indices)  -- back to front, matches Figma paint order
 ('net',              list(range(1,111))+[181]),
 ('nebula-left',      [111]),
 ('nebula-right',     [112]),
 ('court',            [113]),
 ('cloud-left',       [114]),
 ('cloud-right',      [115]),
 ('badge',            [150]),
 ('foliage-right',    [151]),
 ('foliage-left',     [152]),
 ('stars',            [157+i for i in range(24)]),
 ('player-basketball',[205]),
 ('player-cricket',   [206]),
 ('banner-right',     [207]),
 ('banner-left',      [208]),
 ('flags',            [209]),
]
load('root.svg')
VB = '%d %d %d %d' % CONTENT
for name,idx in SCENE:
    write(f'{OUT}/scene/{name}.svg', idx, viewbox=VB, size=CONTENT[2:])

# frame corner: top-left medallion + inner bracket, cropped by viewBox
W=(8,18,132,232)
write(f"{OUT}/frame/corner.svg", FRAME, viewbox="12 24 120 208", size=(120,208), window=W)

# --- screen 2: the episode cards -----------------------------------------
# Five 248x379 frames on a 310px pitch. Each is cropped to its own frame rect
# so the card SVG carries no page coordinates and drops straight into a grid.
# Index 0 is the background gradient and 1 the outlined headline; both are
# rebuilt in CSS / live text instead, so only 2..6 are exported.
CARDS = [('spin-ignite', 2), ('sky-smash', 3), ('crick-stryke', 4),
         ('apex-kick', 5), ('rim-crush', 6)]
CARD_W, CARD_H, CARD_Y, CARD_X0, CARD_PITCH = 248, 379, 463, 54, 310

load('root2.svg')
for i, (name, idx) in enumerate(CARDS):
    x = CARD_X0 + i * CARD_PITCH
    write(f'{OUT}/episodes/{name}.svg', [idx],
          viewbox=f'{x} {CARD_Y} {CARD_W} {CARD_H}', size=(CARD_W, CARD_H))

# --- screen 3: the product grid ------------------------------------------
# Exported per-node rather than as one page: the six cards share one ornament
# frame, the photos are real photography, and the copy is live text. So the card
# is rebuilt as a component and only its chrome ships as vector.
#   s3/card.svg          one card group, complete (photo + outlined copy included)
#   s3/prop-*.svg        the four flaming props that float between the cards
S3 = 's3'

def strip_backing(root):
    """Drop Figma's canvas rect and the page gradient it exports behind a node."""
    for c in list(root):
        if c.tag == NS + 'rect' and (c.get('fill', '').startswith('#28') or
                                     'paint0_linear' in (c.get('fill') or '')):
            root.remove(c)
    return root

def write_tree(path, root):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ET.ElementTree(root).write(path, encoding='utf-8', xml_declaration=False)
    print(os.path.basename(path).ljust(24), os.path.getsize(path) // 1024, 'KB')

# card chrome: everything but the black plate, the photo and the outlined copy
tree = ET.parse(f'{S3}/card.svg')
root = strip_backing(tree.getroot())
outer = [c for c in root if c.tag == NS + 'g'][0]
strip_backing(outer)
card = [c for c in outer if c.get('id') == 'Group 84'][0]
for c in list(card):
    if c.get('id') in ('Rectangle 38', 'Vector 75', 'Frame 19'):
        card.remove(c)
chrome = ET.Element(NS + 'svg', {'width': '425', 'height': '723',
                                 'viewBox': '0 0 425 723', 'fill': 'none'})
# Keep only the defs the chrome actually references — the file's defs still
# hold the card photo as base64, which is 780 KB of nothing we need here.
defmap = {c.get('id'): c for d in root if d.tag == NS + 'defs'
          for c in d if c.get('id')}
kept = ET.SubElement(chrome, NS + 'defs')
for dn in collect_defs([card]):
    kept.append(dn)
if not len(kept):
    chrome.remove(kept)
chrome.append(card)
write_tree(f'{OUT}/products/card-chrome.svg', chrome)

for name in ('football', 'shuttle', 'cricketball', 'tennisball'):
    t = ET.parse(f'{S3}/prop-{name}.svg')
    rt = strip_backing(t.getroot())
    for g in [c for c in rt if c.tag == NS + 'g']:
        strip_backing(g)
    write_tree(f'{OUT}/products/prop-{name}.svg', rt)

# Six product photos, each exported by Figma at two resolutions; keep the larger.
# WebP because these are photographs — the PNGs are ~3 MB for the set.
try:
    from PIL import Image
except ImportError:
    Image = None

PHOTOS = [('crick-stryke', 'raw1'), ('apex-kick', 'raw9'), ('sky-smash', 'raw5'),
          ('spin-ignite', 'raw10'), ('league-tee', 'raw7'), ('rim-crush', 'raw6')]

if Image:
    for name, src in PHOTOS:
        im = Image.open(f's3raw/{src}.png')
        if im.mode == 'RGBA' and im.getchannel('A').getextrema() == (255, 255):
            im = im.convert('RGB')
        out = f'{OUT}/products/{name}.webp'
        im.save(out, 'WEBP', quality=82, method=6)
        print(os.path.basename(out).ljust(24), im.size, os.path.getsize(out) // 1024, 'KB')

# --- screen 4: the product line-up -----------------------------------------
# Reuses the product photos and card chrome from screen 3; only the four
# scattered props are new. Helmet and racket are photographic cut-outs, the
# flaming ball and shuttlecock are vector.
S4 = 's4'
for name in ('prop-ball', 'prop-shuttle'):
    t = ET.parse(f'{S4}/{name}.svg')
    rt = strip_backing(t.getroot())
    for g in [c for c in rt if c.tag == NS + 'g']:
        strip_backing(g)
    write_tree(f'{OUT}/lineup/{name}.svg', rt)

if Image:
    for name in ('helmet', 'racket'):
        im = Image.open(f'{S4}/{name}.png')
        out = f'{OUT}/lineup/{name}.webp'
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, 'WEBP', quality=85, method=6)
        print(os.path.basename(out).ljust(24), im.size, os.path.getsize(out) // 1024, 'KB')

# Optimise in-process. Splitting this into a separate npm step meant running
# this file directly left every folder unminified, which silently added ~330 KB
# to the JS bundle twice. Do it here so there is only one way to get it wrong.
import subprocess
ROOT = os.path.abspath('..')
for folder in ('scene', 'frame', 'episodes', 'products', 'lineup'):
    d = os.path.join(ROOT, 'src', 'assets', folder)
    if os.path.isdir(d):
        subprocess.run(['npx', 'svgo', '-q', '-f', d, '-o', d],
                       cwd=ROOT, shell=(os.name == 'nt'), check=True)
print('optimised')
