(() => {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const year = document.querySelector("[data-year]");

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.hidden = true;
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveals.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
      );
      reveals.forEach((el) => observer.observe(el));
    }
  }

  const formatCount = (value) => {
    if (!value) return value;
    return String(value).replace(".", ",");
  };

  const applyProfileMeta = (data) => {
    document.querySelectorAll("[data-ig-followers]").forEach((el) => {
      el.textContent = formatCount(data.followers);
    });
    document.querySelectorAll("[data-ig-following]").forEach((el) => {
      el.textContent = formatCount(data.following);
    });
    const bio = document.querySelector("[data-ig-bio]");
    if (bio && data.bio) bio.textContent = data.bio;
  };

  const renderInstagramGrid = (posts) => {
    const grid = document.querySelector("[data-instagram-grid]");
    if (!grid || !posts?.length) return;

    grid.innerHTML = posts
      .slice(0, 6)
      .map(
        (post, index) => `
        <a
          class="instagram-card reveal${index ? ` delay-${Math.min(index, 5)}` : ""}"
          href="${post.url}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver publicação no Instagram"
        >
          <img
            src="${post.thumbnail}"
            alt="${post.alt || "Publicação de Gisele Maiolo no Instagram"}"
            loading="lazy"
            width="640"
            height="640"
          />
          ${post.isVideo ? '<span class="instagram-badge">Reel</span>' : ""}
          ${post.isCarousel ? '<span class="instagram-badge">Álbum</span>' : ""}
          <span class="instagram-card-overlay" aria-hidden="true">
            <span class="instagram-card-icon">↗</span>
          </span>
        </a>`
      )
      .join("");

    grid.querySelectorAll(".reveal").forEach((el) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.classList.add("is-visible");
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12 }
      );
      observer.observe(el);
    });
  };

  const loadInstagram = async () => {
    try {
      const response = await fetch("data/instagram-posts.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Feed indisponível");
      const data = await response.json();
      applyProfileMeta(data);
      renderInstagramGrid(data.posts);
    } catch {
      const grid = document.querySelector("[data-instagram-grid]");
      if (grid) {
        grid.innerHTML =
          '<p class="instagram-loading">Não foi possível carregar as publicações. <a href="https://www.instagram.com/giselemaiolooficial/" target="_blank" rel="noopener noreferrer">Visite o perfil no Instagram</a>.</p>';
      }
    }
  };

  loadInstagram();
})();
