/* ============================================================
   MI-VAD prototype — scroll choreography
   Native scroll + sticky pin (no wheel hijacking) so it stays
   calm, smooth and works on trackpad / wheel / touch alike.
   A damped progress value gives motion a soft, soothing lag.
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // always open the demo at the very top (the calm intro)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("load", function () { window.scrollTo(0, 0); });

  var product   = document.getElementById("product");
  var device    = document.getElementById("device");
  var states    = Array.prototype.slice.call(document.querySelectorAll(".state-el"));
  var dots       = Array.prototype.slice.call(document.querySelectorAll("#dots .dot"));
  var nav        = document.getElementById("nav");
  var scrollHint = document.getElementById("scrollHint");

  /* ---- smooth-step easing for fade edges ---- */
  function smoothstep(edge0, edge1, x) {
    var t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
  function clamp01(x){ return Math.min(1, Math.max(0, x)); }

  /* opacity for a state element active across [from,to] with soft edges */
  function stateOpacity(p, from, to) {
    var fadeIn  = smoothstep(from, from + 0.06, p);
    var fadeOut = 1 - smoothstep(to - 0.06, to, p);
    return Math.min(fadeIn, fadeOut);
  }

  /* ---- raw scroll progress through the pinned product section ---- */
  function rawProgress() {
    if (!product) return 0;
    var rect = product.getBoundingClientRect();
    var scrollable = product.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp01(-rect.top / scrollable);
  }

  /* ---- paint the scroll-jack directly from scroll position ----
     Deterministic and synchronous: each scroll event sets the exact state, so
     there is no animation-loop lag and nothing to get stuck. The calm "breathe"
     of the device and the moving green are pure CSS (see styles.css), so the
     soothing motion never depends on JS timing. */
  function kick() {
    var p = rawProgress();

    // text states — opacity + a gentle vertical fade-drift via the --drift var
    states.forEach(function (el) {
      var from = parseFloat(el.getAttribute("data-from"));
      var to   = parseFloat(el.getAttribute("data-to"));
      var o = stateOpacity(p, from, to);
      el.style.opacity = o.toFixed(3);
      el.style.setProperty("--drift", ((1 - o) * 16).toFixed(1) + "px");
    });

    // device: reveals in, then fades out at the very end so it appears to settle
    // straight into the hero (calm crossfade handoff).
    var reveal = smoothstep(0, 0.12, p);
    var outro  = smoothstep(0.95, 1.0, p);
    var scale  = 0.9 + reveal * 0.1 + p * 0.05;
    if (device) {
      device.style.opacity = (reveal * (1 - outro)).toFixed(3);
      device.style.transform =
        "translateY(" + ((1 - reveal) * 30).toFixed(1) + "px) scale(" + scale.toFixed(3) + ")";
    }

    // state dots (3 phases)
    var phase = p < 0.40 ? 0 : (p < 0.64 ? 1 : 2);
    dots.forEach(function (d, i) { d.classList.toggle("is-active", i === phase); });
  }

  /* ---- nav + scroll hint visibility ---- */
  var hero = document.getElementById("hero");
  function chrome() {
    if (hero) {
      var hr = hero.getBoundingClientRect();
      nav.classList.toggle("is-visible", hr.top < window.innerHeight * 0.5);
    }
    if (scrollHint) scrollHint.style.opacity = window.scrollY > 80 ? "0" : "0.85";
  }

  /* ---- scale the fixed hero artboard to fit the viewport ---- */
  var heroArt = document.getElementById("heroArt");
  function scaleHero() {
    if (!heroArt) return;
    var avail = window.innerWidth - 48;           // a little side breathing room
    var availH = window.innerHeight - 150;        // leave room for nav + padding
    var s = Math.min(1, avail / 1440, availH / 824);
    heroArt.style.setProperty("--hs", s.toFixed(4));
  }

  window.addEventListener("scroll", function () { kick(); chrome(); }, { passive: true });
  window.addEventListener("resize", function () { kick(); scaleHero(); }, { passive: true });
  scaleHero();

  /* ---- reveal-on-enter for hero + closing ---- */
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("is-in"); });
    }, { threshold: 0.18 });
    document.querySelectorAll(".reveal, .reveal-soft").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal, .reveal-soft").forEach(function (el) { el.classList.add("is-in"); });
  }

  // initial paint
  kick(); chrome();

  /* ============================================================
     Narrative sections: stage scaling + scroll-driven line fill
     (opposite-contrast overlay drawn via stroke-dashoffset, both
     directions), block reveals, and per-word text fill.
     ============================================================ */
  var stages = Array.prototype.slice.call(document.querySelectorAll(".nstage"));
  function scaleStages() {
    var z = Math.min(1, window.innerWidth / 1440);
    stages.forEach(function (s) { s.style.zoom = z; });
  }

  // opposite-contrast fill colours
  var FILL = { ink: "#2d2f18", cream: "#f4f0e9" };

  // build a fill overlay path for every connecting line
  var lines = [];
  document.querySelectorAll(".jline").forEach(function (svg) {
    var base = svg.querySelector(".jl-base");
    if (!base) return;
    var fill = base.cloneNode(true);
    fill.setAttribute("class", "jl-fill");
    fill.setAttribute("stroke", FILL[svg.getAttribute("data-fill")] || "#2d2f18");
    fill.removeAttribute("stroke-opacity");
    svg.appendChild(fill);
    var len = 0;
    try { len = fill.getTotalLength(); } catch (e) { len = 0; }
    fill.style.strokeDasharray = len;
    fill.style.strokeDashoffset = len;
    lines.push({ svg: svg, fill: fill, len: len });
  });

  // split word-fill paragraphs into per-word spans
  var words = [];
  document.querySelectorAll(".wordfill").forEach(function (el) {
    var txt = el.textContent;
    el.textContent = "";
    txt.split(/(\s+)/).forEach(function (p) {
      if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); }
      else if (p) {
        var s = document.createElement("span");
        s.className = "wf-word"; s.textContent = p;
        el.appendChild(s);
      }
    });
    words.push({ el: el, spans: Array.prototype.slice.call(el.querySelectorAll(".wf-word")) });
  });

  var reveals = Array.prototype.slice.call(document.querySelectorAll(".jreveal"));

  function narrative() {
    var vh = window.innerHeight;
    // line fill tracks the scroll position (tip rides ~62% down the viewport)
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i];
      if (!L.len) continue;
      var r = L.svg.getBoundingClientRect();
      var p = clamp01((vh * 0.62 - r.top) / Math.max(r.height, vh * 0.28));
      L.fill.style.strokeDashoffset = (L.len * (1 - p)).toFixed(1);
    }
    // block reveals (faded → full)
    for (var j = 0; j < reveals.length; j++) {
      var er = reveals[j].getBoundingClientRect();
      var rp = clamp01((vh * 0.82 - er.top) / (vh * 0.32));
      reveals[j].style.opacity = (0.2 + 0.8 * rp).toFixed(3);
    }
    // per-word text fill
    for (var k = 0; k < words.length; k++) {
      var W = words[k];
      var wr = W.el.getBoundingClientRect();
      var wp = clamp01((vh * 0.72 - wr.top) / (wr.height * 0.55 + vh * 0.18));
      var lit = Math.round(wp * W.spans.length);
      for (var n = 0; n < W.spans.length; n++) {
        W.spans[n].classList.toggle("is-lit", n < lit);
      }
    }
  }

  window.addEventListener("scroll", narrative, { passive: true });
  window.addEventListener("resize", function () { scaleStages(); narrative(); }, { passive: true });
  scaleStages();
  narrative();
})();
