// CARSTYLE Premium JS Logic — Performance Optimized
document.addEventListener("DOMContentLoaded", () => {

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ─── Theme Toggle (Light / Dark Mode) ───────────────────────────────────────
  const themeToggleBtns = document.querySelectorAll("[data-theme-toggle]");
  const themeIcons = document.querySelectorAll("[data-theme-icon]");

  const paintThemeIcons = (isLight) => {
    themeIcons.forEach(icon => {
      icon.classList.toggle("fa-sun", isLight);
      icon.classList.toggle("fa-moon", !isLight);
    });
  };

  if (localStorage.getItem("theme") === "light") {
    document.documentElement.classList.add("light-theme");
    paintThemeIcons(true);
  }

  themeToggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const willBeLight = !document.documentElement.classList.contains("light-theme");
      document.documentElement.classList.toggle("light-theme", willBeLight);
      localStorage.setItem("theme", willBeLight ? "light" : "dark");
      paintThemeIcons(willBeLight);
    }, { passive: true });
  });

  // ─── Hero video — poster first, stream only when it can be seen ─────────────
  const heroVideo = document.getElementById("hero-video");
  if (heroVideo && heroVideo.dataset.src) {
    const saveData = navigator.connection && navigator.connection.saveData;
    const slowLink = navigator.connection && /^([23]g|slow-2g)$/.test(navigator.connection.effectiveType || "");

    if (!prefersReducedMotion && !saveData && !slowLink) {
      const playHero = () => {
        heroVideo.src = heroVideo.dataset.src;
        heroVideo.play().catch(() => {});
      };
      const heroObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          heroObserver.disconnect();
          if ("requestIdleCallback" in window) {
            requestIdleCallback(playHero, { timeout: 2000 });
          } else {
            playHero();
          }
        });
      });
      heroObserver.observe(heroVideo);

      // Stop decoding frames nobody is watching
      document.addEventListener("visibilitychange", () => {
        if (!heroVideo.src) return;
        if (document.hidden) {
          heroVideo.pause();
        } else {
          heroVideo.play().catch(() => {});
        }
      });
    }
  }

  // ─── Mobile Navigation Menu Toggle ──────────────────────────────────────────
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    }, { passive: true });
  }

  // ─── Before/After Slider — RAF-throttled for smooth 60fps ───────────────────
  const initBeforeAfterSliders = () => {
    const sliders = document.querySelectorAll(".comparison-slider");
    sliders.forEach(slider => {
      const handle = slider.querySelector(".slider-handle");
      const beforeImgContainer = slider.querySelector(".image-before");

      if (!handle || !beforeImgContainer) return;

      let rafId = null;
      let lastClientX = 0;

      const updateSlider = () => {
        const rect = slider.getBoundingClientRect();
        const position = (lastClientX - rect.left) / rect.width;
        const percentage = Math.max(0, Math.min(100, position * 100));

        handle.style.left = `${percentage}%`;
        beforeImgContainer.style.clipPath =
          `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
        rafId = null;
      };

      const scheduleUpdate = (clientX) => {
        lastClientX = clientX;
        if (rafId === null) {
          rafId = requestAnimationFrame(updateSlider);
        }
      };

      const onMove = (e) => {
        scheduleUpdate(e.touches ? e.touches[0].clientX : e.clientX);
      };

      // Move listeners only exist while a drag is in progress, so an idle page
      // never pays for mousemove/touchmove handlers.
      const onEnd = () => {
        slider.classList.remove("is-dragging");
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onMove);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      };

      const onStart = () => {
        slider.classList.add("is-dragging");
        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("touchmove", onMove, { passive: true });
      };

      handle.addEventListener("mousedown", onStart, { passive: true });
      handle.addEventListener("touchstart", onStart, { passive: true });
      window.addEventListener("mouseup", onEnd, { passive: true });
      window.addEventListener("touchend", onEnd, { passive: true });
    });
  };

  initBeforeAfterSliders();

  // ─── Swiper — lazy init via IntersectionObserver ─────────────────────────────
  const swiperContainer = document.querySelector(".testimonials-swiper");
  if (swiperContainer && typeof Swiper !== "undefined") {
    const swiperObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          new Swiper(".testimonials-swiper", {
            slidesPerView: 1,
            spaceBetween: 32,
            loop: true,
            // Use CSS transforms only (default in Swiper) for GPU compositing
            cssMode: false,
            autoplay: {
              delay: 5000,
              disableOnInteraction: false,
            },
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            breakpoints: {
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 }
            }
          });
          swiperObserver.disconnect();
        }
      });
    }, { rootMargin: "100px" });

    swiperObserver.observe(swiperContainer);
  }

  // ─── GLightbox — lazy init ───────────────────────────────────────────────────
  if (typeof GLightbox !== "undefined" && document.querySelector(".glightbox")) {
    GLightbox({
      selector: ".glightbox",
      touchNavigation: true,
      loop: true,
      zoomable: true,
      preload: false, // don't preload all images
    });
  }

  // ─── GSAP ScrollTrigger — batched animations for performance ─────────────────
  if (!prefersReducedMotion && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    // Disable GSAP ticker when tab is inactive
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        gsap.ticker.sleep();
      } else {
        gsap.ticker.wake();
      }
    });

    // fromTo (not from) everywhere: `from` reads the element's current value as
    // the destination, so a ScrollTrigger refresh mid-animation can pin an
    // element to its offset start state forever.
    const reveal = (targets, distance, duration, ease, stagger) => gsap.fromTo(targets,
      { y: distance, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        ease,
        stagger,
        force3D: true, // force GPU layer
        overwrite: "auto",
        clearProps: "transform,opacity", // leave no inline transform behind
      });

    // Header fade-in — only transform + opacity (GPU composited)
    reveal("header", -20, 0.8, "power2.out", 0);

    // Hero content — staggered, GPU-accelerated
    reveal(".hero-content > *", 40, 1, "power3.out", 0.15);

    // Animate premium cards — use ScrollTrigger.batch() = 1 single observer
    // instead of N individual observers (much cheaper on scroll)
    ScrollTrigger.batch(".premium-card", {
      start: "top 88%",
      onEnter: batch => reveal(batch, 40, 0.8, "power3.out", 0.08),
      once: true, // play only once, then kill the trigger
    });

    // Animate section headings — batched
    ScrollTrigger.batch(".section-heading", {
      start: "top 88%",
      onEnter: batch => reveal(batch, 25, 0.7, "power2.out", 0.05),
      once: true,
    });
  }
});
