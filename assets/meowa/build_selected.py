from pathlib import Path
import json
import shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SOURCE = next((ROOT / "sources" / "gameplay-pack").glob("*"))
SELECTED = ROOT / "selected"
SELECTED.mkdir(parents=True, exist_ok=True)

FILES = {
    "player-chim-lac-plane.png": "sprite_00.png",
    "hazard-cloud-gate.png": "sprite_01.png",
    "hazard-wind-vortex.png": "sprite_02.png",
    "hazard-thunder-column.png": "sprite_03.png",
    "enemy-shadow-scout.png": "sprite_04.png",
    "enemy-shadow-glider.png": "sprite_05.png",
    "collectible-sao-lac.png": "sprite_06.png",
    "pickup-lotus-shield.png": "sprite_07.png",
}

for target, source in FILES.items():
    shutil.copyfile(SOURCE / source, SELECTED / target)


def font(size: int):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def paste_pixel(dst: Image.Image, source_name: str, xy: tuple[int, int], scale: int):
    sprite = Image.open(SELECTED / source_name).convert("RGBA")
    sprite = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
    dst.alpha_composite(sprite, xy)


# App icon: deterministic composition from the selected Meowa plane and star.
icon = Image.new("RGBA", (512, 512), "#123A63")
d = ImageDraw.Draw(icon)
d.ellipse((30, 30, 482, 482), fill="#174D77", outline="#F5E9D0", width=16)
for x, y, r in [(82, 98, 8), (420, 115, 6), (375, 385, 7), (113, 405, 5)]:
    d.ellipse((x-r, y-r, x+r, y+r), fill="#FFD84D")
paste_pixel(icon, "player-chim-lac-plane.png", (64, 128), 6)
paste_pixel(icon, "collectible-sao-lac.png", (318, 55), 2)
icon.save(SELECTED / "app-icon-512.png")

# GameHub cover: exact 1200x630 opaque RGBA; sprites remain nearest-neighbour.
cover = Image.new("RGBA", (1200, 630), "#123A63")
d = ImageDraw.Draw(cover)
# sky gradient
for y in range(630):
    t = y / 629
    c1, c2 = (18, 58, 99), (27, 127, 168)
    color = tuple(round(a + (b-a)*t) for a, b in zip(c1, c2)) + (255,)
    d.line((0, y, 1200, y), fill=color)
# distant paper clouds and warm skyline
d.ellipse((-110, 360, 390, 650), fill="#F5E9D0")
d.ellipse((220, 410, 690, 690), fill="#F5E9D0")
d.ellipse((590, 385, 1110, 690), fill="#F5E9D0")
d.rectangle((0, 535, 1200, 630), fill="#2B2118")
for x, h in [(35, 55), (120, 95), (255, 62), (380, 120), (535, 72), (675, 105), (820, 64), (950, 125), (1100, 80)]:
    d.rectangle((x, 535-h, x+70, 535), fill="#2B2118")
paste_pixel(cover, "player-chim-lac-plane.png", (110, 240), 5)
paste_pixel(cover, "hazard-cloud-gate.png", (850, 185), 4)
paste_pixel(cover, "enemy-shadow-glider.png", (710, 110), 2)
paste_pixel(cover, "collectible-sao-lac.png", (580, 260), 2)
d.text((64, 42), "MÁY BAY MỪNG 2/9", font=font(62), fill="#FFD84D", stroke_width=5, stroke_fill="#2B2118")
d.text((68, 116), "Chạm để giữ nhịp bay • Rực Trời Việt Nam", font=font(28), fill="#F5E9D0", stroke_width=2, stroke_fill="#123A63")
cover.save(SELECTED / "gamehub-cover-1200x630.png")

