const products = window.lapkaProducts;
const favoritesGrid = document.querySelector('[data-favorites-grid]');
const emptyState = document.querySelector('[data-favorites-empty]');
const favoritesCount = document.querySelector('[data-favorites-count]');
const favoritesStatus = document.querySelector('[data-favorites-status]');
const cartCount = document.querySelector('[data-cart-count]');

function readStorageArray(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(saved)) throw new TypeError('Збережені дані мають неправильний формат.');
    return saved;
  } catch (error) {
    console.error(`Не вдалося прочитати ${key}:`, error);
    return [];
  }
}

let favorites = new Set(readStorageArray('lapka-favorites').filter((id) => products.some((product) => product.id === id)));
const cartQuantity = readStorageArray('lapka-cart')
  .reduce((count, item) => count + (products.some((product) => product.id === item?.id) && Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0), 0);

function money(value) {
  return `${new Intl.NumberFormat('uk-UA').format(value)} ₴`;
}

function renderFavorites() {
  const favoriteProducts = products.filter((product) => favorites.has(product.id));
  favoritesCount.textContent = favorites.size;
  emptyState.hidden = favoriteProducts.length > 0;
  favoritesGrid.hidden = favoriteProducts.length === 0;
  favoritesGrid.innerHTML = favoriteProducts.map((product) => `
    <article class="product-card">
      <div class="product-card__image product-art product-art--${product.art}">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        <a class="product-card__image-link" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="Детальніше про товар: ${product.name}">
          <span class="product-art__shape product-art__shape--back"></span>
          <span class="product-art__emoji" aria-hidden="true">${product.emoji}</span>
        </a>
        <button class="favorite-toggle is-favorite" type="button" data-remove-favorite="${product.id}" aria-label="Видалити з вибраного: ${product.name}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z"/></svg>
        </button>
      </div>
      <div class="product-card__info">
        <div class="product-card__rating"><span aria-hidden="true">★</span> ${product.rating} <span class="product-card__pet">${product.pet === 'dog' ? 'Песикам' : product.pet === 'cat' ? 'Котикам' : 'Усім хвостикам'}</span></div>
        <h3><a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
        <p>${product.description}</p>
        <div class="product-card__buy"><strong>${money(product.price)}</strong><a href="product.html?id=${encodeURIComponent(product.id)}">Детальніше <span aria-hidden="true">↗</span></a></div>
      </div>
    </article>
  `).join('');
}

favoritesGrid.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-favorite]');
  if (!removeButton) return;

  const product = products.find((item) => item.id === removeButton.dataset.removeFavorite);
  if (!product) return;
  favorites.delete(product.id);
  try {
    localStorage.setItem('lapka-favorites', JSON.stringify([...favorites]));
  } catch (error) {
    console.error('Не вдалося зберегти вибране:', error);
    favorites.add(product.id);
    return;
  }
  favoritesStatus.textContent = `${product.name} видалено з вибраного`;
  renderFavorites();
});

cartCount.textContent = cartQuantity;
document.querySelector('[data-current-year]').textContent = new Date().getFullYear();
renderFavorites();
