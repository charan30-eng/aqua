(function () {
  async function boot() {
    const { get, setToken, getToken } = window.AquaAPI;
    const { state } = window.AquaState;

    const wantsAdminRoute =
      window.location.pathname === '/admin' || window.location.hash === '#admin';

    if (getToken()) {
      try {
        const me = await get('/api/auth/me');
        state.user = me.user;
      } catch (_) {
        setToken('');
        state.user = null;
      }
    }

    if (!state.user && wantsAdminRoute) {
      state.publicPage = 'admin-login';
    }
    render();
  }

  function render() {
    const { state } = window.AquaState;
    if (!state.user) {
      window.AquaPublic.renderPublicShell(state.publicPage || 'home');
      return;
    }
    if (state.user.role === 'admin') {
      window.AquaAdmin.renderAdminPortal();
    } else {
      window.AquaCustomer.renderCustomerPortal();
    }
  }

  async function logout() {
    const { post, setToken } = window.AquaAPI;
    const { state, toast } = window.AquaState;
    const wasAdmin = state.user && state.user.role === 'admin';
    try {
      await post('/api/auth/logout', {});
    } catch (_) {
      /* ignore network errors on logout */
    }
    setToken('');
    state.user = null;
    state.portalTab = 'dashboard';
    state.publicPage = wasAdmin ? 'admin-login' : 'login';
    toast('Signed out safely.', 'info');
    render();
  }

  window.AquaApp = { boot, render, logout };
  document.addEventListener('DOMContentLoaded', boot);
})();
