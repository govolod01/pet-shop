const menuToggle = document.querySelector('.mobile-menu-toggle');
const mainNavigation = document.querySelector('.main-nav');
const headerInner = document.querySelector('.header__inner');

if (menuToggle && mainNavigation) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    mainNavigation.classList.toggle('is-open', !isOpen);
  });

  mainNavigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      mainNavigation.classList.remove('is-open');
    });
  });
}

if (headerInner) {
  const searchToggle = document.createElement('button');
  searchToggle.className = 'header-search-toggle';
  searchToggle.type = 'button';
  searchToggle.setAttribute('aria-label', 'Відкрити пошук');
  searchToggle.setAttribute('aria-expanded', 'false');
  searchToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>';

  const searchForm = document.createElement('form');
  searchForm.className = 'header-search';
  searchForm.action = 'catalog.html';
  searchForm.method = 'get';
  searchForm.setAttribute('aria-label', 'Пошук товарів');
  searchForm.setAttribute('aria-hidden', 'true');
  searchForm.innerHTML = `
    <button class="header-search__submit" type="submit" aria-label="Шукати">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
    </button>
    <input class="header-search__input" type="search" name="search" placeholder="Знайти щось пухнасте..." autocomplete="off" disabled />
    <button class="header-search__close" type="button" aria-label="Закрити пошук">×</button>`;

  const searchInput = searchForm.querySelector('input');
  const closeSearch = () => {
    headerInner.classList.remove('is-search-open');
    searchToggle.setAttribute('aria-expanded', 'false');
    searchForm.setAttribute('aria-hidden', 'true');
    searchInput.disabled = true;
    window.setTimeout(() => {
      if (!headerInner.classList.contains('is-search-open')) searchToggle.focus();
    }, 230);
  };

  searchToggle.addEventListener('click', () => {
    headerInner.classList.add('is-search-open');
    searchToggle.setAttribute('aria-expanded', 'true');
    searchForm.setAttribute('aria-hidden', 'false');
    searchInput.disabled = false;
    window.setTimeout(() => {
      if (headerInner.classList.contains('is-search-open')) searchInput.focus();
    }, 230);
  });
  searchForm.querySelector('.header-search__close').addEventListener('click', closeSearch);
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) {
      searchInput.focus();
      return;
    }
    window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && headerInner.classList.contains('is-search-open')) closeSearch();
  });

  headerInner.append(searchToggle, searchForm);
}

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !motionPreference.matches) {
  const motionTargets = document.querySelectorAll(
    '.benefits__grid > *, .section-heading, .category-grid > *, .catalog-promo, .catalog-promo-tile, .promo-card, .review-grid > *, .service-info__grid > *, .newsletter-strip__inner, .product-grid > *'
  );
  const motionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-motion-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  motionTargets.forEach((target) => {
    target.setAttribute('data-motion-reveal', '');
    motionObserver.observe(target);
  });
}
