# Typesets the The Sunday long wordmark (Pinyon Script + DM Sans, per the brand guide) as SVG paths.
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

def run(font_path, text, size, tracking=0):
    f = TTFont(font_path)
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    hmtx = f['hmtx']; s = size / upm
    kern = {}
    x = 0; paths = []; bp = BoundsPen(gs)
    prev = None
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (s, 0, 0, -s, x, 0))
        gs[g].draw(tp)
        paths.append(pen.getCommands())
        bpen = BoundsPen(gs); gs[g].draw(TransformPen(bpen,(s,0,0,-s,x,0)))
        if bpen.bounds: bp_b = bpen.bounds; paths_bounds.append(bp_b)
        x += hmtx[g][0] * s + tracking
    return ' '.join(paths), x - tracking

paths_bounds = []
color = '#4E5D68'
d1, w1 = run(sys.argv[1], 'The Sunday', 200)
b1 = paths_bounds[:]; paths_bounds.clear()
d2, w2 = run(sys.argv[2], 'MAGAZINE', 30, tracking=22)
b2 = paths_bounds[:]
minx1=min(b[0] for b in b1); maxx1=max(b[2] for b in b1); miny1=min(b[1] for b in b1); maxy1=max(b[3] for b in b1)
minx2=min(b[0] for b in b2); maxx2=max(b[2] for b in b2); miny2=min(b[1] for b in b2); maxy2=max(b[3] for b in b2)
W1=maxx1-minx1; W2=maxx2-minx2
pad=20
width=W1+2*pad
# place MAGAZINE centred, below baseline of script with gap
gap=-78
ty2 = 52 - miny2  # MAGAZINE sits just below the script baseline, beside the y tail
tx2 = pad + (W1-W2)/2 - minx2
height = max(ty2 + maxy2, maxy1) - miny1 + 2*pad
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {height:.0f}" role="img" aria-labelledby="t"><title id="t">The Sunday Magazine</title>
<g fill="{color}"><path transform="translate({pad-minx1:.1f},{pad-miny1:.1f})" d="{d1}"/>
<path transform="translate({tx2:.1f},{ty2+pad-miny1:.1f})" d="{d2}"/></g></svg>'''
open(sys.argv[3],'w').write(svg)
print(width,height)
