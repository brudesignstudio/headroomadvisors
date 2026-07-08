/* Headroom Advisors — interactions & scroll choreography */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;

/* ------------------------------------------------------------------ */
/* Mobile nav toggle                                                    */
/* ------------------------------------------------------------------ */
const navToggle = document.getElementById("navToggle");
const navMobile = document.getElementById("navMobile");

if (navToggle && navMobile) {
  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("open");
    navMobile.classList.toggle("open");
  });

  navMobile.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.classList.remove("open");
      navMobile.classList.remove("open");
    });
  });
}

/* ------------------------------------------------------------------ */
/* Scroll progress thread                                               */
/* ------------------------------------------------------------------ */
const progress = document.querySelector(".scroll-progress");
if (progress) {
  const setProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", setProgress, { passive: true });
  setProgress();
}

/* ------------------------------------------------------------------ */
/* Cursor aura (desktop only)                                           */
/* ------------------------------------------------------------------ */
const glow = document.querySelector(".cursor-glow");
if (glow && !isTouch && !prefersReduced) {
  let gx = innerWidth / 2, gy = innerHeight / 3;
  let tx = gx, ty = gy;
  window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function lerpGlow() {
    gx += (tx - gx) * 0.08;
    gy += (ty - gy) * 0.08;
    glow.style.transform = `translate(${gx - 280}px, ${gy - 280}px)`;
    requestAnimationFrame(lerpGlow);
  })();
}

/* ------------------------------------------------------------------ */
/* Split-word heading reveals ([data-split])                            */
/* ------------------------------------------------------------------ */
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const wm = document.createElement("span");
            wm.className = "wm";
            const w = document.createElement("span");
            w.className = "w";
            w.textContent = part;
            wm.appendChild(w);
            frag.appendChild(wm);
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== "BR") {
        walk(child);
      }
    });
  };
  walk(el);
  el.querySelectorAll(".w").forEach((w, i) => {
    w.style.transitionDelay = `${i * 50}ms`;
  });
}

const splitEls = document.querySelectorAll("[data-split]");
if (!prefersReduced) splitEls.forEach(splitWords);

/* ------------------------------------------------------------------ */
/* Scroll reveal (staggered)                                            */
/* ------------------------------------------------------------------ */
const revealEls = document.querySelectorAll(".reveal, [data-split]");
if ("IntersectionObserver" in window && revealEls.length && !prefersReduced) {
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((entry, i) => {
          setTimeout(() => {
            entry.target.classList.add("in", "split-in");
          }, i * 90);
          io.unobserve(entry.target);
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in", "split-in"));
}

/* ------------------------------------------------------------------ */
/* Animated counters ([data-count])                                     */
/* ------------------------------------------------------------------ */
const counters = document.querySelectorAll("[data-count]");
if (counters.length && "IntersectionObserver" in window && !prefersReduced) {
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        const dur = 1600;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = prefix + Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => cio.observe(el));
}

/* ------------------------------------------------------------------ */
/* Parallax drift ([data-parallax="0.12"])                              */
/* ------------------------------------------------------------------ */
const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
if (parallaxEls.length && !prefersReduced) {
  let ticking = false;
  const updateParallax = () => {
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - innerHeight / 2) * speed * -1;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    },
    { passive: true }
  );
  updateParallax();
}

