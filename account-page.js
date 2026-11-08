(() => {
  const storageKey = 'lapka-demo-account';
  const loginSection = document.querySelector('[data-account-login]');
  const form = document.querySelector('[data-account-form]');
  const status = document.querySelector('[data-account-status]');

  const showStatus = (message) => {
    status.textContent = message;
    status.hidden = !message;
  };

  const hasSavedAccount = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      if (
        !parsed ||
        typeof parsed.name !== 'string' ||
        typeof parsed.email !== 'string' ||
        !parsed.name.trim() ||
        !parsed.email.trim()
      ) {
        throw new TypeError('Збережений демо-профіль має неправильний формат.');
      }
      return true;
    } catch (error) {
      console.error('Не вдалося прочитати демо-профіль:', error);
      showStatus('Не вдалося прочитати профіль. Спробуйте очистити дані сайту в налаштуваннях браузера.');
      return false;
    }
  };

  if (hasSavedAccount()) {
    window.location.replace('cabinet.html');
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const nextAccount = {
      name: String(formData.get('name')).trim(),
      email: String(formData.get('email')).trim().toLocaleLowerCase('uk'),
    };
    if (!nextAccount.name || !nextAccount.email || !form.reportValidity()) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextAccount));
      window.location.assign('cabinet.html');
    } catch (error) {
      console.error('Не вдалося зберегти демо-профіль:', error);
      showStatus('Не вдалося зберегти профіль. Перевірте налаштування сховища браузера.');
    }
  });

})();
