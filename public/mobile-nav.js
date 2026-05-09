document.querySelectorAll('[data-mobile-nav-root]').forEach((root) => {
  const toggle = root.querySelector('[data-mobile-nav-toggle]');
  const panel = root.querySelector('[data-mobile-nav-panel]');

  if (!toggle || !panel) {
    return;
  }

  const setOpen = (isOpen) => {
    panel.classList.toggle('hidden', !isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    const icon = toggle.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isOpen ? 'close' : 'menu';
    }
  };

  setOpen(false);

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
  });

  panel.querySelectorAll('a,[data-mobile-nav-close]').forEach((element) => {
    element.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });

  panel.querySelectorAll('[data-admin-login-mobile]').forEach((button) => {
    button.addEventListener('click', () => {
      setOpen(false);
      const adminTrigger = document.querySelector('#admin-login-open-btn');
      if (adminTrigger) {
        adminTrigger.click();
      }
    });
  });
});
