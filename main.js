// CARSTYLE Premium JS Logic — Performance Optimized
document.addEventListener("DOMContentLoaded", () => {

  // ─── Theme Toggle (Light / Dark Mode) ───────────────────────────────────────
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.documentElement.classList.add("light-theme");
    if (themeIcon) {
      themeIcon.classList.replace("fa-moon", "fa-sun");
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const willBeLight = !document.documentElement.classList.contains("light-theme");
      document.documentElement.classList.toggle("light-theme", willBeLight);
      localStorage.setItem("theme", willBeLight ? "light" : "dark");
      if (themeIcon) {
        if (willBeLight) {
          themeIcon.classList.replace("fa-moon", "fa-sun");
        } else {
          themeIcon.classList.replace("fa-sun", "fa-moon");
        }
      }
    }, { passive: true });
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

      let isDragging = false;
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

      const onStart = () => { isDragging = true; };

      const onMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        scheduleUpdate(clientX);
      };

      const onEnd = () => {
        isDragging = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      };

      // Use { capture: false } + passive where possible
      handle.addEventListener("mousedown", onStart, { passive: true });
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseup", onEnd, { passive: true });

      handle.addEventListener("touchstart", onStart, { passive: true });
      window.addEventListener("touchmove", onMove, { passive: true });
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
            spaceBetween: 30,
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
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    // Disable GSAP ticker when tab is inactive
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        gsap.ticker.sleep();
      } else {
        gsap.ticker.wake();
      }
    });

    // Header fade-in — only transform + opacity (GPU composited)
    gsap.from("header", {
      y: -20,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      force3D: true, // force GPU layer
    });

    // Hero content — staggered, GPU-accelerated
    gsap.from(".hero-content > *", {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.15, // slightly tighter stagger
      ease: "power3.out",
      force3D: true,
    });

    // Animate premium cards — use ScrollTrigger.batch() = 1 single observer
    // instead of N individual observers (much cheaper on scroll)
    ScrollTrigger.batch(".premium-card", {
      start: "top 88%",
      onEnter: batch => gsap.from(batch, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        force3D: true,
      }),
      once: true, // play only once, then kill the trigger
    });

    // Animate section headings — batched
    ScrollTrigger.batch(".section-heading", {
      start: "top 88%",
      onEnter: batch => gsap.from(batch, {
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.05,
        ease: "power2.out",
        force3D: true,
      }),
      once: true,
    });
  }
});
