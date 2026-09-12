/* Traverze Travel — interactions: nav, cursor, magnetics, filters,
   tilt cards, destination drag-scroll, testimonials, quote form. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ── Sticky navbar shrink + mobile menu ── */
  var nav = document.getElementById("nav");
  var navLinks = document.getElementById("navLinks");
  var navToggle = document.getElementById("navToggle");

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ── Gold-ring cursor ── */
  if (finePointer && !reducedMotion) {
    var cursor = document.getElementById("cursor");
    var cursorDot = document.getElementById("cursorDot");
    var cx = -100, cy = -100, tx = -100, ty = -100;

    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      cursorDot.style.transform = "translate(" + tx + "px," + ty + "px)";
    }, { passive: true });

    (function ringLoop() {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(ringLoop);
    })();

    document.addEventListener("mouseover", function (e) {
      cursor.classList.toggle("is-hover",
        !!e.target.closest("a, button, .chip, .pkg, .dest, input, select, textarea"));
    }, { passive: true });
  }

  /* ── Magnetic buttons ── */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 18;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform = "translate(" + dx * strength + "px," + dy * strength * 0.6 + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "translate(0,0)";
        setTimeout(function () { el.style.transition = ""; }, 500);
      });
    });
  }

  /* ── 3D tilt package cards ── */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      var inner = card.querySelector(".pkg__inner");
      var layers = card.querySelectorAll("[data-depth]");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform =
          "translateY(-20px) rotateY(" + (px * 8) + "deg) rotateX(" + (-py * 8) + "deg)";
        layers.forEach(function (layer) {
          var d = parseFloat(layer.dataset.depth) - 1;
          layer.style.transform = "translate(" + (-px * d * 14) + "px," + (-py * d * 14) + "px)";
        });
      });
      card.addEventListener("mouseleave", function () {
        inner.style.transform = "";
        layers.forEach(function (layer) { layer.style.transform = ""; });
      });
    });
  }

  /* ── Package filters (destination × style) ── */
  var activeDest = "all", activeStyle = "all";
  var packages = document.querySelectorAll(".pkg");

  function applyFilters() {
    packages.forEach(function (pkg) {
      var okDest = activeDest === "all" || pkg.dataset.dest === activeDest;
      var okStyle = activeStyle === "all" || pkg.dataset.style.split(" ").indexOf(activeStyle) !== -1;
      pkg.classList.toggle("is-hidden", !(okDest && okStyle));
    });
  }
  function wireChips(attr, set) {
    var chips = document.querySelectorAll("[" + attr + "]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        set(chip.getAttribute(attr));
        applyFilters();
      });
    });
  }
  wireChips("data-filter-dest", function (v) { activeDest = v; });
  wireChips("data-filter-style", function (v) { activeStyle = v; });

  /* ── Destinations gallery: drag to scroll ── */
  var track = document.getElementById("destTrack");
  if (track && finePointer) {
    var isDown = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("mousedown", function (e) {
      isDown = true; moved = false;
      startX = e.pageX; startLeft = track.scrollLeft;
      track.classList.add("is-dragging");
    });
    window.addEventListener("mousemove", function (e) {
      if (!isDown) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("mouseup", function () {
      isDown = false;
      track.classList.remove("is-dragging");
      // Clear after the drag's own click event so only that click is
      // suppressed — later keyboard activation must keep working.
      setTimeout(function () { moved = false; }, 0);
    });
    track.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); moved = false; }
    }, true);
  }

  /* ── Testimonials carousel ── */
  var quotes = document.querySelectorAll("[data-quote]");
  var dots = document.querySelectorAll(".testimonials__dots .dot");
  var current = 0, timer = null;

  function showQuote(i) {
    current = (i + quotes.length) % quotes.length;
    quotes.forEach(function (q, n) {
      q.classList.toggle("is-active", n === current);
      q.setAttribute("aria-hidden", String(n !== current));
    });
    dots.forEach(function (d, n) {
      d.classList.toggle("is-active", n === current);
      d.setAttribute("aria-selected", String(n === current));
    });
  }
  function startRotation() {
    if (reducedMotion) return;
    clearInterval(timer);
    timer = setInterval(function () { showQuote(current + 1); }, 6000);
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () { showQuote(i); startRotation(); });
  });
  var stage = document.getElementById("testimonialStage");
  if (stage) {
    stage.addEventListener("mouseenter", function () { clearInterval(timer); });
    stage.addEventListener("mouseleave", startRotation);
  }
  showQuote(0);
  startRotation();

  /* ── Animated line-icons when services scroll into view ── */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll(".service").forEach(function (s) { io.observe(s); });
  }

  /* ── Count-up numbers ── */
  if ("IntersectionObserver" in window && !reducedMotion) {
    var countIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIo.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.dataset.count, 10);
        var plain = el.hasAttribute("data-plain");
        var start = performance.now(), dur = 1600;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 4);
          var val = Math.round(target * eased);
          el.textContent = plain ? String(val) : val.toLocaleString("en-US");
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".count").forEach(function (el) { countIo.observe(el); });
  }

  /* ── Graceful fallback for any photo that fails to load ── */
  document.querySelectorAll(".pkg__media img, .dest img, .why__media img").forEach(function (img) {
    function fallback() { img.closest(".pkg__media, .dest, .why__media").classList.add("img-missing"); }
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener("error", fallback);
  });

  /* ── Quote form — delivers the enquiry to the consultants'
        WhatsApp line (no backend on this static site) ── */
  var form = document.getElementById("quoteForm");
  var note = document.getElementById("formNote");
  var WHATSAPP_NUMBER = "263783208455"; // Precious · +263 78 320 8455
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var f = form.elements;
      var lines = [
        "New quote request — Traverze website",
        "Name: " + f.name.value.trim(),
        "Email: " + f.email.value.trim(),
        f.phone.value.trim() && "Phone: " + f.phone.value.trim(),
        "Destination: " + f.destination.value,
        f.dates.value.trim() && "Dates: " + f.dates.value.trim(),
        f.message.value.trim() && "Trip notes: " + f.message.value.trim()
      ].filter(Boolean);
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" +
        encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
      // Keep the entered values so nothing is lost if WhatsApp was blocked.
      note.innerHTML = "Your enquiry is ready in WhatsApp — press <em>Send</em> there " +
        "to reach our consultants. Didn't open? " +
        '<a href="' + url + '" target="_blank" rel="noopener">Tap here</a> ' +
        'or call <a href="tel:+263783208455">+263 78 320 8455</a>.';
    });
  }
})();
