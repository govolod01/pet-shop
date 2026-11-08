(() => {
  const accountKey = 'lapka-demo-account';
  const defaultDeliveryKey = 'lapka-default-delivery';
  const deliveryUsageKey = 'lapka-delivery-usage';
  const deliveryServices = ['Нова пошта', 'Укрпошта', 'Meest', 'Кур’єрська доставка'];
  const products = window.lapkaProducts;
  const panels = [...document.querySelectorAll('[data-cabinet-panel]')];
  const tabs = [...document.querySelectorAll('[data-cabinet-tab]')];
  const favoritesList = document.querySelector('[data-cabinet-favorites-list]');
  const favoritesEmpty = document.querySelector('[data-cabinet-favorites-empty]');

  const readArray = (key) => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(saved)) throw new TypeError('Збережені дані мають неправильний формат.');
      return saved;
    } catch (error) {
      console.error(`Не вдалося прочитати ${key}:`, error);
      return [];
    }
  };

  let account;
  try {
    account = JSON.parse(localStorage.getItem(accountKey) || 'null');
  } catch (error) {
    console.error('Не вдалося прочитати демо-профіль:', error);
    account = null;
  }
  if (
    !account ||
    typeof account.name !== 'string' ||
    !account.name.trim() ||
    typeof account.email !== 'string' ||
    !account.email.trim()
  ) {
    window.location.replace('account.html');
    return;
  }

  const favorites = new Set(readArray('lapka-favorites').filter((id) => products.some((product) => product.id === id)));
  const cart = readArray('lapka-cart').reduce(
    (count, item) => count + (products.some((product) => product.id === item?.id) && Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0),
    0,
  );
  const formatMoney = (price) => `${new Intl.NumberFormat('uk-UA').format(price)} ₴`;
  const readDeliveryUsage = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(deliveryUsageKey) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
        throw new TypeError('Статистика служб доставки має неправильний формат.');
      }
      return Object.fromEntries(
        deliveryServices
          .filter((service) => Number.isInteger(saved[service]) && saved[service] > 0)
          .map((service) => [service, saved[service]]),
      );
    } catch (error) {
      console.error('Не вдалося прочитати статистику служб доставки:', error);
      return {};
    }
  };
  let deliveryUsage = readDeliveryUsage();
  const defaultDeliverySelect = document.querySelector('#default-delivery-service');
  const defaultDeliveryForm = document.querySelector('[data-default-delivery-form]');
  try {
    const savedDefaultDelivery = localStorage.getItem(defaultDeliveryKey);
    if (deliveryServices.includes(savedDefaultDelivery)) {
      defaultDeliverySelect.value = savedDefaultDelivery;
    }
  } catch (error) {
    console.error('Не вдалося прочитати службу доставки за замовчуванням:', error);
  }

  const renderDeliveryUsage = () => {
    const [service, count] = Object.entries(deliveryUsage)
      .sort((left, right) => right[1] - left[1])
      .at(0) || [];
    document.querySelector('[data-cabinet-frequent-delivery]').textContent = service || 'Ще немає даних';
    document.querySelector('[data-cabinet-frequent-delivery-count]').textContent = service
      ? `Обрано у демо-оформленні ${count} ${count === 1 ? 'раз' : count < 5 ? 'рази' : 'разів'}`
      : 'Після демо-оформлення тут з’явиться статистика';
  };

  document.querySelector('[data-cabinet-user-name]').textContent = account.name;
  document.querySelector('[data-cabinet-avatar]').textContent = account.name.trim().charAt(0).toLocaleUpperCase('uk');
  document.querySelector('[data-cabinet-greeting]').textContent = account.name;
  document.querySelector('[data-cabinet-name]').textContent = account.name;
  document.querySelector('[data-cabinet-email]').textContent = account.email;
  const settingsForm = document.querySelector('[data-cabinet-settings-form]');
  settingsForm.elements.name.value = account.name;
  settingsForm.elements.email.value = account.email;
  document.querySelector('[data-cabinet-cart-header]').textContent = cart;
  document.querySelector('[data-cabinet-favorites-header]').textContent = favorites.size;
  document.querySelector('[data-cabinet-cart-count]').textContent = cart;
  document.querySelector('[data-cabinet-favorites-count]').textContent = favorites.size;
  document.querySelector('[data-cabinet-favorites-summary]').textContent = favorites.size;
  document.querySelector('[data-current-year]').textContent = new Date().getFullYear();

  const selectPanel = (panelName) => {
    const panelExists = panels.some((panel) => panel.dataset.cabinetPanel === panelName);
    if (!panelExists) return;
    panels.forEach((panel) => { panel.hidden = panel.dataset.cabinetPanel !== panelName; });
    tabs.forEach((tab) => {
      if (tab.dataset.cabinetTab === panelName) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  };

  const renderFavorites = () => {
    const favoriteProducts = products.filter((product) => favorites.has(product.id));
    favoritesEmpty.hidden = favoriteProducts.length > 0;
    favoritesList.replaceChildren();

    favoriteProducts.forEach((product) => {
      const item = document.createElement('a');
      item.className = 'cabinet-favorite-item';
      item.href = `product.html?id=${encodeURIComponent(product.id)}`;

      const art = document.createElement('span');
      art.className = `cabinet-favorite-item__art product-art product-art--${product.art}`;
      const emoji = document.createElement('span');
      emoji.className = 'cabinet-favorite-item__emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = product.emoji;
      art.append(emoji);

      const info = document.createElement('span');
      info.className = 'cabinet-favorite-item__info';
      const name = document.createElement('strong');
      name.textContent = product.name;
      const description = document.createElement('small');
      description.textContent = product.description;
      info.append(name, description);

      const price = document.createElement('strong');
      price.className = 'cabinet-favorite-item__price';
      price.textContent = formatMoney(product.price);
      item.append(art, info, price);
      favoritesList.append(item);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => selectPanel(tab.dataset.cabinetTab));
  });
  document.querySelectorAll('[data-cabinet-go]').forEach((button) => {
    button.addEventListener('click', () => selectPanel(button.dataset.cabinetGo));
  });
  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!settingsForm.reportValidity()) return;

    const formData = new FormData(settingsForm);
    const updatedAccount = {
      ...account,
      name: String(formData.get('name')).trim(),
      email: String(formData.get('email')).trim().toLocaleLowerCase('uk'),
    };
    if (!updatedAccount.name || !updatedAccount.email) return;

    const status = document.querySelector('[data-settings-status]');
    try {
      localStorage.setItem(accountKey, JSON.stringify(updatedAccount));
      account = updatedAccount;
      settingsForm.elements.name.value = account.name;
      settingsForm.elements.email.value = account.email;
      document.querySelector('[data-cabinet-user-name]').textContent = account.name;
      document.querySelector('[data-cabinet-avatar]').textContent = account.name.charAt(0).toLocaleUpperCase('uk');
      document.querySelector('[data-cabinet-greeting]').textContent = account.name;
      document.querySelector('[data-cabinet-name]').textContent = account.name;
      document.querySelector('[data-cabinet-email]').textContent = account.email;

      const accountLink = document.querySelector('.account-button');
      if (accountLink) {
        accountLink.setAttribute('aria-label', `Особистий кабінет: ${account.name}`);
      }

      status.hidden = false;
      status.textContent = 'Дані демо-профілю збережено в цьому браузері.';
    } catch (error) {
      console.error('Не вдалося зберегти налаштування демо-профілю:', error);
      status.hidden = false;
      status.textContent = 'Не вдалося зберегти зміни. Перевірте налаштування сховища браузера.';
    }
  });
  defaultDeliveryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const service = defaultDeliverySelect.value;
    const status = document.querySelector('[data-delivery-status]');
    if (!deliveryServices.includes(service)) {
      status.hidden = false;
      status.textContent = 'Оберіть службу доставки зі списку.';
      return;
    }

    try {
      localStorage.setItem(defaultDeliveryKey, service);
      status.hidden = false;
      status.textContent = `Службу «${service}» збережено за замовчуванням.`;
    } catch (error) {
      console.error('Не вдалося зберегти службу доставки за замовчуванням:', error);
      status.hidden = false;
      status.textContent = 'Не вдалося зберегти вибір. Перевірте налаштування сховища браузера.';
    }
  });
  document.querySelector('[data-cabinet-logout]').addEventListener('click', () => {
    try {
      localStorage.removeItem(accountKey);
      window.location.replace('account.html');
    } catch (error) {
      console.error('Не вдалося завершити демо-сесію:', error);
      const status = document.querySelector('[data-cabinet-status]');
      status.hidden = false;
      status.textContent = 'Не вдалося завершити демо-сесію. Перевірте налаштування сховища браузера.';
    }
  });

  renderFavorites();
  renderDeliveryUsage();
  selectPanel('profile');
})();