/* ------------------------------------------------------------------ */
/* Liquid glass — light follows the cursor on .glass-int cards          */
/* ------------------------------------------------------------------ */
if (!isTouch) {
  document.querySelectorAll(".glass-int").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* ------------------------------------------------------------------ */
/* Magnetic buttons (.magnetic)                                         */
/* ------------------------------------------------------------------ */
if (!isTouch && !prefersReduced) {
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      btn.style.transform = `translate(${dx * 6}px, ${dy * 5 - 2}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
}

/* ------------------------------------------------------------------ */
/* Founding offer promo — pops up once as the user scrolls past the    */
/* pull quote (where the banner used to live)                          */
/* ------------------------------------------------------------------ */
const promo = document.getElementById("foundingPromo");
if (promo) {
  const closeBtn = document.getElementById("promoClose");
  let shown = false;

  const openPromo = () => {
    if (shown) return;
    shown = true;
    promo.classList.add("show");
    document.body.style.overflow = "hidden";
    closeBtn.focus({ preventScroll: true });
  };
  const closePromo = () => {
    promo.classList.remove("show");
    document.body.style.overflow = "";
  };

  closeBtn.addEventListener("click", closePromo);
  promo.addEventListener("click", (e) => {
    if (e.target === promo) closePromo();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && promo.classList.contains("show")) closePromo();
  });

  const trigger = document.querySelector(".pullquote");
  if (trigger && "IntersectionObserver" in window) {
    const pio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(openPromo, 600);
            pio.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    pio.observe(trigger);
  }
}

/* ------------------------------------------------------------------ */
/* Lightweight human check (no third-party dependency)                  */
/* A small arithmetic challenge + a honeypot field. Enough to stop      */
/* naive bots on a static site; swap for reCAPTCHA/Turnstile once a     */
/* backend exists to verify tokens server-side.                         */
/* ------------------------------------------------------------------ */
function newCaptcha(field) {
  const a = Math.floor(Math.random() * 8) + 1;
  const b = Math.floor(Math.random() * 8) + 1;
  field.dataset.answer = String(a + b);
  const q = field.querySelector(".captcha-q");
  if (q) q.textContent = `${a} + ${b} =`;
}
document.querySelectorAll("[data-captcha]").forEach(newCaptcha);

function captchaPasses(form) {
  // Honeypot: a hidden field only a bot would fill.
  const hp = form.querySelector('[name="website_hp"]');
  if (hp && hp.value.trim() !== "") return false;

  // Arithmetic challenge.
  const field = form.querySelector("[data-captcha]");
  if (!field) return true;
  const input = field.querySelector(".captcha-input");
  const err = field.querySelector(".captcha-error");
  const ok = input && input.value.trim() === field.dataset.answer;
  if (!ok) {
    field.classList.add("invalid");
    if (err) err.hidden = false;
    newCaptcha(field); // rotate the challenge on a failed attempt
    if (input) {
      input.value = "";
      input.focus();
    }
  } else {
    field.classList.remove("invalid");
    if (err) err.hidden = true;
  }
  return ok;
}

/* ------------------------------------------------------------------ */
/* Latest podcast episode                                               */
/* Reliable click-to-play thumbnail (YouTube no longer allows embedding */
/* channel "uploads" playlists, so we render the real episode thumbnail */
/* and swap in the player on click). Best-effort auto-update pulls the   */
/* newest upload from the channel RSS feed and falls back silently to    */
/* the hardcoded latest if the request is blocked or offline.            */
/* ------------------------------------------------------------------ */
document.querySelectorAll(".footer-podcast-embed[data-yt-fallback]").forEach((box) => {
  const channel = box.dataset.ytChannel;
  const state = { id: box.dataset.ytFallback, title: box.dataset.ytTitle || "the latest episode" };
  const esc = (s) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;");

  const renderThumb = () => {
    box.innerHTML =
      '<button type="button" class="yt-thumb" aria-label="Play ' + esc(state.title) + '">' +
      '<img src="https://i.ytimg.com/vi/' + state.id + '/hqdefault.jpg" alt="' + esc(state.title) + '" loading="lazy" />' +
      '<span class="yt-play"></span></button>';
    box.querySelector(".yt-thumb").addEventListener("click", () => {
      // YouTube's player can't initialize from a file:// origin (shows
      // "Error 153"). When the page is opened as a local file, open the
      // episode on YouTube instead; embed inline only over http(s).
      if (location.protocol !== "http:" && location.protocol !== "https:") {
        window.open("https://www.youtube.com/watch?v=" + state.id, "_blank", "noopener");
        return;
      }
      box.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' + state.id +
        '?autoplay=1&rel=0" title="' + esc(state.title) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
    });
  };
  renderThumb();

  if (channel) {
    const feed = "https://www.youtube.com/feeds/videos.xml?channel_id=" + channel;
    fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(feed))
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((xml) => {
        const id = (xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
        const title = (xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/) || [])[1];
        if (id && !box.querySelector("iframe")) {
          state.id = id;
          if (title) state.title = title;
          renderThumb();
        }
      })
      .catch(() => {}); // keep the hardcoded fallback episode
  }
});

/* ------------------------------------------------------------------ */
/* Forms — front-end success state (.ha-form)                           */
/* ------------------------------------------------------------------ */
document.querySelectorAll("form.ha-form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!captchaPasses(form)) return;
    form.classList.add("done");
    const panel = form.closest(".form-glass") || form;
    panel.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  });
});
