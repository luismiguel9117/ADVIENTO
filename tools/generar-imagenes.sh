#!/usr/bin/env bash
# Genera las imágenes de la web en local con el motor de Open Higgsfield
# (stable-diffusion.cpp + Z-Image Turbo, mismos archivos y parámetros que la app).
# Uso:  bash tools/generar-imagenes.sh [nombre]   (sin nombre = todas)
set -euo pipefail
LA="${OPEN_GENERATIVE_AI_LOCAL_AI_DIR:-$APPDATA/open-generative-ai/local-ai}"
SD="$LA/bin/sd-cli.exe"; M="$LA/models"
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/gen"; mkdir -p "$OUT"

STYLE="soft 3D cartoon render, Pixar-like holiday illustration, bright clean colors, red white and royal blue palette, soft lighting, high detail, no text, no letters, no logos, no watermark"

gen() { # nombre ancho alto semilla prompt
  local name=$1 w=$2 h=$3 seed=$4 prompt=$5
  [[ -n "${ONLY:-}" && "$ONLY" != "$name" ]] && return 0
  echo ">> $name (${w}x${h})"
  "$SD" --diffusion-model "$M/z_image_turbo-Q4_K.gguf" --llm "$M/Qwen3-4B-Instruct-2507-UD-Q4_K_XL.gguf" --vae "$M/ae.safetensors" \
    -p "$prompt, $STYLE" -o "$OUT/$name.png" --steps 8 -W "$w" -H "$h" --cfg-scale 1.0 --seed "$seed" \
    --sampling-method euler --scheduler simple --diffusion-fa >/dev/null 2>&1 || { echo "   fallo $name"; return 1; }
}
ONLY="${1:-}"

gen hero-bg 1536 832 2412 "Wide panoramic winter Christmas scene in London. Far left edge: a classic red British telephone box covered in snow with a green Christmas wreath and red bow, stacked wrapped gift boxes with red ribbons in the snow. Far right edge: Big Ben clock tower and Westminster palace glowing with warm golden lights at dusk beside the river. The whole center is open pale blue winter sky with soft bokeh and gently falling snowflakes, empty space. Deep fluffy snow along the bottom, snowy pine branches with red holly berries in the bottom corners"
gen modal-vocab 1024 512 101 "Cozy flat lay of an open English dictionary book with Christmas decorations, candy canes, pine branches, snowflakes and red ornaments on a light blue background, wide banner composition"
gen modal-quiz 1024 512 202 "A cute red and blue quiz game buzzer and question mark shaped Christmas ornaments hanging with tinsel and snow, light blue background, wide banner composition"
gen modal-discount 1024 512 303 "Red and white gift boxes with big ribbons and a golden shopping tag with a percent sign, confetti and snowflakes, light blue background, wide banner composition"
gen modal-raffle 1024 512 404 "A shiny golden trophy cup surrounded by wrapped Christmas presents, red ribbons, stars and sparkles in the snow, light blue background, wide banner composition"
echo "Listo -> $OUT"
