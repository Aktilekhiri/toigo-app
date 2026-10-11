"""Generate Open Graph images, favicon PNGs. Run from project root: python3 tools/og.py"""
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
import math, shutil

T = "tools/ttf/"
def fam(prefix, w="400"):
    files = [f"{T}{prefix}-{s}-{w}-normal.ttf" for s in ("latin", "cyrillic", "cyrillic-ext", "latin-ext")]
    cmaps = [set(TTFont(f).getBestCmap().keys()) for f in files]
    return files, cmaps

class Font:
    def __init__(self, prefix, size, w="400"):
        self.files, self.cmaps = fam(prefix, w)
        self.fonts = [ImageFont.truetype(f, size) for f in self.files]
    def pick(self, ch):
        for f, c in zip(self.fonts, self.cmaps):
            if ord(ch) in c: return f
        return self.fonts[0]
    def width(self, text):
        return sum(self.pick(ch).getlength(ch) for ch in text)
    def draw(self, d, xy, text, fill, anchor="l"):
        x, y = xy
        if anchor == "m": x -= self.width(text) / 2
        for ch in text:
            f = self.pick(ch); d.text((x, y), ch, font=f, fill=fill); x += f.getlength(ch)

def horn(d, cx, cy, s, color, w=3):
    # kochkor muyuz: two spirals + stem, path sampled from the SVG
    def spiral(sign):
        pts = []
        for i in range(60):
            t = i / 59
            a = math.pi * (0.5 + 2.2 * t)
            r = s * (0.55 - 0.42 * t)
            pts.append((cx + sign * (s * 0.55 - r * math.cos(a) * 1.0), cy - s * 0.25 - r * math.sin(a)))
        return pts
    d.line([(cx, cy + s * 0.6), (cx, cy - s * 0.6)], fill=color, width=w)
    for sign in (-1, 1):
        d.line(spiral(sign), fill=color, width=w, joint="curve")

def site_og(lang):
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), "#FFFFFF"); d = ImageDraw.Draw(im)
    gold, ink, mut = "#A67C2E", "#15181C", "#6A7077"
    d.rectangle([0, 0, W, 8], fill=ink)
    horn(d, 112, 120, 34, gold)
    Font("yeseva-one", 64).draw(d, (165, 82), "Тойго", ink)
    if lang == "ky":
        l1, l2, sub = "Онлайн чакыруулар", "акысыз жана 5 мүнөттө", "Үйлөнүү той · Кыз узатуу · Сүннөт той · Тушоо кесүү · Маараке"
    else:
        l1, l2, sub = "Онлайн-приглашения", "на той бесплатно", "Свадьба · Кыз узатуу · Сүннөт той · Тушоо кесүү · Юбилей"
    big = Font("yeseva-one", 54)
    big.draw(d, (80, 250), l1, ink); big.draw(d, (80, 318), l2, gold)
    Font("rubik", 20).draw(d, (82, 430), sub, mut)
    Font("rubik", 24, "500").draw(d, (82, 520), "toigo.app   ·   KG · RU   ·   0 сом", ink)
    # phone card on the right
    px, py, pw, ph = 860, 70, 270, 520
    d.rounded_rectangle([px, py, px + pw, py + ph], 38, fill="#0E1318")
    d.rounded_rectangle([px + 10, py + 10, px + pw - 10, py + ph - 10], 30, fill="#1D2742")
    # mountains
    d.polygon([(px + 10, py + ph - 10), (px + 10, py + ph - 120), (px + 70, py + ph - 180), (px + 120, py + ph - 130), (px + 180, py + ph - 210), (px + pw - 10, py + ph - 120), (px + pw - 10, py + ph - 10)], fill="#2A3555")
    horn(d, px + pw / 2, py + 120, 18, "#D2AE62", 2)
    Font("rubik", 14, "500").draw(d, (px + pw / 2, py + 160), "ҮЙЛӨНҮҮ ТОЙ" if lang == "ky" else "СВАДЬБА", "#D2AE62", "m")
    nf = Font("yeseva-one", 38)
    nf.draw(d, (px + pw / 2, py + 195), "Айбек", "#EFEBE3", "m")
    Font("yeseva-one", 26).draw(d, (px + pw / 2, py + 245), "&", "#D2AE62", "m")
    nf.draw(d, (px + pw / 2, py + 280), "Айзада", "#EFEBE3", "m")
    Font("yeseva-one", 22).draw(d, (px + pw / 2, py + 345), "12 · 06 · 2027", "#D2AE62", "m")
    im.save(f"public/img/og-{lang}.png", optimize=True)

TPLC = {
    "alatoo": ("#1D2742", "#EFEBE3", "#D2AE62"), "akkalpak": ("#FFFFFF", "#151515", "#151515"),
    "shyrdak": ("#7E2A20", "#FBF1E2", "#E8B65A"), "jibek": ("#E3E8DF", "#2C3A31", "#8C5E43"),
    "anar": ("#5B1626", "#FAEFE6", "#D9AE6A"), "asman": ("#DCEAF4", "#1F3550", "#B85A1A"),
}
def tpl_og(tid):
    bg, fg, ac = TPLC[tid]
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), bg); d = ImageDraw.Draw(im)
    d.rectangle([24, 24, W - 24, H - 24], outline=ac, width=2)
    horn(d, W / 2, 150, 40, ac, 4)
    Font("rubik", 26, "500").draw(d, (W / 2, 230), "ЧАКЫРУУ  ·  ПРИГЛАШЕНИЕ", ac, "m")
    Font("yeseva-one", 72).draw(d, (W / 2, 300), "Сиздерди тойго", fg, "m")
    Font("yeseva-one", 72).draw(d, (W / 2, 390), "чакырабыз", fg, "m")
    Font("rubik", 26).draw(d, (W / 2, 520), "Ачып көрүңүз · Откройте приглашение", ac, "m")
    im.save(f"public/img/og-{tid}.png", optimize=True)

def icons():
    for size, name in ((180, "apple-touch-icon.png"), (512, "icon-512.png"), (192, "icon-192.png")):
        im = Image.new("RGB", (size, size), "#15181C"); d = ImageDraw.Draw(im)
        horn(d, size / 2, size / 2 + size * .04, size * .3, "#D9B46A", max(2, size // 40))
        im.save("public/" + name, optimize=True)

for l in ("ky", "ru"): site_og(l)
for t in TPLC: tpl_og(t)
icons()
for q in ("qr-mbank.jpg", "qr-obank.png", "qr-paypal.png"):
    shutil.copy("/tmp/claude-0/-home-claude/c9ae15f9-090c-59f4-9861-f9480f21dc9a/scratchpad/clip4k/" + q, "public/img/" + q)
print("ok")
