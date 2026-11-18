# Generates an original worn-oak texture (owned asset) in the brand's Caramelo/Nogueira tones.
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(7)
W, H = 2000, 220
y = np.linspace(0, 1, H)[:, None]; x = np.linspace(0, 1, W)[None, :]
def smooth_noise(w, h, sx, sy, seed):
    r = np.random.default_rng(seed).random((sy, sx))
    im = Image.fromarray((r * 255).astype('uint8')).resize((w, h), Image.BICUBIC)
    return np.asarray(im, dtype=float) / 255
warp = smooth_noise(W, H, 14, 6, 1) * 0.9 + smooth_noise(W, H, 60, 10, 2) * 0.25
ph = (y * 7 + warp * 1.6) * np.pi * 2
grain = 1 - 2 * np.abs(np.sin(ph)) ** 0.35  # thin dark ring lines
rings2 = np.sin((y * 23 + warp * 2.4) * np.pi * 2)
fine = smooth_noise(W, H, 2000, 110, 3)
streak = smooth_noise(W, H, 40, 60, 4)
v = 0.62 + 0.10 * grain + 0.04 * rings2 + 0.12 * (fine - .5) + 0.22 * (streak - .5)
# knots
for cx, cy, r in [(0.18, .55, .025), (0.63, .35, .018), (0.86, .7, .022)]:
    d = np.sqrt(((x - cx) * W / H) ** 2 + (y - cy) ** 2)
    v -= 0.22 * np.exp(-(d / r) ** 2 * 1.2) * (0.6 + 0.4 * np.sin(d * 140))
light = np.array([0xB0, 0x7E, 0x50]) / 255   # caramelo claro
dark = np.array([0x5B, 0x2F, 0x22]) / 255    # nogueira
v = np.clip(v, 0, 1)[..., None]
img = dark + (light - dark) * v
# faded, worn edges
fade = 1 - 0.12 * np.exp(-((y - 0.04) / 0.05) ** 2)[..., None]
img = img * fade + 0.03 * (smooth_noise(W, H, 300, 40, 9)[..., None] - .5)
im = Image.fromarray((np.clip(img, 0, 1) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))
im.save('public/assets/worn-wood.webp', quality=82)
im.crop((0,0,800,220)).save('/tmp/wood_check.png')
