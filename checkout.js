const products = window.lapkaProducts;
const checkoutGrid = document.querySelector('[data-checkout-grid]');
const emptyState = document.querySelector('[data-checkout-empty]');
const checkoutForm = document.querySelector('[data-checkout-form]');
const checkoutItems = document.querySelector('[data-checkout-items]');
const checkoutItemCount = document.querySelector('[data-checkout-item-count]');
const checkoutSubtotal = document.querySelector('[data-checkout-subtotal]');
const checkoutDiscountRow = document.querySelector('[data-checkout-discount-row]');
const checkoutDiscount = document.querySelector('[data-checkout-discount]');
const checkoutTotal = document.querySelector('[data-checkout-total]');
const checkoutError = document.querySelector('[data-checkout-error]');
const checkoutComplete = document.querySelector('[data-checkout-complete]');
const checkoutMobileBar = document.querySelector('[data-checkout-mobile-bar]');
const checkoutMobileTotal = document.querySelector('[data-checkout-mobile-total]');
const deliveryService = document.querySelector('[data-delivery-service]');
const deliveryAddressLabel = document.querySelector('[data-delivery-address-label]');
const deliveryAddressInput = checkoutForm.elements['delivery-address'];
const cityInput = checkoutForm.elements.city;
const citySuggestions = document.querySelector('[data-city-field] [role="listbox"]');
const cartButton = document.querySelector('.checkout-header__back');
const deliveryServices = ['Нова пошта', 'Укрпошта', 'Meest', 'Кур’єрська доставка'];
const deliveryUsageKey = 'lapka-delivery-usage';
const wholesaleThreshold = 20;
const wholesaleIncrement = 10;
const wholesaleDiscountRate = 0.15;
const cityNames = [
  'Київ', 'Харків', 'Одеса', 'Дніпро', 'Донецьк', 'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь',
  'Вінниця', 'Херсон', 'Полтава', 'Чернігів', 'Черкаси', 'Суми', 'Житомир', 'Хмельницький', 'Чернівці',
  'Рівне', 'Івано-Франківськ', 'Тернопіль', 'Луцьк', 'Ужгород', 'Кропивницький', 'Біла Церква', 'Кременчук',
  'Кам’янське', 'Кам’янець-Подільський', 'Умань', 'Бровари', 'Бориспіль', 'Ірпінь', 'Буча', 'Мукачево',
  'Дрогобич', 'Стрий', 'Коломия', 'Ніжин', 'Прилуки', 'Олександрія', 'Бердичів', 'Ковель', 'Шептицький',
  'Павлоград', 'Конотоп', 'Лозова', 'Ізмаїл', 'Подільськ', 'Чорноморськ', 'Бердянськ', 'Мелітополь',
];
let activeCitySuggestion = -1;

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

let cart = readStorageArray('lapka-cart')
  .filter((item) => products.some((product) => product.id === item?.id) && Number.isInteger(item.quantity) && item.quantity > 0)
  .map((item) => ({ ...item, wholesale: item.wholesale === true && item.quantity > wholesaleThreshold }));

function money(value) {
  return `${new Intl.NumberFormat('uk-UA').format(value)} ₴`;
}

function persistCart(nextCart) {
  try {
    localStorage.setItem('lapka-cart', JSON.stringify(nextCart));
    cart = nextCart;
    renderCart();
    return true;
  } catch (error) {
    console.error('Не вдалося оновити кошик:', error);
    checkoutError.textContent = 'Не вдалося зберегти зміни кошика. Перевірте доступ до сховища браузера й спробуйте ще раз.';
    checkoutError.hidden = false;
    return false;
  }
}

