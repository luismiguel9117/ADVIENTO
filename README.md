# Calendario de Adviento · British House International

Web estática (HTML + CSS + JS, sin build). Abre `index.html` o sirve la carpeta con cualquier servidor estático.

- `js/days.js` — contenido de las 24 casillas (vocabulario, quizzes, códigos de descuento, sorteos).
- `?demo` en la URL desbloquea todas las casillas; `?day=5` simula el 5 de diciembre.
- `assets/logo.png` — coloca aquí el logo oficial (si no existe se usa `assets/logo.svg`).
- `assets/gen/` — imágenes generadas en local con Open Higgsfield (sd.cpp + Z-Image Turbo): `bash tools/generar-imagenes.sh`.
- Los sorteos se guardan en `localStorage` de momento; falta conectarlos a un backend/CRM.
