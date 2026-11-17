#!/usr/bin/env bash
# Genera las imágenes de la web en local con el motor de Open Higgsfield
# (stable-diffusion.cpp + Z-Image Turbo: mismos archivos y parámetros que la app de escritorio).
# Uso:  bash tools/generar-imagenes.sh [scene|modal-vocab|modal-quiz|modal-discount|modal-raffle]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
LA="${OPEN_GENERATIVE_AI_LOCAL_AI_DIR:-$APPDATA/open-generative-ai/local-ai}"
SD="$LA/bin/sd-cli.exe"; M="$LA/models"
COMMON=(--diffusion-model "$M/z_image_turbo-Q4_K.gguf" --llm "$M/Qwen3-4B-Instruct-2507-UD-Q4_K_XL.gguf" --vae "$M/ae.safetensors"
        --steps 8 --cfg-scale 1.0 --sampling-method euler --scheduler simple --diffusion-fa)
STYLE="soft 3D cartoon render, Pixar-like holiday illustration, bright clean colors, red white and royal blue palette, soft lighting, high detail, no text, no letters, no logos, no watermark"
ONLY="${1:-}"; mkdir -p assets/gen
want() { [[ -z "$ONLY" || "$ONLY" == "$1" ]]; }

# 1) Escena principal: la referencia sin textos (inpainting) -> assets/gen/scene.jpg
if want scene; then
  echo ">> scene"
  python tools/make_mask.py assets/src/reference.png assets/src/mask.png "${TEMP:-/tmp}/mask_preview.png" 14 24
  "$SD" "${COMMON[@]}" -i assets/src/reference.png --mask assets/src/mask.png --strength 1.0 -W 1536 -H 1024 --seed 23 \
    -p "Christmas winter scene illustration, open soft pale blue winter sky fading smoothly, gentle bokeh and falling snowflakes, fluffy deep snow drifts on the ground, snowy pine branches with red holly berries in the corners, seamless continuous background, soft 3D cartoon render, no text, no panels, no frames, no rectangles, no user interface" \
    -o assets/src/inpainted.png >/dev/null 2>&1
  python tools/compose_plate.py assets/src/reference.png assets/src/mask.png assets/src/inpainted.png
fi

# 2) Ilustraciones de las ventanas de sorpresa
gen() { # nombre semilla prompt
  want "$1" || return 0
  echo ">> $1"
  "$SD" "${COMMON[@]}" -W 1024 -H 512 --seed "$2" -p "$3, $STYLE" -o "assets/gen/$1.png" >/dev/null 2>&1
  python -c "from PIL import Image; Image.open('assets/gen/$1.png').convert('RGB').save('assets/gen/$1.jpg', quality=85, optimize=True)" && rm "assets/gen/$1.png"
}
gen modal-vocab 101 "Cozy flat lay of an open storybook with Christmas decorations, candy canes, pine branches, snowflakes and red baubles on a light blue background, wide banner composition"
gen modal-quiz 202 "Red and blue Christmas baubles shaped like question marks hanging with tinsel and snow, light blue background, wide banner composition"
gen modal-discount 303 "Red and white gift boxes with big ribbons and a golden gift tag, confetti and snowflakes, light blue background, wide banner composition"
gen modal-raffle 404 "A shiny golden trophy cup surrounded by wrapped Christmas presents, red ribbons, stars and sparkles in the snow, light blue background, wide banner composition"
echo "Listo -> assets/gen"
