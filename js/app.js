(() => {
  "use strict";
  const DAYS = window.ADVENT_DAYS || [];
  const params = new URLSearchParams(location.search);
  // De momento todas las casillas se pueden abrir. Para activar el bloqueo por fecha, pon UNLOCK_ALL = false.
  const UNLOCK_ALL = true;
  const DEMO = UNLOCK_ALL || params.has("demo"); // ?demo  -> todas las casillas abiertas
  const FORCED_DAY = parseInt(params.get("day"), 10); // ?day=5 -> simula el 5 de diciembre
  const STORE_KEY = "bh-advent-v1";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!window.gsap && !reduceMotion;
  const $ = (s, c = document) => c.querySelector(s);

  /* ---------- Estado ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } };
  // De momento las casillas abiertas NO se recuerdan: al recargar vuelven a estar cerradas.
  // Para recordarlas entre visitas, pon PERSIST_OPENED = true.
  const PERSIST_OPENED = false;
  const state = Object.assign({ opened: [], quiz: {}, raffles: {} }, load());
  if (!PERSIST_OPENED) state.opened = [];
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} };

  /* ---------- Día actual ---------- */
  function currentDay() {
    if (DEMO) return 24;
    if (FORCED_DAY >= 1 && FORCED_DAY <= 24) return FORCED_DAY;
    const now = new Date();
    if (now.getMonth() !== 11) return 0;          // antes de diciembre
    return Math.min(now.getDate(), 24);
  }
  const today = currentDay();

  /* ---------- Tablero ---------- */
  const board = $("#board");
  const spots = SCENE.buildSpots(board, DAYS, (d, el) => openDoor(d, el));
  spots.forEach((el, i) => {
    const d = DAYS[i], locked = d.day > today;
    el.setAttribute("aria-label", `Día ${d.day}${locked ? " (bloqueado)" : ""}`);
    if (locked) el.classList.add("locked");
    if (d.day === today && !DEMO) el.classList.add("today");
    if (state.opened.includes(d.day)) el.classList.add("open");
  });
  const glows = SCENE.buildGlows($(".glows"));
  SCENE.animate(glows, spots);
  SCENE.startVideo($(".hero"));

  function openDoor(d, el) {
    if (d.day > today) {
      el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
      toast(today === 0
        ? `🔒 El calendario empieza el 1 de diciembre. ¡Vuelve pronto!`
        : `🔒 Esta sorpresa se abre el ${d.day} de diciembre`);
      return;
    }
    const first = !el.classList.contains("open");
    el.classList.add("open");
    el.classList.remove("today");
    if (!state.opened.includes(d.day)) { state.opened.push(d.day); save(); }
    updateProgress();
    renderPrizes();
    setTimeout(() => { showModal(d); if (first) confetti(el); }, first ? 550 : 0);
  }

  function updateProgress() {
    const n = state.opened.length;
    $("#progressText").textContent = `${n} / 24 sorpresas abiertas`;
    $("#progressBar").style.width = (n / 24 * 100) + "%";
  }

  /* ---------- Modal ---------- */
  const modal = $("#modal"), mBody = $("#mBody");
  const TAGS = { vocab: "Word of the day", quiz: "Mini quiz", discount: "Descuento exclusivo", raffle: "Sorteo" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function showModal(d) {
    let html = `<img class="m-art" src="assets/gen/modal-${d.type}.jpg" alt="" onerror="this.remove()">
      <span class="tag">Día ${d.day} · ${TAGS[d.type]}</span>`;
    if (d.type === "vocab") {
      html += `<h3 id="mTitle">${esc(d.word)} <button class="speak" data-say="${esc(d.word)}">🔊 Escuchar</button></h3>
        <p class="ipa">${esc(d.ipa)} · <strong>${esc(d.es)}</strong></p>
        <p class="example">“${esc(d.example)}” <button class="speak" data-say="${esc(d.example)}">🔊</button></p>`;
    } else if (d.type === "quiz") {
      const done = state.quiz[d.day];
      html += `<h3 id="mTitle">${esc(d.question)}</h3>
        <div class="opts">${d.options.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join("")}</div>
        <p class="feedback" aria-live="polite">${done !== undefined ? "Ya respondiste este reto 👍" : ""}</p>`;
    } else if (d.type === "discount") {
      html += `<h3 id="mTitle">${esc(d.title)}</h3><p>${esc(d.text)}</p>
        <div class="code"><span>${esc(d.code)}</span><button class="btn" data-copy="${esc(d.code)}">Copiar</button></div>
        <a class="btn blue" href="#cursos">Ver cursos →</a>`;
    } else if (d.type === "raffle") {
      const joined = state.raffles[d.day];
      html += `<h3 id="mTitle">${esc(d.title)}</h3><p>${esc(d.text)}</p>` + (joined
        ? `<p class="feedback">✅ ¡Ya estás participando, ${esc(joined.name)}! Mucha suerte.</p>`
        : `<form class="raffle" novalidate>
            <input name="name" placeholder="Tu nombre" required autocomplete="name">
            <input name="email" type="email" placeholder="Tu email" required autocomplete="email">
            <label class="chk"><input type="checkbox" name="ok" required> Acepto las bases del sorteo y la política de privacidad.</label>
            <button class="btn" type="submit">¡Quiero participar!</button>
            <p class="feedback" aria-live="polite"></p>
          </form>`);
    }
    mBody.innerHTML = html;
    modal.classList.add("show");
    $(".close", modal).focus();
    if (hasGsap) gsap.from(".dialog", { scale: .6, rotation: -4, opacity: 0, duration: .55, ease: "back.out(1.8)" });

    mBody.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => say(b.dataset.say)));
    mBody.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "¡Copiado!"; } catch { b.textContent = "Selecciona y copia"; }
    }));
    if (d.type === "quiz") wireQuiz(d);
    if (d.type === "raffle") wireRaffle(d);
  }

  function wireQuiz(d) {
    const btns = mBody.querySelectorAll(".opts button"), fb = $(".feedback", mBody);
    const reveal = (picked) => {
      btns.forEach((b, i) => { b.disabled = true; if (i === d.answer) b.classList.add("ok"); else if (i === picked) b.classList.add("ko"); });
    };
    if (state.quiz[d.day] !== undefined) reveal(state.quiz[d.day]);
    btns.forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      state.quiz[d.day] = i; save();
      reveal(i);
      fb.innerHTML = (i === d.answer ? "🎉 Correct! " : "❌ Not quite. ") + esc(d.tip);
      if (i === d.answer) confetti(b);
    }));
  }

  function wireRaffle(d) {
    const form = $("form.raffle", mBody); if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fb = $(".feedback", form);
      const name = form.name.value.trim(), email = form.email.value.trim();
      if (!name) return (fb.textContent = "Escribe tu nombre.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (fb.textContent = "Revisa tu email.");
      if (!form.ok.checked) return (fb.textContent = "Debes aceptar las bases.");
      // TODO: enviar a backend / CRM cuando esté disponible. De momento se guarda en local.
      state.raffles[d.day] = { name, email, at: new Date().toISOString() }; save();
      renderPrizes();
      form.outerHTML = `<p class="feedback">✅ ¡Ya estás participando, ${esc(name)}! Mucha suerte.</p>`;
      confetti($(".dialog"));
    });
  }

  function closeModal() { modal.classList.remove("show"); }
  $(".close", modal).addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function say(text) {
    if (!("speechSynthesis" in window)) return toast("Tu navegador no soporta audio 😢");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB"; u.rate = .9;
    const v = speechSynthesis.getVoices().find((v) => v.lang === "en-GB");
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  /* ---------- Premios ---------- */
  function renderPrizes() {
    const box = $("#myPrizes"), chips = [];
    DAYS.filter((d) => state.opened.includes(d.day)).forEach((d) => {
      if (d.type === "discount") chips.push(`<span class="chip">🎟️ ${esc(d.title)}: <code>${esc(d.code)}</code></span>`);
      if (d.type === "raffle" && state.raffles[d.day]) chips.push(`<span class="chip">🏆 Participando: ${esc(d.title.replace(/^.*?:\s*/, ""))}</span>`);
    });
    const ok = Object.entries(state.quiz).filter(([day, i]) => DAYS[day - 1] && DAYS[day - 1].answer === i).length;
    if (ok) chips.push(`<span class="chip">🧠 Quizzes acertados: ${ok}</span>`);
    box.innerHTML = chips.length ? chips.join("") : `<span class="chip">Aún no has desbloqueado premios. ¡Abre tu primera casilla!</span>`;
  }

  /* ---------- Botón "sorpresa del día" ---------- */
  $("#openToday").addEventListener("click", () => {
    $("#calendario").scrollIntoView({ behavior: "smooth" });
    if (today === 0) return toast("🎄 El calendario empieza el 1 de diciembre. ¡Mira la cuenta atrás!");
    // Con todo desbloqueado, abre la primera casilla que aún no se ha abierto
    const target = UNLOCK_ALL ? (DAYS.find((d) => !state.opened.includes(d.day)) || DAYS[0]).day : today;
    const el = board.querySelector(`[data-day="${target}"]`);
    setTimeout(() => openDoor(DAYS[target - 1], el), 400);
  });

  /* ---------- Cuenta atrás ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const now = new Date();
    let target = new Date(now.getFullYear(), 11, 25);
    if (now >= new Date(now.getFullYear(), 11, 26)) target = new Date(now.getFullYear() + 1, 11, 25);
    let ms = Math.max(0, target - now);
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    $("#cd-d").textContent = pad(d); $("#cd-h").textContent = pad(h);
    $("#cd-m").textContent = pad(m); $("#cd-s").textContent = pad(Math.floor(ms / 1e3));
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Toast ---------- */
  let tId;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(tId); tId = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- Confeti ---------- */
  function confetti(origin) {
    if (reduceMotion) return;
    const r = origin.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ["#E3101F", "#2E86DE", "#F5B83D", "#ffffff", "#1E7A3C"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("i");
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:8px;height:12px;background:${colors[i % 5]};z-index:80;pointer-events:none;border-radius:2px`;
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 160;
      if (hasGsap) {
        gsap.to(p, { x: Math.cos(a) * dist, y: Math.sin(a) * dist + 140, rotation: Math.random() * 720, opacity: 0, duration: 1.2 + Math.random() * .6, ease: "power2.out", onComplete: () => p.remove() });
      } else {
        p.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist + 140}px) rotate(540deg)`, opacity: 0 }], { duration: 1400, easing: "ease-out" }).onfinish = () => p.remove();
      }
    }
  }

  /* ---------- Nieve ---------- */
  const cv = $("#snow"), ctx = cv.getContext("2d");
  let flakes = [];
  function resize() {
    cv.width = innerWidth; cv.height = innerHeight;
    const n = reduceMotion ? 0 : Math.min(140, Math.floor(innerWidth / 10));
    flakes = Array.from({ length: n }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, r: 1 + Math.random() * 3, s: .3 + Math.random() * 1, w: Math.random() * Math.PI * 2 }));
  }
  function snow() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    for (const f of flakes) {
      f.y += f.s; f.w += .01; f.x += Math.sin(f.w) * .4;
      if (f.y > cv.height) { f.y = -5; f.x = Math.random() * cv.width; }
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(snow);
  }
  addEventListener("resize", resize); resize(); if (!reduceMotion) snow();

  /* ---------- Animaciones de entrada (GSAP) ---------- */
  if (hasGsap) {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".plate", { opacity: 0, scale: 1.08, duration: 1.4, ease: "power2.out" })
      .from(".ribbon", { y: -40, rotation: -14, opacity: 0, duration: .7, ease: "back.out(2)" }, .3)
      .from("h1 .l1, h1 .l2", { y: 30, opacity: 0, stagger: .12, duration: .7 }, "-=.35")
      .from("h1 .hl", { scale: .3, rotation: -18, opacity: 0, duration: .9, ease: "elastic.out(1,.5)" }, "-=.35")
      .from(".lead, #openToday", { y: 20, opacity: 0, stagger: .1, duration: .5 }, "-=.6")
      .from(spots.map((s) => s.querySelector(".lid")), { filter: "brightness(1.8)", duration: .5, stagger: { each: .035, grid: [4, 6], from: "start" }, clearProps: "filter" }, .6)
      .from(".features", { y: 30, opacity: 0, duration: .6 }, "-=.6")
      .from(".countdown", { y: 30, opacity: 0, duration: .6 }, "-=.4")
      .from(".unit", { scale: .6, opacity: 0, stagger: .08, duration: .5, ease: "back.out(2)" }, "-=.3");
    gsap.to("#openToday", { scale: 1.05, duration: .9, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2.5 });
    gsap.to("h1 .hl", { rotation: -2, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2 });
    gsap.to(".countdown .flake", { rotation: 360, duration: 12, repeat: -1, ease: "none" });
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray(".block").forEach((s) => gsap.from(s.children, { y: 40, opacity: 0, stagger: .1, duration: .7, scrollTrigger: { trigger: s, start: "top 85%" } }));
    }
  }

  /* ---------- Header / menú ---------- */
  const menuBtn = $(".menu-toggle"), menu = $(".nav ul");
  menuBtn.addEventListener("click", () => menuBtn.setAttribute("aria-expanded", menu.classList.toggle("open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });
  const onScroll = () => $(".topbar").classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  if ((DEMO && !UNLOCK_ALL) || FORCED_DAY) {
    const f = document.createElement("div"); f.className = "demo-flag";
    f.textContent = DEMO ? "MODO DEMO · todo desbloqueado" : `Simulando: ${today} de diciembre`;
    document.body.appendChild(f);
  }
  updateProgress(); renderPrizes();
})();
