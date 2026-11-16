(function () {
  const THEME_KEY = 'aquabill_theme';

  const state = {
    user: null,
    publicPage: 'home',   /* home | about | features | contact | login | register */
    portalTab: 'dashboard',
    unreadCount: 0,
    theme: localStorage.getItem(THEME_KEY) || 'light',
    sidebarOpen: false
  };

  function applyTheme(theme) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem(THEME_KEY, state.theme);
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    if (window.AquaCharts) window.AquaCharts.refreshTheme();
  }

  function toast(message, type) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 4000);
  }

  function openModal(title, htmlContent, wide) {
    const backdrop = document.getElementById('modal-root');
    const card = document.getElementById('modal-card');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!backdrop || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = htmlContent;
    card.classList.toggle('wide', Boolean(wide));
    backdrop.classList.remove('hidden');
    hydrateIcons();
  }

  function closeModal() {
    const backdrop = document.getElementById('modal-root');
    if (backdrop) backdrop.classList.add('hidden');
  }

  function confirmDialog(title, message, confirmLabel, onConfirm, danger) {
    const esc = window.AquaAPI.esc;
    openModal(
      title,
      '<p style="margin-top:0;color:var(--text-secondary);">' + esc(message) + '</p>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>' +
        '<button type="button" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" id="confirm-ok-btn">' + esc(confirmLabel || 'Confirm') + '</button>' +
      '</div>',
      false
    );
    document.getElementById('confirm-cancel-btn').onclick = closeModal;
    document.getElementById('confirm-ok-btn').onclick = async () => {
      const btn = document.getElementById('confirm-ok-btn');
      btn.disabled = true;
      try {
        await onConfirm();
        closeModal();
      } catch (e) {
        toast(e.message, 'error');
        btn.disabled = false;
      }
    };
  }

  function hydrateIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  applyTheme(state.theme);

  document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('modal-close-btn');
    const backdrop = document.getElementById('modal-root');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }
  });

  window.AquaState = {
    state,
    applyTheme,
    toggleTheme,
    toast,
    openModal,
    closeModal,
    confirmDialog,
    hydrateIcons
  };
})();
