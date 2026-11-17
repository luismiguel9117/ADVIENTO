# Calendario de Adviento · British House International

Web estática (HTML + CSS + JS, sin build). Sirve la carpeta con cualquier servidor estático (`npx http-server .`).

## Cómo está hecha la portada
- `assets/gen/scene.jpg`: la imagen de referencia **sin textos**, regenerada en local con el motor de Open Higgsfield
  (stable-diffusion.cpp + Z-Image Turbo, inpainting sobre `assets/src/reference.png` con `assets/src/mask.png`).
- Encima van los textos reales (HTML), la barra de características y la cuenta atrás, colocados con las coordenadas de la referencia (1536×1024).
- Las 24 casillas son botones superpuestos (`js/scene.js`): cada uno lleva un recorte de la imagen, así al pasar el cursor la caja real se levanta y brilla, y al abrirla gira como una puerta.
- Animación continua con GSAP: cámara lenta (Ken Burns), bombillas del tejado y ventanas del Big Ben parpadeando, ola de brillo que recorre las cajas, nieve.

## Contenido y pruebas
- `js/days.js` — contenido de las 24 casillas (vocabulario, quizzes, códigos de descuento, sorteos).
- `?demo` desbloquea todas las casillas; `?day=5` simula el 5 de diciembre.
- Los sorteos se guardan de momento en `localStorage`; falta conectarlos a un backend/CRM.

## Regenerar imágenes (local, GPU NVIDIA)
`bash tools/generar-imagenes.sh` (o una sola: `scene`, `modal-vocab`, `modal-quiz`, `modal-discount`, `modal-raffle`).
Usa los modelos que Open Higgsfield guarda en `%APPDATA%/open-generative-ai/local-ai`.
