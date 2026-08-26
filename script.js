(() => {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const year = document.querySelector("[data-year]");

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => {
    if (!header) return;
    const pinned = header.classList.contains("is-scrolled") && !document.querySelector(".hero");
    header.classList.toggle("is-scrolled", pinned || window.scrollY > 24);
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
        if (link.hasAttribute("data-nav-sub-toggle")) return;
        menu.hidden = true;
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  document.querySelectorAll("[data-nav-sub]").forEach((item) => {
    const toggle = item.querySelector("[data-nav-sub-toggle]");
    if (!toggle) return;

    const setOpen = (open) => {
      item.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    item.addEventListener("mouseenter", () => {
      if (finePointer.matches) setOpen(true);
    });

    item.addEventListener("mouseleave", () => {
      if (finePointer.matches) setOpen(false);
    });

    toggle.addEventListener("click", (event) => {
      const inMobileMenu = Boolean(item.closest("[data-menu]"));
      if (inMobileMenu) {
        event.preventDefault();
        setOpen(!item.classList.contains("is-open"));
        return;
      }
      if (!item.classList.contains("is-open")) {
        event.preventDefault();
        setOpen(true);
      }
    });
  });

  document.addEventListener("click", (event) => {
    document.querySelectorAll("[data-nav-sub].is-open").forEach((item) => {
      if (item.contains(event.target)) return;
      item.classList.remove("is-open");
      const toggle = item.querySelector("[data-nav-sub-toggle]");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll("[data-nav-sub].is-open").forEach((item) => {
      item.classList.remove("is-open");
      const toggle = item.querySelector("[data-nav-sub-toggle]");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  });

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

  const bindRequestForm = (form) => {
    const status = form.querySelector("[data-form-status]");
    const fields = [...form.querySelectorAll("input, select, textarea")];

    const showStatus = (message, isError = false) => {
      if (!status) return;
      status.hidden = false;
      status.textContent = message;
      status.classList.toggle("is-error", isError);
    };

    const isFilled = (field) => {
      if (field.type === "radio") {
        return Boolean(form.querySelector(`input[type="radio"][name="${CSS.escape(field.name)}"]:checked`));
      }
      if (field.type === "checkbox") return field.checked;
      return Boolean(String(field.value).trim());
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const missing = fields.find((field) => field.required && !isFilled(field));
      if (missing) {
        missing.focus();
        showStatus("Preencha os campos obrigatórios para enviar a solicitação.", true);
        return;
      }

      const emailField = form.querySelector('input[type="email"]');
      if (emailField && !emailField.checkValidity()) {
        emailField.focus();
        showStatus("Informe um e-mail válido.", true);
        return;
      }

      const seenRadios = new Set();
      const lines = fields
        .map((field) => {
          if (field.type === "radio") {
            if (seenRadios.has(field.name)) return null;
            seenRadios.add(field.name);
            const checked = form.querySelector(`input[type="radio"][name="${CSS.escape(field.name)}"]:checked`);
            return `${field.name}: ${checked ? checked.value : "—"}`;
          }
          if (field.type === "checkbox") {
            return `${field.name || field.id}: ${field.checked ? "Sim" : "Não"}`;
          }
          const label = field.name || field.id;
          const value = String(field.value).trim() || "—";
          return `${label}: ${value}`;
        })
        .filter(Boolean)
        .join("\n");

      const subject = form.getAttribute("data-subject") || "Solicitação";
      const to = form.getAttribute("data-mailto") || "";
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
      window.location.href = mailto;
      showStatus("A solicitação foi aberta no seu e-mail. Revise os dados e envie para concluir.");
    });
  };

  document.querySelectorAll("[data-request-form]").forEach(bindRequestForm);

  const contactPaths = document.querySelectorAll("[data-contact-path]");
  if (contactPaths.length) {
    const syncContactPath = () => {
      const hash = window.location.hash;
      contactPaths.forEach((link) => {
        const active = link.getAttribute("href") === hash;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    syncContactPath();
    window.addEventListener("hashchange", syncContactPath);
  }
})();