function renderCart() {
  const validItems = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }));
  const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = validItems.reduce((sum, item) => sum + (
    item.wholesale && item.quantity > wholesaleThreshold
      ? item.product.price * item.quantity * wholesaleDiscountRate
      : 0
  ), 0);
  const total = subtotal - discount;

  checkoutItemCount.textContent = `${itemCount} ${itemCount === 1 ? 'товар' : itemCount < 5 ? 'товари' : 'товарів'}`;
  checkoutSubtotal.textContent = money(subtotal);
  checkoutDiscountRow.hidden = discount === 0;
  checkoutDiscount.textContent = `−${money(discount)}`;
  checkoutTotal.textContent = money(total);
  checkoutMobileTotal.textContent = money(total);
  cartButton.textContent = `← Повернутися до кошика (${itemCount})`;
  checkoutItems.innerHTML = validItems.map(({ product, quantity, wholesale }) => {
    const hasWholesalePrice = wholesale && quantity > wholesaleThreshold;
    const rowTotal = product.price * quantity * (hasWholesalePrice ? 1 - wholesaleDiscountRate : 1);
    const unitPrice = product.price * (1 - wholesaleDiscountRate);
    const wholesaleOffer = quantity > wholesaleThreshold && !hasWholesalePrice;
    return `
    <article class="checkout-order-item">
      <span class="checkout-order-item__art product-art product-art--${product.art}" aria-hidden="true">${product.emoji}</span>
      <div class="checkout-order-item__details">
        <a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a>
        <small>${hasWholesalePrice ? `Оптова ціна −15% · ${money(unitPrice)} за шт.` : `${money(product.price)} за шт.`}</small>
        <div class="checkout-quantity" aria-label="Кількість товару ${product.name}">
          <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Зменшити кількість ${product.name}">−</button>
          <span>${quantity}</span>
          <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Збільшити кількість ${product.name}">+</button>
        </div>
        ${wholesaleOffer ? `
          <div class="checkout-wholesale-offer">
            <p>Додайте ще ${wholesaleIncrement} шт. і отримайте оптову ціну −15% на весь товар.</p>
            <button type="button" data-wholesale="${product.id}">Додати ${wholesaleIncrement} шт. і заощадити</button>
          </div>
        ` : ''}
      </div>
      <strong class="checkout-order-item__price">${hasWholesalePrice ? `<del>${money(product.price * quantity)}</del><span>${money(rowTotal)}</span>` : money(rowTotal)}</strong>
      <button class="checkout-order-item__remove" type="button" data-remove="${product.id}" aria-label="Видалити ${product.name} з кошика">×</button>
    </article>
  `;
  }).join('');

  const hasItems = itemCount > 0;
  emptyState.hidden = hasItems;
  checkoutGrid.hidden = !hasItems;
  checkoutMobileBar.hidden = !hasItems;
  checkoutForm.querySelectorAll('input, select, textarea, button').forEach((control) => { control.disabled = !hasItems; });
}

function closeCitySuggestions() {
  citySuggestions.hidden = true;
  cityInput.setAttribute('aria-expanded', 'false');
  cityInput.removeAttribute('aria-activedescendant');
  activeCitySuggestion = -1;
}

function renderCitySuggestions() {
  const query = cityInput.value.trim().toLocaleLowerCase('uk');
  const matches = query.length > 0
    ? cityNames.filter((city) => city.toLocaleLowerCase('uk').startsWith(query)).slice(0, 7)
    : [];
  citySuggestions.replaceChildren();

  if (!matches.length) {
    closeCitySuggestions();
    return;
  }

  matches.forEach((city, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'checkout-city-suggestion';
    option.id = `checkout-city-option-${index}`;
    option.role = 'option';
    option.setAttribute('aria-selected', 'false');
    option.textContent = city;
    option.addEventListener('mousedown', (event) => event.preventDefault());
    option.addEventListener('click', () => {
      cityInput.value = city;
      closeCitySuggestions();
      cityInput.focus();
    });
    citySuggestions.append(option);
  });

  citySuggestions.hidden = false;
  cityInput.setAttribute('aria-expanded', 'true');
}

function activateCitySuggestion(index) {
  const options = [...citySuggestions.querySelectorAll('[role="option"]')];
  if (!options.length) return;
  activeCitySuggestion = (index + options.length) % options.length;
  options.forEach((option, optionIndex) => {
    const isActive = optionIndex === activeCitySuggestion;
    option.setAttribute('aria-selected', String(isActive));
    if (isActive) {
      cityInput.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
  });
}

cityInput.addEventListener('input', () => {
  activeCitySuggestion = -1;
  cityInput.removeAttribute('aria-activedescendant');
  renderCitySuggestions();
});
cityInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' && !citySuggestions.hidden) {
    event.preventDefault();
    activateCitySuggestion(activeCitySuggestion + 1);
  } else if (event.key === 'ArrowUp' && !citySuggestions.hidden) {
    event.preventDefault();
    activateCitySuggestion(activeCitySuggestion < 0 ? citySuggestions.children.length - 1 : activeCitySuggestion - 1);
  } else if (event.key === 'Enter' && activeCitySuggestion >= 0 && !citySuggestions.hidden) {
    event.preventDefault();
    citySuggestions.querySelectorAll('[role="option"]')[activeCitySuggestion].click();
  } else if (event.key === 'Escape') {
    closeCitySuggestions();
  }
});
cityInput.addEventListener('blur', closeCitySuggestions);

