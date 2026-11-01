/* Registro a la junta de accionistas · Waystar RoyCo (Claude for Business, Sesión 7, Actividad 1).
   Funciona sola: registra en Supabase y muestra el contador. Los correos los manda la tarea programada de Claude. */
(function () {
  "use strict";
  const CFG = window.JUNTA_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Supabase ----------
  function encabezados(extra) {
    const h = Object.assign({ "Content-Type": "application/json", apikey: CFG.supabaseKey }, extra || {});
    if (CFG.supabaseKey && !CFG.supabaseKey.startsWith("sb_")) h.Authorization = "Bearer " + CFG.supabaseKey;
    return h;
  }
  const base = () => (CFG.supabaseUrl || "").replace(/\/$/, "");
  const listo = () => CFG.supabaseUrl && CFG.supabaseKey && !CFG.supabaseUrl.includes("TU-PROYECTO");

  async function contar() {
    if (!listo()) return null;
    try {
      const r = await fetch(base() + "/rest/v1/rpc/contar_asistentes", { method: "POST", headers: encabezados(), body: "{}" });
      return r.ok ? Number(await r.json()) : null;
    } catch (e) { return null; }
  }
  async function registrar(datos) {
    const r = await fetch(base() + "/rest/v1/asistentes", { method: "POST", headers: encabezados({ Prefer: "return=minimal" }), body: JSON.stringify(datos) });
    if (r.ok) return { ok: true };
    let info = {}; try { info = await r.json(); } catch (e) { /* sin cuerpo */ }
    if (r.status === 409 || info.code === "23505") return { ok: false, mensaje: "Ya está registrado con ese correo. Le confirmamos por correo." };
    if (info.code === "23514") return { ok: false, mensaje: "Revise sus datos: el correo no tiene el formato correcto o la pregunta es muy larga." };
    return { ok: false, mensaje: "No pudimos registrarlo en este momento. Intente de nuevo en un minuto." };
  }

  // ---------- Contador animado ----------
  let mostrado = 0;
  function animarNumero(hasta) {
    if (!$("cuantos")) $("lista").innerHTML = 'Ya hay <b id="cuantos">…</b> <span id="cuantos-txt">accionistas registrados</span>';
    const el = $("cuantos"); if (hasta == null) { el.textContent = "…"; return; }
    $("cuantos-txt").textContent = hasta === 1 ? "accionista registrado" : "accionistas registrados";
    const desde = mostrado; mostrado = hasta;
    if (quieto || desde === hasta) { el.textContent = hasta.toLocaleString("es-MX"); return; }
    const t0 = performance.now(), dur = 900;
    (function paso(t) {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - k, 3)));
      el.textContent = v.toLocaleString("es-MX"); if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }
  async function refrescar() { const n = await contar(); if (n != null) animarNumero(n); else if (!mostrado) $("lista").textContent = "Sea de los primeros accionistas en registrarse"; }
  refrescar(); setInterval(() => { if (!document.hidden) refrescar(); }, 15000);

  // ---------- La fecha de la junta: la da la base (datos_junta); nunca está escrita en un archivo ----------
  const NY = "America/New_York";
  function desfaseNY(ymd) {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: NY, timeZoneName: "shortOffset" }).formatToParts(new Date(ymd + "T15:00:00Z"));
    const m = ((p.find((x) => x.type === "timeZoneName") || {}).value || "GMT-5").match(/GMT([+-])(\d+)/);
    return m ? m[1] + m[2].padStart(2, "0") + ":00" : "-05:00";
  }
  function siguienteJunta() { // sin base: el primer jueves a 28 días o más, a las 10:00 h de Nueva York
    const d = new Date(Date.now() + 28 * 864e5);
    const dia = new Intl.DateTimeFormat("en-US", { timeZone: NY, weekday: "short" }).format(d);
    const j = new Date(d.getTime() + ((11 - ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(dia) - 1) % 7) * 864e5);
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: NY, year: "numeric", month: "2-digit", day: "2-digit" }).format(j);
    return new Date(ymd + "T10:00:00" + desfaseNY(ymd));
  }
  async function fechaJunta() {
    if (listo()) {
      try {
        const r = await fetch(base() + "/rest/v1/rpc/datos_junta", { method: "POST", headers: encabezados(), body: "{}" });
        if (r.ok) { const j = await r.json(); if (j && j.fecha) return { fecha: new Date(j.fecha), cierre: new Date(j.cierre_registro) }; }
      } catch (e) { /* sin base: se calcula aquí */ }
    }
    const f = siguienteJunta();
    return { fecha: f, cierre: new Date(f.getTime() - 16 * 3600e3) };
  }
  const enNY = (d, op) => new Intl.DateTimeFormat("es-MX", Object.assign({ timeZone: NY }, op)).format(d);
  const diaTexto = (d) => { const s = enNY(d, { weekday: "long" }); return s.charAt(0).toUpperCase() + s.slice(1) + " " + enNY(d, { day: "numeric" }) + " de " + enNY(d, { month: "long" }); };
  const horaTexto = (d) => enNY(d, { hour: "2-digit", minute: "2-digit", hour12: false }) + " h";

  // ---------- Cuenta regresiva ----------
  let meta = 0;
  const dos = (n) => String(n).padStart(2, "0");
  function reloj() {
    let s = Math.max(0, Math.floor((meta - Date.now()) / 1000));
    if (s === 0) { document.querySelector(".reloj").innerHTML = '<div style="min-width:auto"><b>Hoy es la junta</b><span>En persona y en línea</span></div>'; return false; }
    $("r-dias").textContent = dos(Math.floor(s / 86400)); s %= 86400;
    $("r-horas").textContent = dos(Math.floor(s / 3600)); s %= 3600;
    $("r-min").textContent = dos(Math.floor(s / 60)); $("r-seg").textContent = dos(s % 60);
    return true;
  }
  fechaJunta().then(({ fecha, cierre }) => {
    meta = fecha.getTime();
    $("fecha-junta").textContent = diaTexto(fecha) + ", " + horaTexto(fecha) + ", hora de Nueva York";
    $("cierre-junta").textContent = "El registro cierra el " + diaTexto(cierre).toLowerCase() + " a las " + horaTexto(cierre) + ".";
    if (reloj()) { const id = setInterval(() => { if (!reloj()) clearInterval(id); }, 1000); }
  });

  // ---------- Efecto 3D ----------
  const tarjeta = $("tarjeta3d"), escena = $("escena");
  function inclinar(x, y) { // x, y entre -1 y 1
    tarjeta.style.setProperty("--ry", (x * 14).toFixed(2) + "deg");
    tarjeta.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
    tarjeta.style.setProperty("--gx", (50 + x * 40).toFixed(0) + "%");
    tarjeta.style.setProperty("--gy", (30 + y * 40).toFixed(0) + "%");
  }
  if (!quieto) {
    escena.addEventListener("pointermove", (e) => { const r = escena.getBoundingClientRect(); inclinar(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1); });
    escena.addEventListener("pointerleave", () => inclinar(0, 0));
    const mover = () => window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null) return; inclinar(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    });
    // En iPhone el movimiento pide permiso, y solo se puede pedir con un toque.
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
      document.addEventListener("click", () => {
        DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") mover(); }).catch(() => {});
      }, { once: true });
    } else { mover(); }
  }

  // ---------- Modalidad: cambia la credencial y el registro ----------
  function elegir(valor) {
    document.querySelectorAll(".opcion").forEach((b) => {
      const si = b.dataset.valor === valor;
      b.classList.toggle("activa", si); b.setAttribute("aria-checked", si ? "true" : "false");
      if (si) {
        const img = $("credencial"); img.classList.add("cambiando");
        setTimeout(() => { img.src = b.dataset.img; img.alt = "Credencial de accionista de Waystar RoyCo para asistir " + valor.toLowerCase(); img.classList.remove("cambiando"); }, 200);
      }
    });
    const radio = document.querySelector('input[name="modalidad"][value="' + valor + '"]'); if (radio) radio.checked = true;
  }
  document.querySelectorAll(".opcion").forEach((b) => b.addEventListener("click", () => {
    elegir(b.dataset.valor);
    if (!quieto) document.getElementById("inicio").scrollIntoView({ behavior: "smooth" });
  }));
  document.querySelectorAll('input[name="modalidad"]').forEach((r) => r.addEventListener("change", () => elegir(r.value)));

  // ---------- Aparecer al bajar ----------
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }), { threshold: .15 }) : null;
  document.querySelectorAll(".aparece").forEach((el) => io ? io.observe(el) : el.classList.add("visible"));

  // ---------- Contador de caracteres de la pregunta ----------
  const pregunta = $("pregunta");
  pregunta.addEventListener("input", () => { $("cuenta").textContent = pregunta.value.length + " de 280"; });

  // ---------- Registro ----------
  const forma = $("forma");
  forma.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const msg = $("mensaje"), btn = $("enviar");
    const nombre = $("nombre").value.trim().replace(/\s+/g, " ");
    const correo = $("correo").value.trim().toLowerCase();
    const modalidad = (forma.querySelector('input[name="modalidad"]:checked') || {}).value || "En persona";
    const texto = pregunta.value.trim().replace(/\s+/g, " ");
    ["nombre", "correo", "pregunta"].forEach((id) => $(id).removeAttribute("aria-invalid"));
    if (nombre.length < 2) { msg.textContent = "Escriba su nombre."; $("nombre").setAttribute("aria-invalid", "true"); $("nombre").focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(correo)) { msg.textContent = "Revise su correo: le falta algo."; $("correo").setAttribute("aria-invalid", "true"); $("correo").focus(); return; }
    if (texto.length > 280) { msg.textContent = "Su pregunta pasa de 280 caracteres."; $("pregunta").setAttribute("aria-invalid", "true"); $("pregunta").focus(); return; }
    if (!listo()) { msg.textContent = "La página todavía no está conectada a la base de datos."; return; }
    msg.textContent = ""; btn.disabled = true; btn.textContent = "Registrando…";
    try {
      const r = await registrar({ nombre, correo, modalidad, pregunta: texto || null });
      if (!r.ok) { msg.textContent = r.mensaje; return; }
      forma.hidden = true; $("gracias").hidden = false;
      $("gracias-titulo").textContent = "Su registro quedó, " + nombre.split(" ")[0];
      $("gracias").scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "center" });
      confeti(); refrescar();
    } catch (e) { msg.textContent = "Sin conexión. Revise su internet e intente de nuevo."; }
    finally { btn.disabled = false; btn.textContent = "Registrarme"; }
  });

  // ---------- Confeti dorado ----------
  function confeti() {
    if (quieto) return;
    const cv = $("confeti"), cx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.scale(dpr, dpr);
    const colores = ["#A8894A", "#D9C08A", "#1C2B44", "#F3EFE6"];
    const ps = Array.from({ length: 110 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .55, vx: (Math.random() - .5) * 11, vy: -Math.random() * 13 - 6, w: Math.random() * 8 + 4, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: colores[Math.floor(Math.random() * colores.length)] }));
    const t0 = performance.now();
    (function cuadro(t) {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach((p) => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); cx.restore(); });
      if (t - t0 < 3000) requestAnimationFrame(cuadro); else cx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }
})();
