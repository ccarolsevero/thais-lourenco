(() => {
  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const categoryBySlug = (categories, slug) => categories.find((item) => item.slug === slug);

  const sortArticles = (articles) =>
    [...articles].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const cardMarkup = (article, categories) => {
    const category = categoryBySlug(categories, article.category);
    const image = article.image
      ? `<img src="${escapeHtml(article.image)}" alt="" width="720" height="480" />`
      : `<span class="article-fallback" aria-hidden="true"></span>`;

    return `
      <article class="article-card reveal">
        <a class="article-media" href="artigo.html?slug=${escapeHtml(article.slug)}" tabindex="-1" aria-hidden="true">
          ${image}
        </a>
        <div class="article-copy">
          <p class="eyebrow">${escapeHtml(category?.name || "")}</p>
          <h3>
            <a href="artigo.html?slug=${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a>
          </h3>
          <p>${escapeHtml(article.summary || "")}</p>
          <p class="article-meta">
            ${article.readingTime ? `${escapeHtml(article.readingTime)} de leitura` : ""}
          </p>
          <a class="text-link" href="artigo.html?slug=${escapeHtml(article.slug)}">Continuar lendo</a>
        </div>
      </article>
    `;
  };

  const emptyMarkup = (message) => `<p class="article-empty">${escapeHtml(message)}</p>`;

  const observeReveals = (root) => {
    const reveals = root.querySelectorAll(".reveal:not(.is-visible)");
    if (!reveals.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveals.forEach((el) => el.classList.add("is-visible"));
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
    reveals.forEach((el) => observer.observe(el));
  };

  const renderGrid = (articles, categories, emptyMessage) => {
    const grid = document.querySelector("[data-article-grid]");
    if (!grid) return;
    if (!articles.length) {
      grid.innerHTML = emptyMarkup(emptyMessage);
      return;
    }
    grid.innerHTML = articles.map((article) => cardMarkup(article, categories)).join("");
    observeReveals(grid);
  };

  const renderNav = (categories, current) => {
    const nav = document.querySelector("[data-blog-nav]");
    if (!nav) return;
    nav.hidden = false;
    nav.innerHTML = [
      `<a href="blog.html"${current ? "" : ' aria-current="page"'}>Todas</a>`,
      ...categories.map(
        (category) =>
          `<a href="blog.html?categoria=${escapeHtml(category.slug)}"${
            current === category.slug ? ' aria-current="page"' : ""
          }>${escapeHtml(category.nav)}</a>`
      ),
    ].join("");
  };

  const setupHub = (data) => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("categoria");
    const category = slug ? categoryBySlug(data.categories, slug) : null;
    const articles = sortArticles(data.articles || []);
    const filtered = category ? articles.filter((article) => article.category === category.slug) : articles;

    if (category) {
      renderNav(data.categories, category.slug);
      const title = document.querySelector("[data-blog-title]");
      const lead = document.querySelector("[data-blog-lead]");
      const eyebrow = document.querySelector("[data-blog-eyebrow]");
      const actions = document.querySelector("[data-blog-hero-actions]");
      const intro = document.querySelector("[data-blog-intro]");
      const recentTitle = document.querySelector("#recent-title");
      const categoriesSection = document.querySelector("#categorias");

      document.title = `${category.name} | Blog | Thais Lourenço`;
      if (eyebrow) eyebrow.textContent = "Blog";
      if (title) title.textContent = category.name;
      if (lead) lead.textContent = category.description;
      if (actions) {
        actions.innerHTML = `<a class="btn btn-ghost" href="blog.html">Todos os conteúdos</a>`;
      }
      if (intro) intro.hidden = true;
      if (categoriesSection) categoriesSection.hidden = true;
      if (recentTitle) recentTitle.textContent = "Conteúdos nesta categoria";
    }

    renderGrid(
      filtered.slice(0, category ? 24 : 6),
      data.categories,
      category
        ? "Os primeiros conteúdos desta categoria serão publicados em breve."
        : "Os primeiros artigos serão publicados em breve."
    );
  };

  const setupArticle = (data) => {
    const root = document.querySelector("[data-article-page]");
    if (!root) return;
    const slug = new URLSearchParams(window.location.search).get("slug");
    const article = (data.articles || []).find((item) => item.slug === slug);
    const category = article ? categoryBySlug(data.categories, article.category) : null;

    if (!article) {
      root.innerHTML = `
        <section class="page-hero">
          <div class="page-hero-inner">
            <p class="eyebrow">Blog</p>
            <h1 class="page-title">Conteúdo não encontrado</h1>
            <p class="page-lead">Este artigo não está disponível ou o endereço pode ter mudado.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="blog.html">Voltar ao blog</a>
            </div>
          </div>
        </section>
      `;
      return;
    }

    document.title = `${article.title} | Thais Lourenço`;
    const description = document.querySelector('meta[name="description"]');
    if (description && article.summary) description.setAttribute("content", article.summary);

    const image = article.image
      ? `<figure class="article-figure"><img src="${escapeHtml(article.image)}" alt="" width="1200" height="720" /></figure>`
      : "";

    const body = (article.body || [])
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");

    root.innerHTML = `
      <section class="page-hero">
        <div class="page-hero-inner">
          <p class="eyebrow">${escapeHtml(category?.name || "Blog")}</p>
          <h1 class="page-title page-title-wide">${escapeHtml(article.title)}</h1>
          <p class="page-lead">${escapeHtml(article.summary || "")}</p>
          <p class="article-meta article-meta-hero">
            ${escapeHtml(formatDate(article.date))}
            ${article.readingTime ? ` · ${escapeHtml(article.readingTime)} de leitura` : ""}
          </p>
        </div>
      </section>
      <article class="article-page">
        ${image}
        <div class="prose">${body}</div>
        <p class="section-cta">
          <a class="text-link" href="blog.html?categoria=${escapeHtml(article.category || "")}">Mais nesta categoria</a>
        </p>
      </article>
    `;
  };

  const start = async () => {
    const needsBlog = document.querySelector("[data-article-grid], [data-article-page]");
    if (!needsBlog) return;

    try {
      const response = await fetch("data/articles.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Feed indisponível");
      const data = await response.json();
      if (document.querySelector("[data-article-page]")) setupArticle(data);
      else setupHub(data);
    } catch {
      const grid = document.querySelector("[data-article-grid]");
      if (grid) grid.innerHTML = emptyMarkup("Não foi possível carregar os conteúdos agora.");
      const page = document.querySelector("[data-article-page]");
      if (page) {
        page.innerHTML = `
          <section class="page-hero">
            <div class="page-hero-inner">
              <h1 class="page-title">Não foi possível carregar este conteúdo</h1>
              <div class="hero-actions">
                <a class="btn btn-primary" href="blog.html">Voltar ao blog</a>
              </div>
            </div>
          </section>
        `;
      }
    }
  };

  start();
})();
