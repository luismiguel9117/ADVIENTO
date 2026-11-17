# Combina la imagen regenerada (solo zonas de máscara) con la referencia original -> assets/gen/scene.jpg
# Uso: python tools/compose_plate.py referencia.png mascara.png [regenerada.png]
import sys, os
from PIL import Image, ImageFilter
ref = Image.open(sys.argv[1]).convert("RGB"); mask = Image.open(sys.argv[2]).convert("L")
if len(sys.argv) > 3:
    gen = Image.open(sys.argv[3]).convert("RGB").resize(ref.size, Image.LANCZOS)
else:  # provisional: relleno difuminado
    gen = ref
    for _ in range(6): gen = Image.composite(gen.filter(ImageFilter.GaussianBlur(40)), ref, mask)
out = Image.composite(gen, ref, mask)
os.makedirs("assets/gen", exist_ok=True)
out.save("assets/gen/scene.jpg", quality=90, optimize=True, progressive=True)
print("scene.jpg", out.size)
