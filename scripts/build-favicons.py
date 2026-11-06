from pathlib import Path

from PIL import Image, ImageDraw


PUBLIC = Path(__file__).resolve().parents[1] / "public"


def cubic(p0, p1, p2, p3):
    points = []
    for step in range(65):
        t = step / 64
        points.append(tuple(
            (1 - t) ** 3 * p0[i] + 3 * (1 - t) ** 2 * t * p1[i]
            + 3 * (1 - t) * t ** 2 * p2[i] + t ** 3 * p3[i]
            for i in range(2)
        ))
    return points


leaf = cubic((17, 27), (17, 19.5), (22.5, 14.5), (30, 14.5))
leaf += cubic((30, 14.5), (30, 22), (24.5, 27), (17, 27))

for name, size, padding, background in (
    ("apple-touch-icon.png", 180, 0.14, "#fbf7ec"),
    ("favicon-32.png", 32, 0, (0, 0, 0, 0)),
):
    image = Image.new("RGBA", (size * 8, size * 8), background)
    draw = ImageDraw.Draw(image)
    scale = size * 8 * (1 - 2 * padding) / 32
    offset = size * 8 * padding
    draw.ellipse(tuple(offset + value * scale for value in (4, 6, 24, 26)), fill="#f1b544")
    draw.polygon([(offset + x * scale, offset + y * scale) for x, y in leaf], fill="#2f6b3f")
    image.resize((size, size), Image.Resampling.LANCZOS).save(PUBLIC / name)

with Image.open(PUBLIC / "apple-touch-icon.png") as image:
    assert image.size == (180, 180)
with Image.open(PUBLIC / "favicon-32.png") as image:
    assert image.size == (32, 32)
