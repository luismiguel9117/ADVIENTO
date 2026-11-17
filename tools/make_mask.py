# Crea la máscara de las zonas con texto/UI de la referencia (blanco = regenerar)
import sys
from PIL import Image, ImageDraw, ImageFilter
src = sys.argv[1]; out = sys.argv[2]; prev = sys.argv[3]
im = Image.open(src).convert("RGB")
m = Image.new("L", im.size, 0); d = ImageDraw.Draw(m)
R = [
  (150, 0, 1400, 100),     # header (logo + menú + botón)
  (190, 160, 728, 560),    # cinta + titular + subtítulo
  (280, 568, 632, 645),    # botón "Abre tu sorpresa"
  (115, 705, 1420, 820),   # barra de características
  (130, 842, 1405, 990),   # barra de cuenta atrás
]
P = int(sys.argv[5]) if len(sys.argv)>5 else 0
for (a,b,c,e) in R: d.rounded_rectangle((a-P,b-P,c+P,e+P), radius=24, fill=255)
m = m.filter(ImageFilter.GaussianBlur(int(sys.argv[4]) if len(sys.argv)>4 else 6))
m.save(out)
red = Image.new("RGB", im.size, (255, 0, 0))
Image.composite(Image.blend(im, red, .5), im, m).save(prev)
