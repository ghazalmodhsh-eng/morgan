/* =========================================================
   مَرجان — Marjan Seafood House
   GSAP + ScrollTrigger + Lenis
   ========================================================= */

(() => {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const safe = (name, fn) => {
    try { fn(); } catch (err) { console.warn(`[Marjan] ${name} failed:`, err); }
  };

  /** Split element text into word spans (keeps Arabic shaping intact). */
  function splitWords(el, mask = false) {
    if (!el || el.dataset.split === "true") return $$(".w", el);
    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.textContent = part;
            if (mask) {
              const wrap = document.createElement("span");
              wrap.className = "w-wrap";
              wrap.appendChild(w);
              frag.appendChild(wrap);
            } else {
              frag.appendChild(w);
            }
            words.push(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
    el.dataset.split = "true";
    el.classList.add("is-split");
    return words;
  }

  const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = toArabicDigits(new Date().getFullYear());

  /* =========================================================
     Smooth scroll (Lenis)
     ========================================================= */
  let lenis = null;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  safe("lenis", () => {
    if (!hasGSAP || prefersReduced || typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    if (hasST) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  });

  const lockScroll = () => {
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";
  };
  const unlockScroll = () => {
    if (lenis) lenis.start();
    document.documentElement.style.overflow = "";
  };

  function scrollToTarget(selector) {
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    }
  }

  /* Shared overlay-menu state (declared early: used by header & anchors) */
  const menuState = { open: false, openMenu: null, closeMenu: null };

  /* =========================================================
     Initial states (set before first paint behind loader)
     ========================================================= */
  function setInitialStates() {
    gsap.set(".hero .line__inner", { yPercent: 118 });
    gsap.set(".hero .reveal-up", { y: 40, autoAlpha: 0 });
    gsap.set(".hero__badge", { scale: 0, rotate: -120 });
    gsap.set(".header > *", { y: -30, autoAlpha: 0 });
    gsap.set(".hero__bottom", { autoAlpha: 0, y: 20 });
    gsap.set(".hero__video", { scale: 1.4 });
  }

  /* =========================================================
     Loader
     ========================================================= */
  function runLoader(onReveal) {
    const loader = $("#loader");
    if (!loader) { onReveal(); return; }
    lockScroll();

    const countEl = $("#loaderCount");
    const barEl = $("#loaderBar");
    const wordEl = $("#loaderWord");
    const state = { v: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        loader.style.display = "none";
        document.body.classList.remove("is-loading");
      }
    });

    tl.from(".loader__eyebrow", { autoAlpha: 0, y: 10, duration: 0.8, ease: "power3.out" })
      .from(wordEl, { autoAlpha: 0, scale: 0.92, duration: 1.2, ease: "expo.out" }, 0)
      .to(state, {
        v: 100,
        duration: 2.3,
        ease: "power2.inOut",
        onUpdate: () => {
          const v = state.v;
          countEl.textContent = Math.round(v);
          gsap.set(barEl, { scaleX: v / 100 });
          wordEl.style.backgroundPosition = `0% ${v}%`;
        }
      }, 0.2)
      .to(".loader__inner", { yPercent: -30, autoAlpha: 0, duration: 0.7, ease: "power3.in" })
      .to(".loader__panel--a", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.15")
      .to(".loader__panel--b", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.92")
      .add(() => { unlockScroll(); onReveal(); }, "-=0.75");
  }

  /* =========================================================
     Hero intro
     ========================================================= */
  function heroIntro() {
    const tl = gsap.timeline();
    tl.to(".hero__video", { scale: 1.15, duration: 2.6, ease: "expo.out" }, 0)
      .to(".hero .line__inner", { yPercent: 0, duration: 1.5, stagger: 0.13, ease: "expo.out" }, 0.1)
      .to(".hero .reveal-up", { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.1, ease: "power3.out" }, 0.55)
      .to(".hero__badge", { scale: 1, rotate: 0, duration: 1.6, ease: "expo.out" }, 0.7)
      .to(".header > *", { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.5)
      .to(".hero__bottom", { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }, 1.1);
  }

  /* =========================================================
     Hero: video, bubbles canvas, living waves, parallax
     ========================================================= */
  function initHero() {
    const video = $("#heroVideo");
    if (video) {
      video.muted = true;
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    // rotating badge
    gsap.to(".hero__badge-ring", { rotation: 360, duration: 22, repeat: -1, ease: "none", transformOrigin: "50% 50%" });

    // floating catch card
    gsap.to(".hero__catch", { yPercent: -12, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });

    // scroll parallax
    if (hasST) {
      gsap.to(".hero__media", {
        yPercent: 22, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.to(".hero__content", {
        y: -140, autoAlpha: 0, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "85% top", scrub: true }
      });
      gsap.to(".hero__badge", {
        yPercent: -80, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }

    // mouse parallax
    if (isFinePointer && video) {
      const hero = $(".hero");
      const vx = gsap.quickTo(video, "x", { duration: 1.2, ease: "power3.out" });
      const vy = gsap.quickTo(video, "y", { duration: 1.2, ease: "power3.out" });
      const core = $(".hero__badge-core");
      const cx = gsap.quickTo(core, "x", { duration: 0.8, ease: "power3.out" });
      const cy = gsap.quickTo(core, "y", { duration: 0.8, ease: "power3.out" });
      hero.addEventListener("mousemove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        vx(nx * -30); vy(ny * -20);
        cx(nx * 14); cy(ny * 14);
      });
    }

    // Bubbles + waves loop
    const canvas = $("#bubbles");
    const wave1 = $("#wavePath1");
    const wave2 = $("#wavePath2");
    const ctx = canvas ? canvas.getContext("2d") : null;
    let w = 0, h = 0, bubbles = [];
    let active = true;

    const makeBubble = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10 + Math.random() * 40,
      r: Math.random() * 2.4 + 0.6,
      s: Math.random() * 0.55 + 0.2,
      wob: Math.random() * Math.PI * 2,
      ws: Math.random() * 0.02 + 0.006,
      a: Math.random() * 0.45 + 0.12
    });

    const resize = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = w < 700 ? 26 : 56;
      bubbles = Array.from({ length: target }, () => makeBubble(true));
    };
    resize();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    const W = 1440, H = 110, SEG = 40;
    const wavePath = (t, amp, base, freq, phase) => {
      let d = `M0 ${H} `;
      for (let i = 0; i <= SEG; i++) {
        const p = i / SEG;
        const x = p * W;
        const y = base
          + Math.sin(p * Math.PI * 2 * freq + t + phase) * amp
          + Math.sin(p * Math.PI * 5 * freq - t * 1.3 + phase) * amp * 0.28;
        d += `L${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      return d + `L${W} ${H} Z`;
    };

    let t = 0;
    const tick = () => {
      if (!active) return;
      t += 0.012;
      if (wave1 && wave2) {
        wave1.setAttribute("d", wavePath(t, 12, 52, 1.2, 0));
        wave2.setAttribute("d", wavePath(t * 1.25, 10, 72, 1, 2));
      }
      if (!ctx || prefersReduced) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.s;
        b.wob += b.ws;
        const x = b.x + Math.sin(b.wob) * 10;
        if (b.y < -10) { bubbles[i] = makeBubble(false); continue; }
        const fade = Math.min(1, b.y / (h * 0.35));
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 207, 152, ${b.a * fade})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.a * fade * 0.9})`;
        ctx.fill();
      }
    };
    gsap.ticker.add(tick);

    if (hasST) {
      ScrollTrigger.create({
        trigger: ".hero", start: "top bottom", end: "bottom top",
        onToggle: (self) => { active = self.isActive; }
      });
    }
  }

  /* =========================================================
     Custom cursor
     ========================================================= */
  function initCursor() {
    if (!isFinePointer) return;
    const cursor = $("#cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    const label = $("#cursorLabel");
    if (!cursor || !dot || !ring) return;
    document.body.classList.add("has-cursor");

    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

    window.addEventListener("mousemove", (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      cursor.classList.remove("is-hidden");
    }, { passive: true });

    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));

    document.addEventListener("mouseover", (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const view = target.closest("[data-cursor]");
      const hover = target.closest("a, button, .menu-item, input, select, textarea, label");
      if (view) {
        label.textContent = view.getAttribute("data-cursor") || "";
        cursor.classList.add("is-view");
        cursor.classList.remove("is-hover");
      } else if (hover) {
        cursor.classList.add("is-hover");
        cursor.classList.remove("is-view");
      } else {
        cursor.classList.remove("is-hover", "is-view");
      }
    });
  }

  /* =========================================================
     Magnetic elements
     ========================================================= */
  function initMagnetic() {
    if (!isFinePointer) return;
    $$(".magnetic").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  /* =========================================================
     Header: hide on scroll, active links, progress
     ========================================================= */
  function initHeader() {
    const header = $("#header");
    if (!header || !hasST) return;
    let hidden = false;

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        header.classList.toggle("is-scrolled", y > 60);
        if (menuState.open) return;
        const shouldHide = y > 500 && self.direction === 1;
        if (shouldHide !== hidden) {
          hidden = shouldHide;
          gsap.to(header, { yPercent: hidden ? -110 : 0, duration: 0.6, ease: "power3.out", overwrite: true });
        }
      }
    });

    gsap.to("#progressBar", {
      scaleX: 1, ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
    });

    const links = $$(".nav__link");
    links.forEach((link) => {
      const id = link.getAttribute("href");
      const section = id ? $(id) : null;
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) {
            links.forEach((l) => l.classList.toggle("is-active", l === link));
          } else if (link.classList.contains("is-active")) {
            link.classList.remove("is-active");
          }
        }
      });
    });
  }

  /* =========================================================
     Fullscreen overlay menu
     ========================================================= */

  function initOverlayMenu() {
    const burger = $("#burger");
    const overlay = $("#overlayMenu");
    const bg = $(".overlay-menu__bg");
    if (!burger || !overlay || !bg) return;

    const links = $$(".om-link span", overlay);
    const nums = $$(".om-link em", overlay);
    const info = $$(".om-fade", overlay);

    const circle = (r) => {
      const b = burger.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      return `circle(${r}px at ${cx}px ${cy}px)`;
    };
    const maxR = () => Math.hypot(window.innerWidth, window.innerHeight) * 1.05;

    let tl = null;

    menuState.openMenu = () => {
      if (menuState.open) return;
      menuState.open = true;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      burger.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "إغلاق القائمة");
      gsap.to("#header", { yPercent: 0, duration: 0.4, overwrite: true });
      lockScroll();
      if (tl) tl.kill();
      tl = gsap.timeline();
      tl.fromTo(bg, { clipPath: circle(0) }, { clipPath: circle(maxR()), duration: 1, ease: "expo.inOut" })
        .fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.07, ease: "expo.out" }, 0.45)
        .fromTo(nums, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.07 }, 0.6)
        .fromTo(info, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.8);
    };

    menuState.closeMenu = (cb) => {
      if (!menuState.open) { if (cb) cb(); return; }
      menuState.open = false;
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "فتح القائمة");
      if (tl) tl.kill();
      tl = gsap.timeline({
        onComplete: () => {
          overlay.classList.remove("is-open");
          overlay.setAttribute("aria-hidden", "true");
          unlockScroll();
          if (cb) cb();
        }
      });
      tl.to([...info, ...nums], { autoAlpha: 0, duration: 0.3 }, 0)
        .to(links, { yPercent: -110, duration: 0.5, stagger: 0.03, ease: "power3.in" }, 0)
        .to(bg, { clipPath: circle(0), duration: 0.8, ease: "expo.inOut" }, 0.25);
    };

    burger.addEventListener("click", () => {
      if (menuState.open) menuState.closeMenu();
      else menuState.openMenu();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuState.open) menuState.closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100 && menuState.open) menuState.closeMenu();
    });
  }

  /* =========================================================
     Anchor links
     ========================================================= */
  function initAnchors() {
    document.addEventListener("click", (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const link = target ? target.closest("a[data-scroll]") : null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      e.preventDefault();
      if (menuState.open && menuState.closeMenu) {
        menuState.closeMenu(() => scrollToTarget(href));
      } else {
        scrollToTarget(href);
      }
    });
  }

  /* =========================================================
     Marquee (scroll-velocity aware)
     ========================================================= */
  function initMarquee() {
    const track = $("#marqueeTrack");
    if (!track) return;
    const loop = gsap.to(track, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    loop.totalTime(loop.duration() * 200); // allows reverse playback

    if (!hasST) return;
    let dir = 1;
    ScrollTrigger.create({
      trigger: ".marquee",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        dir = self.direction === 1 ? 1 : -1;
        const boost = gsap.utils.clamp(1, 6, Math.abs(self.getVelocity()) / 300);
        gsap.to(loop, {
          timeScale: dir * boost, duration: 0.25, ease: "power2.out", overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out", overwrite: true })
        });
      }
    });
    // keep defaults tidy
    gsap.from(".marquee__group span", {
      yPercent: 60, autoAlpha: 0, duration: 1.2, stagger: 0.04, ease: "expo.out",
      scrollTrigger: { trigger: ".marquee", start: "top 90%", once: true }
    });
  }

  /* =========================================================
     Generic scroll reveals
     ========================================================= */
  function initReveals() {
    if (!hasST) return;

    // fade-up elements (outside hero)
    $$(".reveal-up").filter((el) => !el.closest(".hero")).forEach((el) => {
      gsap.from(el, {
        y: 50, autoAlpha: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    // masked split titles
    $$(".split-title").forEach((el) => {
      const words = splitWords(el, true);
      gsap.from(words, {
        yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.09, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // image clip reveals
    $$(".clip-reveal").forEach((el) => {
      const img = $("img", el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      tl.fromTo(el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", clearProps: "clipPath" });
      if (img) tl.fromTo(img, { scale: 1.45 }, { scale: 1, duration: 2, ease: "expo.out" }, 0.25);
    });

    // counters
    $$(".count").forEach((el) => {
      const end = parseFloat(el.dataset.count || "0");
      const dec = parseInt(el.dataset.decimals || "0", 10);
      const o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 2.4, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: () => { el.textContent = o.v.toFixed(dec); }
      });
    });
  }

  /* =========================================================
     About: word-by-word illumination + parallax
     ========================================================= */
  function initAbout() {
    if (!hasST) return;
    const statement = $("#aboutStatement");
    if (statement) {
      const words = splitWords(statement);
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 50%", scrub: true }
      });
    }
    gsap.to(".about__img--small", {
      y: -90, ease: "none",
      scrollTrigger: { trigger: ".about__visual", start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.fromTo(".about__seal", { rotate: -40, scale: 0.6 }, {
      rotate: 20, scale: 1, ease: "none",
      scrollTrigger: { trigger: ".about__visual", start: "top 90%", end: "bottom 30%", scrub: true }
    });
  }

  /* =========================================================
     Signature dishes: pinned horizontal scroll (desktop)
     ========================================================= */
  function initSignature() {
    if (!hasST) return;
    const section = $("#signature");
    const track = $("#sigTrack");
    if (!section || !track) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const getDist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const progress = $("#sigProgress");

      // RTL layout: track overflows to the left, so positive x reveals it
      gsap.to(track, {
        x: () => getDist(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + getDist(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => { if (progress) gsap.set(progress, { scaleX: self.progress }); }
        }
      });

      gsap.from(".dish", {
        y: 80, autoAlpha: 0, duration: 1.3, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: section, start: "top 70%", once: true }
      });
    });

    mm.add("(max-width: 900px)", () => {
      gsap.from(".dish", {
        x: -60, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: track, start: "top 85%", once: true }
      });
    });

    // title (not part of .split-title list because it's pinned)
    const title = $(".signature__head .section-title");
    if (title) {
      const words = splitWords(title, true);
      gsap.from(words, {
        yPercent: 115, duration: 1.4, stagger: 0.09, ease: "expo.out",
        scrollTrigger: { trigger: section, start: "top 75%", once: true }
      });
    }
  }

  /* =========================================================
     Menu: tabs + hover image
     ========================================================= */
  function initMenu() {
    const tabsWrap = $(".menu__tabs");
    const tabs = $$(".menu__tab");
    const panels = $$(".menu__panel");
    const ind = $("#tabInd");
    if (!tabsWrap || !tabs.length) return;

    let current = (tabs.find((t) => t.classList.contains("is-active")) || tabs[0]).dataset.tab;
    let tl = null;
    let refreshTimer;

    const moveInd = (tab, instant) => {
      if (!ind || !tab) return;
      const r = tab.getBoundingClientRect();
      const p = tabsWrap.getBoundingClientRect();
      gsap.to(ind, {
        x: r.left - p.left - tabsWrap.clientLeft,
        y: r.top - p.top - tabsWrap.clientTop,
        width: r.width,
        height: r.height,
        duration: instant ? 0 : 0.7,
        ease: "expo.out",
        overwrite: true
      });
    };

    const activate = (name) => {
      if (name === current) return;
      const outPanel = panels.find((p) => p.dataset.panel === current);
      const inPanel = panels.find((p) => p.dataset.panel === name);
      if (!inPanel) return;
      current = name;

      tabs.forEach((t) => {
        const on = t.dataset.tab === name;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      moveInd(tabs.find((t) => t.dataset.tab === name));

      if (tl) tl.kill();
      tl = gsap.timeline();
      if (outPanel && outPanel.classList.contains("is-active")) {
        tl.to(outPanel.children, { autoAlpha: 0, y: -18, duration: 0.28, stagger: 0.03, ease: "power2.in" });
      }
      tl.add(() => {
        panels.forEach((p) => p.classList.toggle("is-active", p === inPanel));
        panels.forEach((p) => { if (p !== inPanel) gsap.set(p.children, { clearProps: "opacity,visibility,transform" }); });
        if (hasST) {
          clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
        }
      });
      tl.fromTo(inPanel.children,
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "expo.out" });
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => activate(tab.dataset.tab));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowLeft") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowRight") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) { e.preventDefault(); next.focus(); activate(next.dataset.tab); }
      });
    });

    const placeInd = () => moveInd(tabs.find((t) => t.dataset.tab === current), true);
    placeInd();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeInd);
    window.addEventListener("resize", placeInd);
    window.addEventListener("load", placeInd);

    // initial items reveal
    if (hasST) {
      const firstPanel = panels.find((p) => p.classList.contains("is-active"));
      if (firstPanel) {
        gsap.from(firstPanel.children, {
          y: 40, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "expo.out",
          scrollTrigger: { trigger: firstPanel, start: "top 85%", once: true }
        });
      }
      gsap.from(tabsWrap, {
        y: 30, autoAlpha: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: tabsWrap, start: "top 90%", once: true }
      });
    }

    // floating hover image
    if (!isFinePointer) return;
    const hover = $("#hoverImg");
    const hoverImg = $("#hoverImgEl");
    if (!hover || !hoverImg) return;

    // preload
    const preload = () => $$(".menu-item").forEach((it) => { const im = new Image(); im.src = it.dataset.img; });
    if (document.readyState === "complete") setTimeout(preload, 1500);
    else window.addEventListener("load", () => setTimeout(preload, 1500));

    gsap.set(hover, { xPercent: -50, yPercent: -50, scale: 0.7 });
    const xTo = gsap.quickTo(hover, "x", { duration: 0.7, ease: "power3.out" });
    const yTo = gsap.quickTo(hover, "y", { duration: 0.7, ease: "power3.out" });
    const rTo = gsap.quickTo(hover, "rotation", { duration: 0.9, ease: "power3.out" });
    let lastX = 0;

    window.addEventListener("mousemove", (e) => {
      xTo(e.clientX - 170);
      yTo(e.clientY);
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      rTo(gsap.utils.clamp(-12, 12, dx * 0.6));
    }, { passive: true });

    $$(".menu-item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        if (item.dataset.img) hoverImg.src = item.dataset.img;
        hoverImg.alt = ($("h4", item) || {}).textContent || "";
        gsap.to(hover, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out", overwrite: "auto" });
      });
      item.addEventListener("mouseleave", () => {
        gsap.to(hover, { autoAlpha: 0, scale: 0.7, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      });
    });
  }

  /* =========================================================
     Chef section
     ========================================================= */
  function initChef() {
    if (!hasST) return;
    const img = $(".chef__img img");
    if (img) {
      gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: -14, ease: "none",
        scrollTrigger: { trigger: ".chef__img", start: "top bottom", end: "bottom top", scrub: true }
      });
    }
    const path = $("#sigPath");
    if (path && typeof path.getTotalLength === "function") {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, {
        strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut",
        scrollTrigger: { trigger: ".chef__signature", start: "top 92%", once: true }
      });
    }
    gsap.from(".chef__awards strong", {
      yPercent: 100, autoAlpha: 0, duration: 1, stagger: 0.12, ease: "expo.out",
      scrollTrigger: { trigger: ".chef__awards", start: "top 90%", once: true }
    });
  }

  /* =========================================================
     Band (quote)
     ========================================================= */
  function initBand() {
    if (!hasST) return;
    gsap.fromTo(".band__bg", { yPercent: -10 }, {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true }
    });
    const text = $("#bandText");
    if (text) {
      const words = splitWords(text);
      gsap.fromTo(words, { autoAlpha: 0.08, y: 30 }, {
        autoAlpha: 1, y: 0, stagger: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: ".band", start: "top 70%", end: "center 45%", scrub: true }
      });
    }
  }

  /* =========================================================
     Gallery
     ========================================================= */
  function initGallery() {
    if (!hasST) return;
    $$(".gallery__col").forEach((col) => {
      const speed = parseFloat(col.dataset.speed || "0");
      gsap.fromTo(col, { y: -speed }, {
        y: speed, ease: "none",
        scrollTrigger: { trigger: ".gallery__grid", start: "top bottom", end: "bottom top", scrub: true }
      });
    });
    $$(".g-item").forEach((item) => {
      gsap.fromTo(item,
        { clipPath: "inset(12% 12% 12% 12%)", autoAlpha: 0 },
        {
          clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, duration: 1.4, ease: "expo.out", clearProps: "clipPath",
          scrollTrigger: { trigger: item, start: "top 92%", once: true }
        });
    });
  }

  /* =========================================================
     Testimonials slider
     ========================================================= */
  function initTestimonials() {
    const slides = $$(".testi__slide");
    const prev = $("#testiPrev");
    const next = $("#testiNext");
    const cur = $("#testiCur");
    const total = $("#testiTotal");
    if (!slides.length) return;

    const pad = (n) => String(n).padStart(2, "0");
    if (total) total.textContent = pad(slides.length);
    const wordsBySlide = slides.map((s) => splitWords($("blockquote", s)));

    let idx = 0;
    let busy = false;
    let auto = null;

    const go = (n) => {
      if (busy) return;
      const nextIdx = (n + slides.length) % slides.length;
      if (nextIdx === idx) return;
      busy = true;
      const outSlide = slides[idx];
      const inSlide = slides[nextIdx];
      const outWords = wordsBySlide[idx];
      const inWords = wordsBySlide[nextIdx];
      const outCap = $("figcaption", outSlide);
      const inCap = $("figcaption", inSlide);

      gsap.timeline({ onComplete: () => { busy = false; } })
        .to(outWords, { autoAlpha: 0, y: -24, duration: 0.4, stagger: 0.012, ease: "power2.in" })
        .to(outCap, { autoAlpha: 0, y: -10, duration: 0.3 }, 0)
        .add(() => {
          outSlide.classList.remove("is-active");
          inSlide.classList.add("is-active");
          gsap.set(outWords, { clearProps: "opacity,visibility,transform" });
          gsap.set(outCap, { clearProps: "opacity,visibility,transform" });
          if (cur) cur.textContent = pad(nextIdx + 1);
        })
        .fromTo(inWords, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.03, ease: "expo.out" })
        .fromTo(inCap, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.6");

      idx = nextIdx;
      restartAuto();
    };

    const restartAuto = () => {
      if (auto) auto.kill();
      auto = gsap.delayedCall(7, () => go(idx + 1));
    };

    if (next) next.addEventListener("click", () => go(idx + 1));
    if (prev) prev.addEventListener("click", () => go(idx - 1));

    // swipe
    const wrap = $(".testi__wrap");
    let sx = null;
    if (wrap) {
      wrap.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
      wrap.addEventListener("touchend", (e) => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) go(dx > 0 ? idx + 1 : idx - 1);
        sx = null;
      });
    }

    if (hasST) {
      ScrollTrigger.create({
        trigger: ".testi",
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          if (self.isActive) restartAuto();
          else if (auto) auto.kill();
        }
      });
      gsap.from(wordsBySlide[0], {
        autoAlpha: 0, y: 34, duration: 1, stagger: 0.03, ease: "expo.out",
        scrollTrigger: { trigger: ".testi__slides", start: "top 85%", once: true }
      });
      gsap.from(".testi__mark", {
        scale: 0, rotate: -30, duration: 1.2, ease: "back.out(2)",
        scrollTrigger: { trigger: ".testi__mark", start: "top 90%", once: true }
      });
    } else {
      restartAuto();
    }
  }

  /* =========================================================
     Reservation section + modal
     ========================================================= */
  function initReserveAnim() {
    if (!hasST) return;
    gsap.from(".reserve__form", {
      y: 80, autoAlpha: 0, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: ".reserve__form", start: "top 88%", once: true }
    });
    gsap.from(".reserve__form > *", {
      y: 30, autoAlpha: 0, duration: 1, stagger: 0.07, ease: "power3.out", delay: 0.2,
      scrollTrigger: { trigger: ".reserve__form", start: "top 88%", once: true }
    });
    gsap.fromTo(".reserve__bg img", { scale: 1.25 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: ".reserve", start: "top bottom", end: "bottom bottom", scrub: true }
    });
  }

  const modal = {
    el: null,
    open(title, text) {
      const el = this.el || (this.el = $("#modal"));
      if (!el) return;
      $("#modalTitle").textContent = title;
      $("#modalText").textContent = text;
      el.classList.add("is-open");
      el.setAttribute("aria-hidden", "false");
      lockScroll();
      if (!hasGSAP) {
        $(".modal__backdrop", el).style.opacity = 1;
        $(".modal__card", el).style.opacity = 1;
        return;
      }
      const circle = $("#checkCircle");
      const mark = $("#checkMark");
      const cl = circle.getTotalLength ? circle.getTotalLength() : 230;
      const ml = mark.getTotalLength ? mark.getTotalLength() : 60;
      gsap.timeline()
        .to($(".modal__backdrop", el), { opacity: 1, duration: 0.5 })
        .fromTo($(".modal__card", el), { opacity: 0, y: 40, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out" }, 0.1)
        .fromTo(circle, { strokeDasharray: cl, strokeDashoffset: cl }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.3)
        .fromTo(mark, { strokeDasharray: ml, strokeDashoffset: ml }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 1)
        .fromTo($$(".modal__card h3, .modal__card p, .modal__card .btn", el), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.5);
      const btn = $(".modal__card .btn", el);
      if (btn) setTimeout(() => btn.focus({ preventScroll: true }), 400);
    },
    close() {
      const el = this.el || (this.el = $("#modal"));
      if (!el || !el.classList.contains("is-open")) return;
      const done = () => {
        el.classList.remove("is-open");
        el.setAttribute("aria-hidden", "true");
        unlockScroll();
      };
      if (!hasGSAP) { done(); return; }
      gsap.timeline({ onComplete: done })
        .to($(".modal__card", el), { opacity: 0, y: 20, scale: 0.96, duration: 0.35, ease: "power2.in" })
        .to($(".modal__backdrop", el), { opacity: 0, duration: 0.35 }, 0.1);
    }
  };

  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (t && t.closest("[data-close]")) modal.close();
  });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.close(); });

  /* =========================================================
     Form logic (works with or without GSAP)
     ========================================================= */
  function initDateLimits() {
    const date = $("#fDate");
    if (!date) return;
    const fmt = (d) => {
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    };
    const today = new Date();
    const max = new Date();
    max.setDate(max.getDate() + 30);
    date.min = fmt(today);
    date.max = fmt(max);
  }

  function initGuests() {
    const minus = $("#gMinus");
    const plus = $("#gPlus");
    const out = $("#gCount");
    if (!minus || !plus || !out) return;
    let n = 2;
    const render = (dir) => {
      out.textContent = n;
      if (hasGSAP) gsap.fromTo(out, { y: dir * 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(2)" });
    };
    minus.addEventListener("click", () => { if (n > 1) { n--; render(1); } });
    plus.addEventListener("click", () => { if (n < 12) { n++; render(-1); } });
  }

  function initForm() {
    const form = $("#reserveForm");
    if (!form) return;
    const name = $("#fName");
    const phone = $("#fPhone");
    const date = $("#fDate");
    const time = $("#fTime");
    const notes = $("#fNotes");
    const guests = $("#gCount");
    const btn = $("#submitBtn");

    const normalizeDigits = (s) => s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

    const setError = (input, bad) => {
      const field = input.closest(".field");
      if (!field) return;
      field.classList.toggle("has-error", bad);
      if (bad && hasGSAP) gsap.fromTo(field, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    };

    const checks = {
      name: () => name.value.trim().length >= 2,
      phone: () => /^\+?[\d\s-]{8,18}$/.test(normalizeDigits(phone.value.trim())),
      date: () => {
        if (!date.value) return false;
        const picked = new Date(date.value + "T00:00:00");
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return !isNaN(picked.getTime()) && picked >= today;
      },
      time: () => !!time.value
    };
    const inputs = { name, phone, date, time };

    Object.keys(inputs).forEach((k) => {
      const ev = inputs[k].tagName === "SELECT" || inputs[k].type === "date" ? "change" : "input";
      inputs[k].addEventListener(ev, () => {
        const field = inputs[k].closest(".field");
        if (field && field.classList.contains("has-error") && checks[k]()) field.classList.remove("has-error");
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let firstBad = null;
      Object.keys(checks).forEach((k) => {
        const ok = checks[k]();
        setError(inputs[k], !ok);
        if (!ok && !firstBad) firstBad = inputs[k];
      });
      if (firstBad) { firstBad.focus({ preventScroll: true }); return; }

      const label = $(".btn__text", btn);
      const original = label.textContent;
      btn.classList.add("is-loading");
      btn.disabled = true;
      label.textContent = "جارٍ تأكيد الحجز…";

      setTimeout(() => {
        const d = new Date(date.value + "T00:00:00");
        let dateText = date.value;
        try {
          dateText = d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
        } catch (err) { /* keep ISO */ }
        const guestsN = parseInt(guests.textContent, 10) || 2;
        const firstName = name.value.trim().split(/\s+/)[0];
        modal.open(
          `شكراً ${firstName}، حجزك في الطريق`,
          `طاولة لـ ${toArabicDigits(guestsN)} ${guestsN === 1 ? "ضيف" : guestsN === 2 ? "ضيفين" : guestsN <= 10 ? "ضيوف" : "ضيفاً"} يوم ${dateText} الساعة ${time.value}. سنتصل بك قريباً للتأكيد.`
        );
        form.reset();
        if (notes) notes.value = "";
        guests.textContent = "2";
        btn.classList.remove("is-loading");
        btn.disabled = false;
        label.textContent = original;
      }, 1300);
    });
  }

  function initNewsletter() {
    const form = $("#newsForm");
    const input = $("#newsEmail");
    const msg = $("#newsMsg");
    if (!form || !input || !msg) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      msg.classList.toggle("is-error", !ok);
      msg.textContent = ok ? "أهلاً بك في عائلة مَرجان 🌊" : "من فضلك أدخل بريداً إلكترونياً صحيحاً";
      if (ok) input.value = "";
      if (hasGSAP) gsap.fromTo(msg, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
    });
  }

  /* =========================================================
     Footer
     ========================================================= */
  function initFooter() {
    if (!hasST) return;
    gsap.fromTo("#footerGiant", { yPercent: 45, scale: 0.9 }, {
      yPercent: 0, scale: 1, ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true }
    });
    gsap.from(".footer__col", {
      y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: ".footer__top", start: "top 90%", once: true }
    });
  }

  function makeSourceArchive(files) {
    const encoder = new TextEncoder();
    const records = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;

    // Store the UTF-8 files without compression or another dependency.
    for (const [filename, source] of Object.entries(files)) {
      const name = encoder.encode(filename);
      const contents = encoder.encode(source);
      let crc = -1;
      for (const byte of contents) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }

      const writeMetadata = (view, start) => {
        view.setUint16(start, 0x21, true); // ZIP date: 1980-01-01.
        view.setUint32(start + 2, ~crc >>> 0, true);
        view.setUint32(start + 6, contents.length, true);
        view.setUint32(start + 10, contents.length, true);
        view.setUint16(start + 14, name.length, true);
      };

      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      writeMetadata(local, 12);
      records.push(local.buffer, name, contents);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      writeMetadata(entry, 14);
      entry.setUint32(42, offset, true);
      directory.push(entry.buffer, name);

      offset += local.byteLength + name.length + contents.length;
      directorySize += entry.byteLength + name.length;
    }

    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, directory.length / 2, true);
    end.setUint16(10, directory.length / 2, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...records, ...directory, end.buffer], { type: "application/zip" });
  }

  document.addEventListener("marjan:sources", ({ detail: loadSources }) => {
    const section = $("#sourceDownload");
    const button = $("button", section);
    const status = $("[role='status']", section);
    section.hidden = false;

    button.addEventListener("click", async () => {
      button.disabled = true;
      status.textContent = "";
      try {
        const archive = makeSourceArchive(await loadSources());
        const url = URL.createObjectURL(archive);
        const link = document.createElement("a");
        link.href = url;
        link.download = "marjan-website.zip";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch {
        status.textContent = "تعذّر تنزيل الملفات. جرّب مرة أخرى.";
      } finally {
        button.disabled = false;
      }
    });
  }, { once: true });

  /* =========================================================
     Fallbacks for non-GSAP environments
     ========================================================= */
  function initTabsBasic() {
    const tabs = $$(".menu__tab");
    const panels = $$(".menu__panel");
    const ind = $("#tabInd");
    if (ind) ind.style.display = "none";
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.style.background = on ? "var(--gold)" : "";
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab));
    }));
    const active = tabs.find((t) => t.classList.contains("is-active"));
    if (active) active.style.background = "var(--gold)";
  }

  function initTestimonialsBasic() {
    const slides = $$(".testi__slide");
    const cur = $("#testiCur");
    let i = 0;
    const show = (n) => {
      slides[i].classList.remove("is-active");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active");
      if (cur) cur.textContent = String(i + 1).padStart(2, "0");
    };
    const next = $("#testiNext");
    const prev = $("#testiPrev");
    if (next) next.addEventListener("click", () => show(i + 1));
    if (prev) prev.addEventListener("click", () => show(i - 1));
  }

  /* =========================================================
     Boot
     ========================================================= */
  if (!hasGSAP) {
    // Graceful fallback if the GSAP CDN is unreachable
    const loader = $("#loader");
    if (loader) loader.style.display = "none";
    document.body.classList.remove("is-loading");
    safe("anchors", initAnchors);
    safe("tabs", initTabsBasic);
    safe("testimonials", initTestimonialsBasic);
    safe("guests", initGuests);
    safe("form", initForm);
    safe("newsletter", initNewsletter);
    safe("date limits", initDateLimits);
    return;
  }

  safe("initial states", setInitialStates);
  safe("anchors", initAnchors);
  safe("cursor", initCursor);
  safe("magnetic", initMagnetic);
  safe("overlay menu", initOverlayMenu);
  safe("header", initHeader);
  safe("hero", initHero);
  safe("marquee", initMarquee);
  safe("reveals", initReveals);
  safe("about", initAbout);
  safe("signature", initSignature);
  safe("menu", initMenu);
  safe("chef", initChef);
  safe("band", initBand);
  safe("gallery", initGallery);
  safe("testimonials", initTestimonials);
  safe("reserve", initReserveAnim);
  safe("date limits", initDateLimits);
  safe("guests", initGuests);
  safe("form", initForm);
  safe("newsletter", initNewsletter);
  safe("footer", initFooter);

  // Start loader → hero intro
  safe("loader", () => runLoader(() => safe("hero intro", heroIntro)));

  // Refresh measurements once fonts & media are ready
  if (hasST) {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    if (document.readyState === "complete") setTimeout(refresh, 100);
    else window.addEventListener("load", refresh);
  }
})();
