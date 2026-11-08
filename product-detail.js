(() => {
  const products = window.lapkaProducts;
  const product = products.find((item) => item.id === new URLSearchParams(window.location.search).get('id'));
  const content = document.querySelector('[data-product-content]');
  const information = document.querySelector('[data-product-information]');
  const notFound = document.querySelector('[data-product-not-found]');

  const storageKeys = { cart: 'lapka-cart', favorites: 'lapka-favorites' };

  const readArray = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(value)) throw new TypeError('Збережені дані мають неправильний формат.');
      return value;
    } catch (error) {
      console.error(`Не вдалося прочитати ${key}:`, error);
      return [];
    }
  };

  const favorites = new Set(readArray(storageKeys.favorites).filter((id) => products.some((item) => item.id === id)));
  const cart = readArray(storageKeys.cart).filter((item) =>
    item && products.some((entry) => entry.id === item.id) &&
    Number.isInteger(item.quantity) && item.quantity > 0
  );

  const updateCounts = () => {
    document.querySelector('[data-favorites-count]').textContent = favorites.size;
    document.querySelector('[data-cart-count]').textContent = cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (!product) {
    notFound.hidden = false;
    updateCounts();
    return;
  }

  const favoriteButton = document.querySelector('[data-product-favorite]');
  const favoriteLabel = document.querySelector('[data-favorite-label]');
  const quantityInput = document.querySelector('[data-product-quantity]');
  const toast = document.querySelector('[data-toast]');
  const productArt = document.querySelector('[data-product-art]');
  const productEmoji = document.querySelector('[data-product-emoji]');
  const productPhoto = document.querySelector('[data-product-photo]');
  const gallery = document.querySelector('[data-product-gallery]');
  let toastTimer;

  const formatMoney = (value) => `${new Intl.NumberFormat('uk-UA').format(value)} ₴`;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };
  const updateFavoriteButton = () => {
    const isFavorite = favorites.has(product.id);
    favoriteButton.classList.toggle('is-favorite', isFavorite);
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));
    favoriteLabel.textContent = isFavorite ? 'У вибраному' : 'Додати до вибраного';
  };

  document.title = `${product.name} — Лапка`;
  document.querySelector('meta[name="description"]').content = product.details.summary;
  document.querySelector('[data-product-breadcrumb]').textContent = product.name;
  document.querySelector('[data-product-name]').textContent = product.name;
  document.querySelector('[data-product-summary]').textContent = product.details.summary;
  document.querySelector('[data-product-description]').textContent = product.details.description;
  document.querySelector('[data-product-price]').textContent = formatMoney(product.price);
  document.querySelector('[data-product-availability]').textContent = `Наявність: ${product.availability}`;
  document.querySelector('[data-product-rating]').textContent = product.rating;
  document.querySelector('[data-product-pet]').textContent = product.pet === 'dog' ? 'Песикам' : product.pet === 'cat' ? 'Котикам' : 'Усім хвостикам';
  productArt.classList.add(`product-art--${product.art}`);
  productEmoji.textContent = product.emoji;

  const galleryViews = product.gallery || [
    { label: 'Загальний вигляд' },
    { label: 'Деталі товару' },
    { label: 'Інший ракурс' },
  ];

  const createPreview = (index) => {
    const preview = document.createElement('span');
    preview.className = `product-gallery__preview product-gallery__preview--${index % 3}`;
    preview.textContent = product.emoji;
    preview.setAttribute('aria-hidden', 'true');
    return preview;
  };

  const selectGalleryView = (index) => {
    const view = galleryViews[index];
    if (!view) return;

    productArt.dataset.galleryView = String(index);
    gallery.querySelectorAll('[data-gallery-index]').forEach((button) => {
      const isSelected = Number(button.dataset.galleryIndex) === index;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });

    productEmoji.hidden = Boolean(view.src);
    productPhoto.hidden = !view.src;
    if (view.src) {
      productPhoto.src = view.src;
      productPhoto.alt = view.alt || `${product.name} — ${view.label}`;
    } else {
      productPhoto.removeAttribute('src');
      productPhoto.alt = '';
    }
  };

  galleryViews.forEach((view, index) => {
    const button = document.createElement('button');
    button.className = 'product-gallery__thumbnail';
    button.type = 'button';
    button.dataset.galleryIndex = String(index);
    button.setAttribute('aria-label', `Показати фото: ${view.label}`);
    button.setAttribute('aria-pressed', 'false');

    if (view.src) {
      const image = document.createElement('img');
      image.src = view.src;
      image.alt = '';
      image.addEventListener('error', () => {
        console.error(`Не вдалося завантажити фото товару: ${view.src}`);
        image.replaceWith(createPreview(index));
      }, { once: true });
      button.append(image);
    } else {
      button.append(createPreview(index));
    }

    const caption = document.createElement('span');
    caption.className = 'product-gallery__caption';
    caption.textContent = view.label;
    button.append(caption);
    button.addEventListener('click', () => selectGalleryView(index));
    gallery.append(button);
  });
  productPhoto.addEventListener('error', () => {
    console.error(`Не вдалося завантажити фото товару: ${productPhoto.src}`);
    productPhoto.hidden = true;
    productEmoji.hidden = false;
    showToast('Не вдалося завантажити фото. Показано демонстраційне зображення.');
  });
  selectGalleryView(0);

  if (product.badge) {
    const badge = document.querySelector('[data-product-badge]');
    badge.textContent = product.badge;
    badge.hidden = false;
  }

  const specs = document.querySelector('[data-product-specs]');
  product.details.specs.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    specs.append(term, detail);
  });

  content.hidden = false;
  information.hidden = false;
  updateCounts();
  updateFavoriteButton();

  favoriteButton.addEventListener('click', () => {
    const wasFavorite = favorites.has(product.id);
    if (wasFavorite) favorites.delete(product.id);
    else favorites.add(product.id);
    try {
      localStorage.setItem(storageKeys.favorites, JSON.stringify([...favorites]));
      updateCounts();
      updateFavoriteButton();
    } catch (error) {
      if (wasFavorite) favorites.add(product.id);
      else favorites.delete(product.id);
      console.error('Не вдалося зберегти вибране:', error);
      showToast('Не вдалося зберегти вибране. Перевірте налаштування сховища браузера.');
    }
  });

  document.querySelector('[data-product-add]').addEventListener('click', () => {
    const quantity = Number(quantityInput.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      quantityInput.setCustomValidity('Вкажіть цілу кількість від 1 до 99.');
      quantityInput.reportValidity();
      return;
    }
    quantityInput.setCustomValidity('');

    const currentItem = cart.find((item) => item.id === product.id);
    const previousQuantity = currentItem?.quantity;
    if (currentItem) currentItem.quantity += quantity;
    else cart.push({ id: product.id, quantity });

    try {
      localStorage.setItem(storageKeys.cart, JSON.stringify(cart));
      updateCounts();
      showToast(`${product.name} додано до кошика`);
    } catch (error) {
      if (currentItem) currentItem.quantity = previousQuantity;
      else cart.pop();
      console.error('Не вдалося зберегти кошик:', error);
      showToast('Не вдалося зберегти кошик. Перевірте налаштування сховища браузера.');
    }
  });
})();