checkoutItems.addEventListener('click', (event) => {
  const wholesaleButton = event.target.closest('[data-wholesale]');
  const quantityButton = event.target.closest('[data-quantity]');
  const removeButton = event.target.closest('[data-remove]');
  if (wholesaleButton) {
    const productId = wholesaleButton.dataset.wholesale;
    const nextCart = cart.map((item) => item.id === productId
      ? { ...item, quantity: item.quantity + wholesaleIncrement, wholesale: true }
      : item);
    checkoutError.hidden = true;
    persistCart(nextCart);
    return;
  }
  if (!quantityButton && !removeButton) return;

  const productId = quantityButton?.dataset.quantity || removeButton.dataset.remove;
  const change = quantityButton ? Number(quantityButton.dataset.change) : Number.NEGATIVE_INFINITY;
  const nextCart = cart
    .map((item) => {
      if (item.id !== productId) return item;
      const quantity = item.quantity + change;
      return { ...item, quantity, wholesale: quantity > wholesaleThreshold && item.wholesale === true };
    })
    .filter((item) => item.quantity > 0);
  checkoutError.hidden = true;
  persistCart(nextCart);
});

deliveryService.addEventListener('change', () => {
  const isCourier = deliveryService.value === 'Кур’єрська доставка';
  deliveryAddressLabel.firstChild.textContent = isCourier ? 'Адреса доставки ' : 'Відділення або поштомат ';
  deliveryAddressInput.placeholder = isCourier
    ? 'Вулиця, будинок і квартира'
    : 'Номер відділення або поштомата';
});

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  checkoutError.hidden = true;
  if (!cart.length) {
    renderCart();
    return;
  }
  if (!checkoutForm.reportValidity()) return;

  try {
    localStorage.setItem('lapka-cart', '[]');
  } catch (error) {
    console.error('Не вдалося очистити кошик після демо-оформлення:', error);
    checkoutError.textContent = 'Не вдалося завершити демо-оформлення. Кошик не змінено — спробуйте ще раз.';
    checkoutError.hidden = false;
    return;
  }

  let usageSaved = true;
  if (deliveryServices.includes(deliveryService.value)) {
    try {
      const savedUsage = JSON.parse(localStorage.getItem(deliveryUsageKey) || '{}');
      if (!savedUsage || typeof savedUsage !== 'object' || Array.isArray(savedUsage)) {
        throw new TypeError('Статистика служб доставки має неправильний формат.');
      }
      const deliveryUsage = Object.fromEntries(
        deliveryServices.map((service) => [
          service,
          Number.isInteger(savedUsage[service]) && savedUsage[service] > 0 ? savedUsage[service] : 0,
        ]),
      );
      deliveryUsage[deliveryService.value] += 1;
      localStorage.setItem(deliveryUsageKey, JSON.stringify(deliveryUsage));
    } catch (error) {
      usageSaved = false;
      console.error('Не вдалося оновити статистику служб доставки:', error);
    }
  }

  cart = [];
  cartButton.textContent = '← Повернутися до кошика (0)';
  checkoutMobileBar.hidden = true;
  checkoutGrid.hidden = true;
  checkoutComplete.hidden = false;
  checkoutComplete.querySelector('p').textContent = usageSaved
    ? 'Це демонстраційне замовлення: дані не збережені й не передані, оплата не проводилася.'
    : 'Демо оформлення завершено, але статистику доставки не вдалося оновити. Дані замовлення не збережені й не передані, оплата не проводилася.';
  checkoutComplete.focus();
});

try {
  const defaultDelivery = localStorage.getItem('lapka-default-delivery');
  if (deliveryServices.includes(defaultDelivery)) {
    deliveryService.value = defaultDelivery;
    deliveryService.dispatchEvent(new Event('change'));
  }
} catch (error) {
  console.error('Не вдалося прочитати службу доставки за замовчуванням:', error);
}

document.querySelector('[data-current-year]').textContent = new Date().getFullYear();
renderCart();
