(() => {
  const headerActions = document.querySelector('.header__actions');
  if (!headerActions) return;

  const accountLink = document.createElement('a');
  accountLink.className = 'account-button';
  accountLink.href = 'account.html';
  accountLink.setAttribute('aria-label', 'Увійти в особистий кабінет');
  accountLink.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.4 3.2-5.2 7-5.2s6.3 1.8 7 5.2"/></svg>
    <span data-account-button-label>Увійти</span>
  `;

  let hasDemoAccount = false;
  try {
    const saved = JSON.parse(localStorage.getItem('lapka-demo-account') || 'null');
    if (
      saved &&
      typeof saved.name === 'string' &&
      saved.name.trim() &&
      typeof saved.email === 'string' &&
      saved.email.trim()
    ) {
      hasDemoAccount = true;
      accountLink.href = 'cabinet.html';
      accountLink.querySelector('[data-account-button-label]').textContent = 'Кабінет';
      accountLink.setAttribute('aria-label', `Особистий кабінет: ${saved.name.trim()}`);
    }
  } catch (error) {
    console.error('Не вдалося прочитати демо-профіль для шапки:', error);
  }

  const menuToggle = headerActions.querySelector('.mobile-menu-toggle');
  headerActions.insertBefore(accountLink, menuToggle || null);

  if (document.body.dataset.requireAccount === 'true' && !hasDemoAccount) {
    window.location.replace('account.html');
  }
})();
