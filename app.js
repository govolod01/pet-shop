const products = window.lapkaProducts;

const productGrid = document.querySelector('[data-product-grid]');
const emptyState = document.querySelector('[data-empty-state]');
const searchInput = document.querySelector('[data-search]');
const sortSelect = document.querySelector('[data-sort]');
const petFilterInputs = [...document.querySelectorAll('[data-pet-filter]')];
const categoryFilterInputs = [...document.querySelectorAll('[data-category-filter]')];
const minPriceInput = document.querySelector('[data-price-min]');
const maxPriceInput = document.querySelector('[data-price-max]');
const resultsCount = document.querySelector('[data-results-count]');
const filterToggle = document.querySelector('[data-filter-toggle]');
const filtersPanel = document.querySelector('.filters-panel');
const favoritesOnlyInput = document.querySelector('[data-favorites-only]');
const favoritesCount = document.querySelector('[data-favorites-count]');
const favoritesFilterCount = document.querySelector('[data-favorites-filter-count]');
const categoryButtons = [...document.querySelectorAll('[data-category]')];
const promoCategoryButtons = [...document.querySelectorAll('[data-promo-category]')];
const toast = document.querySelector('[data-toast]');
const cartDrawer = document.querySelector('[data-cart-drawer]');
const cartBackdrop = document.querySelector('[data-cart-backdrop]');
const cartItemsContainer = document.querySelector('[data-cart-items]');
const cartCount = document.querySelector('[data-cart-count]');
const cartTitleCount = document.querySelector('[data-cart-title-count]');
const cartTotal = document.querySelector('[data-cart-total]');
const cartEmpty = document.querySelector('[data-cart-empty]');
const cartFooter = document.querySelector('[data-cart-footer]');
const wholesaleThreshold = 20;
const wholesaleDiscountRate = 0.15;

let toastTimer;
let cart = loadCart();
let favorites = new Set(loadFavorites());

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('lapka-favorites') || '[]');
    if (!Array.isArray(saved)) return [];
    return [...new Set(saved.filter((id) => products.some((product) => product.id === id)))];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem('lapka-favorites', JSON.stringify([...favorites]));
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('lapka-cart') || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) =>
      products.some((product) => product.id === item.id) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    );
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('lapka-cart', JSON.stringify(cart));
}

function money(value) {
  return `${new Intl.NumberFormat('uk-UA').format(value)} ₴`;
}

function cartItemTotal(product, item) {
  const discount = item.wholesale === true && item.quantity > wholesaleThreshold ? wholesaleDiscountRate : 0;
  return product.price * item.quantity * (1 - discount);
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase('uk');
  const selectedPets = petFilterInputs.filter((input) => input.checked).map((input) => input.value);
  const selectedCategories = categoryFilterInputs.filter((input) => input.checked).map((input) => input.value);
  const minPrice = minPriceInput.value === '' ? 0 : Number(minPriceInput.value);
  const maxPrice = maxPriceInput.value === '' ? Number.POSITIVE_INFINITY : Number(maxPriceInput.value);
  const matched = products.filter((product) => {
    const matchesPet = selectedPets.length === 0 || product.pet === 'all' || selectedPets.includes(product.pet);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    const matchesFavorites = !favoritesOnlyInput.checked || favorites.has(product.id);
    const matchesSearch = `${product.name} ${product.description} ${product.category}`
      .toLocaleLowerCase('uk')
      .includes(query);
    return matchesPet && matchesCategory && matchesPrice && matchesFavorites && matchesSearch;
  });

  if (sortSelect.value === 'price-low') matched.sort((a, b) => a.price - b.price);
  if (sortSelect.value === 'price-high') matched.sort((a, b) => b.price - a.price);

  return matched;
}

