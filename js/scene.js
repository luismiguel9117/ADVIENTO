// Geometría de la escena (en píxeles de la imagen original 1536×1024)
// y capas vivas: luces que parpadean, Ken Burns, brillo en las casillas.
window.SCENE = (() => {
  const W = 1536, H = 1024;
  const BOX = { x: 785, y: 274, w: 88, h: 89, px: 92.2, py: 94 };
  const BULBS = [[790,256],[842,231],[900,205],[947,180],[1000,152],[1048,126],[1100,150],[1153,177],[1206,210],[1260,229],[1321,256],
                 [872,244],[960,238],[1050,236],[1140,238],[1232,244]];
  const WINDOWS = [[1464,364],[1483,392],[1463,396],[1465,409],[1478,410],[1482,441],[1465,438],[1458,459],[1470,462],[1409,482],[1444,484],[1463,485],[1408,513]];
  const CLOCK = [1462,288];
  const pct = (v, t) => (v / t * 100) + "%";

  function boxRect(i) {
    const c = i % 6, r = Math.floor(i / 6);
    return { x: BOX.x + c * BOX.px, y: BOX.y + r * BOX.py, w: BOX.w, h: BOX.h };
  }

  // Crea un botón por casilla. El "lid" lleva el mismo recorte de la imagen,
  // así la caja real se levanta, brilla y se abre como una puerta.
  function buildSpots(container, days, onOpen) {
    return days.map((d, i) => {
      const b = boxRect(i);
      const el = document.createElement("button");
      el.className = "spot";
      el.dataset.day = d.day;
      el.setAttribute("role", "listitem");
      Object.assign(el.style, { left: pct(b.x, W), top: pct(b.y, H), width: pct(b.w, W), height: pct(b.h, H) });
      el.style.setProperty("--bs", `${W / b.w * 100}% ${H / b.h * 100}%`);
      el.style.setProperty("--bp", `${b.x / (W - b.w) * 100}% ${b.y / (H - b.h) * 100}%`);
      el.innerHTML = `<span class="in" aria-hidden="true">${d.icon}<b>${d.day}</b></span>
        <span class="lid" aria-hidden="true"><i class="sheen"></i></span>
        <span class="lock" aria-hidden="true">🔒</span>`;
      el.addEventListener("click", () => onOpen(d, el));
      container.appendChild(el);
      return el;
    });
  }

  function buildGlows(container) {
    const add = (cls, [x, y]) => {
      const g = document.createElement("i");
      g.className = "glow " + cls;
      g.style.left = pct(x, W); g.style.top = pct(y, H);
      container.appendChild(g);
      return g;
    };
    return {
      bulbs: BULBS.map((p) => add("bulb", p)),
      windows: WINDOWS.map((p) => add("win", p)),
      clock: add("clock", CLOCK),
    };
  }

  // Animación constante (bucle infinito) con GSAP
  function animate(glows, spots) {
    if (!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Cámara lenta tipo vídeo (Ken Burns) — sin cortes porque es yoyo
    gsap.fromTo(".kb", { scale: 1, x: 0, y: 0 }, { scale: 1.035, x: "-0.6%", y: "-0.4%", duration: 16, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(".godrays", { opacity: .9, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    // Bombillas: parpadeo aleatorio e independiente
    glows.bulbs.forEach((g) => {
      gsap.set(g, { opacity: gsap.utils.random(.2, .9) });
      gsap.to(g, { opacity: () => gsap.utils.random(.15, 1), scale: () => gsap.utils.random(.7, 1.35),
        duration: () => gsap.utils.random(.35, 1.4), ease: "sine.inOut", repeat: -1, repeatRefresh: true, delay: Math.random() * 2 });
    });
    // Ventanas del Big Ben: brillo cálido suave
    glows.windows.forEach((g) => {
      gsap.set(g, { opacity: .35 });
      gsap.to(g, { opacity: () => gsap.utils.random(.25, .85), duration: () => gsap.utils.random(1.5, 3.5), ease: "sine.inOut", repeat: -1, repeatRefresh: true, delay: Math.random() * 3 });
    });
    gsap.to(glows.clock, { opacity: .55, scale: 1.15, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    // Ola de brillo que recorre las 24 cajas cada pocos segundos
    const sheens = spots.map((s) => s.querySelector(".sheen"));
    const wave = gsap.timeline({ repeat: -1, repeatDelay: 3.5, delay: 2.5 });
    wave.fromTo(sheens, { xPercent: -160 }, { xPercent: 360, duration: 1.1, ease: "power2.inOut", stagger: { each: .06, grid: [4, 6], from: "start" } });
    // Hover: brillo inmediato al pasar el cursor
    spots.forEach((s) => s.addEventListener("pointerenter", () => {
      gsap.fromTo(s.querySelector(".sheen"), { xPercent: -160 }, { xPercent: 360, duration: .7, ease: "power2.out", overwrite: true });
      sparkle(s);
    }));
  }

  function sparkle(el) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 7; i++) {
      const p = document.createElement("i");
      const size = 4 + Math.random() * 6;
      p.style.cssText = `position:fixed;left:${r.left + Math.random() * r.width}px;top:${r.top + Math.random() * r.height}px;width:${size}px;height:${size}px;z-index:35;pointer-events:none;border-radius:50%;background:radial-gradient(circle,#fff,#ffd76a 50%,transparent 70%)`;
      document.body.appendChild(p);
      gsap.to(p, { y: -20 - Math.random() * 30, x: (Math.random() - .5) * 30, opacity: 0, scale: 1.6, duration: .8 + Math.random() * .5, ease: "power2.out", onComplete: () => p.remove() });
    }
  }

  // Vídeo de fondo en bucle: solo si el usuario no pide menos movimiento ni ahorro de datos.
  function startVideo(hero) {
    const v = hero.querySelector(".plate-video");
    if (!v) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (reduce || saveData) return;
    v.innerHTML = `<source src="assets/gen/scene-loop.webm" type="video/webm"><source src="assets/gen/scene-loop.mp4" type="video/mp4">`;
    v.addEventListener("playing", () => hero.classList.add("video-on"), { once: true });
    v.load();
    v.play().catch(() => {});
    // Pausa cuando la portada no está a la vista
    new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(hero);
  }

  return { buildSpots, buildGlows, animate, startVideo };
})();