# Transparent HUD/control motif. Meowa star and lotus establish the asset language;
# control geometry is deterministic so labels and hit states stay implementation-safe.
hud = Image.new("RGBA", (640, 160), (0, 0, 0, 0))
d = ImageDraw.Draw(hud)
d.rounded_rectangle((4, 18, 636, 142), radius=28, fill=(18, 58, 99, 235), outline="#F5E9D0", width=4)
paste_pixel(hud, "collectible-sao-lac.png", (24, 32), 2)
paste_pixel(hud, "pickup-lotus-shield.png", (152, 32), 2)
# three lives
d.text((288, 44), "♥♥♥", font=font(48), fill="#FFD84D", stroke_width=2, stroke_fill="#2B2118")
# one-tap lift arrow
d.polygon([(455, 104), (455, 62), (432, 62), (474, 28), (516, 62), (493, 62), (493, 104)], fill="#F5E9D0")
# mute/sound glyph
d.polygon([(542, 70), (562, 70), (582, 50), (582, 112), (562, 92), (542, 92)], fill="#FFD84D")
d.arc((568, 58, 614, 105), -55, 55, fill="#F5E9D0", width=5)
hud.save(SELECTED / "hud-control-motif.png")

# Contact sheet: source choices + required product surfaces.
contact = Image.new("RGBA", (1400, 1040), "#F5E9D0")
d = ImageDraw.Draw(contact)
d.text((40, 28), "MAYBAY29 — MEOWA DESIGN SELECTION", font=font(42), fill="#2B2118")
d.text((40, 82), "Pixel-folk arcade • job_8094946e6faf4124895457d981caf89d", font=font(22), fill="#123A63")
labels = list(FILES.keys())
for i, name in enumerate(labels):
    col, row = i % 4, i // 4
    x, y = 40 + col * 330, 145 + row * 260
    d.rounded_rectangle((x, y, x+290, y+220), radius=18, fill="#123A63", outline="#2B2118", width=3)
    sprite = Image.open(SELECTED / name).convert("RGBA").resize((160, 160), Image.Resampling.NEAREST)
    contact.alpha_composite(sprite, (x+65, y+10))
    d.text((x+12, y+180), name.replace(".png", ""), font=font(17), fill="#F5E9D0")
thumbs = [
    ("app-icon-512.png", (40, 720), (230, 230)),
    ("gamehub-cover-1200x630.png", (310, 720), (600, 315)),
    ("hud-control-motif.png", (950, 760), (400, 100)),
]
for name, xy, size in thumbs:
    im = Image.open(SELECTED / name).convert("RGBA").resize(size, Image.Resampling.NEAREST)
    contact.alpha_composite(im, xy)
    d.text((xy[0], xy[1] + size[1] + 10), name, font=font(18), fill="#2B2118")
contact.save(ROOT / "contact-sheet.png")

manifest = {
    "meowa_job_id": "job_8094946e6faf4124895457d981caf89d",
    "capability": "pixel-gen-run",
    "template": "object",
    "generation_speed": "normal",
    "remove_bg_method": "advanced",
    "prompt": "A cohesive set of eight Vietnamese festival flying arcade game sprites: one side-view red and gold Chim Lac propeller plane facing right with a cream outline; one dark violet cloud gate formed by an upper and lower cloud with a clear gap; one blue-gray wind vortex with a direction arrow; one dark thunder rain column; one charcoal shadow bird scout flying right; one charcoal shadow bird gliding in a curved pose; one bright yellow Sao Lac star collectible; one cyan and gold lotus shield pickup. Crisp simple silhouettes, limited palette, readable at mobile size, no text.",
    "source_output_size": [64, 64],
    "credits_before": 190,
    "credits_after": 118,
    "credits_used": 72,
    "source_mapping": FILES,
    "postprocess": "Deterministic Pillow composition; nearest-neighbor sprite scaling; source outputs unchanged.",
    "selected": [],
}
for path in sorted(SELECTED.glob("*.png")):
    im = Image.open(path)
    manifest["selected"].append({
        "file": str(path.relative_to(ROOT.parent.parent)),
        "width": im.width,
        "height": im.height,
        "mode": im.mode,
    })
(ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