function renderProducts() {
  const visibleProducts = getFilteredProducts();

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-card__image product-art product-art--${product.art}">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        <a class="product-card__image-link" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="Детальніше про товар: ${product.name}">
          <span class="product-art__shape product-art__shape--back"></span>
          <span class="product-art__emoji" aria-hidden="true">${product.emoji}</span>
        </a>
        <button class="favorite-toggle${favorites.has(product.id) ? ' is-favorite' : ''}" type="button" data-toggle-favorite="${product.id}" aria-label="${favorites.has(product.id) ? 'Видалити з вибраного' : 'Додати до вибраного'}: ${product.name}" aria-pressed="${favorites.has(product.id)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z"/></svg>
        </button>
        <button class="quick-add" type="button" data-add-to-cart="${product.id}" aria-label="Додати до кошика: ${product.name}">+</button>
      </div>
      <div class="product-card__info">
        <div class="product-card__rating"><span aria-hidden="true">★</span> ${product.rating} <span class="product-card__pet">${product.pet === 'dog' ? 'Песикам' : product.pet === 'cat' ? 'Котикам' : 'Усім хвостикам'}</span></div>
        <h3><a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
        <p>${product.description}</p>
        <div class="product-card__buy"><strong>${money(product.price)}</strong><button type="button" data-add-to-cart="${product.id}">До кошика <span aria-hidden="true">↗</span></button></div>
      </div>
    </article>
  `).join('');

  emptyState.hidden = visibleProducts.length > 0;
  emptyState.textContent = favoritesOnlyInput.checked && favorites.size === 0
    ? 'У вибраному поки порожньо. Натисніть на сердечко на картці товару, щоб зберегти його тут.'
    : 'Нічого не знайшлося. Спробуйте змінити пошуковий запит або фільтр 🐾';
  productGrid.hidden = visibleProducts.length === 0;
  resultsCount.textContent = `Знайдено товарів: ${visibleProducts.length}`;
}

function renderFavoritesCount() {
  const count = favorites.size;
  favoritesCount.textContent = count;
  favoritesFilterCount.textContent = count;
}

function renderFacetCounts() {
  const counts = {
    dog: products.filter((product) => product.pet === 'dog' || product.pet === 'all').length,
    cat: products.filter((product) => product.pet === 'cat' || product.pet === 'all').length,
  };
  products.forEach((product) => {
    counts[product.category] = (counts[product.category] || 0) + 1;
  });
  document.querySelectorAll('[data-facet-count]').forEach((count) => {
    count.textContent = counts[count.dataset.facetCount] || 0;
  });
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + (product ? cartItemTotal(product, item) : 0);
  }, 0);

  cartCount.textContent = itemCount;
  cartTitleCount.textContent = `(${itemCount})`;
  cartEmpty.hidden = itemCount > 0;
  cartFooter.hidden = itemCount === 0;
  cartItemsContainer.innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) return '';
    return `
      <article class="cart-item">
        <div class="cart-item__art product-art product-art--${product.art}"><span class="product-art__emoji" aria-hidden="true">${product.emoji}</span></div>
        <div class="cart-item__details"><h3>${product.name}</h3><p>${item.wholesale === true && item.quantity > wholesaleThreshold
          ? `<span class="cart-item__wholesale">Оптова ціна −15% · ${money(product.price * (1 - wholesaleDiscountRate))} за шт.</span>`
          : money(product.price)}</p><div class="quantity-control">
          <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Зменшити кількість ${product.name}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Збільшити кількість ${product.name}">+</button>
        </div></div>
        <button class="cart-item__remove" type="button" data-remove="${product.id}" aria-label="Видалити ${product.name}">×</button>
      </article>
    `;
  }).join('');
  cartTotal.textContent = money(subtotal);
  saveCart();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

function setFilter(filter) {
  petFilterInputs.forEach((input) => {
    input.checked = filter !== 'all' && input.value === filter;
  });
  renderProducts();
  document.querySelector('#bestsellers').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openCart() {
  cartDrawer.classList.add('is-open');
  cartBackdrop.classList.add('is-visible');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-is-open');
  document.querySelector('[data-close-cart]').focus();
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartBackdrop.classList.remove('is-visible');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-is-open');
  document.querySelector('[data-open-cart]').focus();
}

productGrid.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-toggle-favorite]');
  if (favoriteButton) {
    const productId = favoriteButton.dataset.toggleFavorite;
    if (favorites.has(productId)) favorites.delete(productId);
    else favorites.add(productId);
    saveFavorites();
    renderFavoritesCount();
    renderProducts();
    return;
  }

  const button = event.target.closest('[data-add-to-cart]');
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.addToCart);
  if (!product) return;
  const existing = cart.find((item) => item.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, quantity: 1 });
  renderCart();
  showToast(`${product.name} додано до кошика`);
});

cartItemsContainer.addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity]');
  if (quantityButton) {
    const item = cart.find((entry) => entry.id === quantityButton.dataset.quantity);
    if (!item) return;
    item.quantity += Number(quantityButton.dataset.change);
    if (item.quantity <= wholesaleThreshold) item.wholesale = false;
    if (item.quantity <= 0) cart = cart.filter((entry) => entry !== item);
    renderCart();
    return;
  }

  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    cart = cart.filter((item) => item.id !== removeButton.dataset.remove);
    renderCart();
  }
});

petFilterInputs.forEach((input) => input.addEventListener('change', renderProducts));
categoryFilterInputs.forEach((input) => input.addEventListener('change', renderProducts));
minPriceInput.addEventListener('input', renderProducts);
maxPriceInput.addEventListener('input', renderProducts);
favoritesOnlyInput.addEventListener('change', () => {
  renderFavoritesCount();
  renderProducts();
});

document.querySelector('[data-reset-filters]').addEventListener('click', () => {
  petFilterInputs.forEach((input) => { input.checked = false; });
  categoryFilterInputs.forEach((input) => { input.checked = false; });
  minPriceInput.value = '';
  maxPriceInput.value = '';
  favoritesOnlyInput.checked = false;
  searchInput.value = '';
  sortSelect.value = 'popular';
  renderFavoritesCount();
  renderProducts();
});

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.category;
    setFilter(category === 'dog' || category === 'cat' ? category : 'all');
  });
});

promoCategoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    petFilterInputs.forEach((input) => { input.checked = false; });
    categoryFilterInputs.forEach((input) => {
      input.checked = input.value === button.dataset.promoCategory;
    });
    minPriceInput.value = '';
    maxPriceInput.value = '';
    favoritesOnlyInput.checked = false;
    searchInput.value = '';
    sortSelect.value = 'popular';
    renderFavoritesCount();
    renderProducts();
    document.querySelector('#catalog-products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

searchInput.addEventListener('input', () => {
  renderProducts();
});
sortSelect.addEventListener('change', renderProducts);

filterToggle.addEventListener('click', () => {
  const isOpen = filterToggle.getAttribute('aria-expanded') !== 'true';
  filterToggle.setAttribute('aria-expanded', String(isOpen));
  filterToggle.querySelector('.filters-toggle__copy strong').textContent = isOpen ? 'Сховати фільтри' : 'Показати фільтри';
  filtersPanel.classList.toggle('is-open', isOpen);
});

document.querySelector('[data-open-cart]').addEventListener('click', openCart);
document.querySelector('[data-close-cart]').addEventListener('click', closeCart);
document.querySelector('[data-continue-shopping]').addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCart();
});

const subscribeForm = document.querySelector('[data-subscribe-form]');
if (subscribeForm) {
  subscribeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('[data-subscribe-message]').textContent = 'Дякуємо! Це демо-підписка — дані не передавалися.';
    event.currentTarget.reset();
  });
}

document.querySelector('[data-current-year]').textContent = new Date().getFullYear();
renderFacetCounts();
const pageParams = new URLSearchParams(window.location.search);
favoritesOnlyInput.checked = pageParams.get('favorites') === '1';
searchInput.value = pageParams.get('search') || '';
const requestedCategory = pageParams.get('category');
const validCategories = categoryFilterInputs.map((input) => input.value);
if (validCategories.includes(requestedCategory)) {
  categoryFilterInputs.forEach((input) => {
    input.checked = input.value === requestedCategory;
  });
}
renderFavoritesCount();
renderProducts();
if (searchInput.value) {
  document.querySelector('#catalog-products').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
if (validCategories.includes(requestedCategory)) {
  document.querySelector('#catalog-products').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
renderCart();
if (pageParams.get('openCart') === '1') openCart();
