/* Traverze Travel — interactions */

(function () {
  "use strict";

  // Solid navigation once the page scrolls past the hero's top edge
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("nav--solid", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Scroll-reveal
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealed = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealed.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealed.forEach((el) => io.observe(el));
  }

  // Count-up stats
  const counters = document.querySelectorAll(".stat__num");
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach((el) => (el.textContent = el.dataset.count));
  } else {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            counterIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterIO.observe(el));
  }

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();
})();
