(() => {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const storageKey = 'lapka-cookie-consent';
  const status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  banner.append(status);

  try {
    const savedConsent = localStorage.getItem(storageKey);
    const consent = savedConsent ? JSON.parse(savedConsent) : null;
    banner.hidden = Boolean(consent && ['necessary', 'all'].includes(consent.choice));
  } catch (error) {
    console.error('Не вдалося прочитати згоду на cookie:', error);
    banner.hidden = false;
  }

  banner.querySelectorAll('[data-cookie-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          choice: button.dataset.cookieChoice,
          savedAt: new Date().toISOString(),
        }));
        banner.hidden = true;
      } catch (error) {
        console.error('Не вдалося зберегти згоду на cookie:', error);
        status.classList.remove('sr-only');
        status.textContent = 'Не вдалося зберегти вибір. Перевірте налаштування сховища браузера й спробуйте ще раз.';
      }
    });
  });

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
})();
