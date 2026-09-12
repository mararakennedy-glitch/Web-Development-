/* Traverze Travel — GSAP scroll choreography:
   hero type reveal, section reveals, scroll-driven aircraft, parallax. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revealAllInstantly() {
    document.querySelectorAll(".reveal, .reveal-card").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll(".hero__line > span").forEach(function (el) {
      el.style.transform = "none";
    });
  }

  if (reducedMotion || typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined" || typeof MotionPathPlugin === "undefined") {
    revealAllInstantly();
    return;
  }

  // Only now hide the reveal elements — if anything below throws,
  // the catch removes the class so content is never left invisible.
  document.documentElement.classList.add("anim");
  try {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

  /* ── Hero entrance ── */
  var intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .to(".hero__line > span", { y: 0, duration: 1.3, stagger: 0.14, delay: 0.2 })
    .to(".hero__eyebrow", { opacity: 1, y: 0, duration: 0.9 }, "-=1.0")
    .to(".hero__sub", { opacity: 1, y: 0, duration: 0.9 }, "-=0.7")
    .to(".hero__ctas", { opacity: 1, y: 0, duration: 0.9 }, "-=0.6");

  /* ── Generic reveals ── */
  gsap.utils.toArray(".reveal").forEach(function (el) {
    if (el.closest(".hero")) return; // hero handles its own
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%" }
    });
  });

  gsap.utils.toArray(".reveal-card").forEach(function (el, i) {
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1.1, ease: "power3.out",
      delay: (i % 4) * 0.08,
      scrollTrigger: { trigger: el, start: "top 90%" }
    });
  });

  /* ── Scroll-driven aircraft along bezier contrail ── */
  var contrail = document.getElementById("contrail");
  var aircraft = document.getElementById("aircraft");
  if (contrail && aircraft && window.innerWidth > 1024) {
    var pathLength = contrail.getTotalLength();
    gsap.set(contrail, { strokeDasharray: pathLength, strokeDashoffset: pathLength });

    var flight = gsap.timeline({
      scrollTrigger: {
        trigger: ".flightpath",
        start: "top 85%",
        end: "+=1100",
        scrub: 1.2
      }
    });
    flight
      .to(contrail, { strokeDashoffset: 0, ease: "none" }, 0)
      .to(aircraft, {
        motionPath: {
          path: "#contrail",
          align: "#contrail",
          alignOrigin: [0.5, 0.5],
          autoRotate: true
        },
        ease: "none"
      }, 0);
  }

  /* ── Parallax media ── */
  gsap.utils.toArray("[data-parallax]").forEach(function (el) {
    var speed = parseFloat(el.dataset.parallax) || 0.15;
    gsap.to(el, {
      yPercent: -speed * 100,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ── Destination panels drift in from the right ── */
  gsap.utils.toArray(".dest").forEach(function (el, i) {
    gsap.from(el, {
      x: 80, opacity: 0,
      duration: 1.1, ease: "power3.out",
      delay: i * 0.07,
      scrollTrigger: { trigger: "#destinations", start: "top 75%" }
    });
  });
  } catch (err) {
    document.documentElement.classList.remove("anim");
    revealAllInstantly();
  }
})();
