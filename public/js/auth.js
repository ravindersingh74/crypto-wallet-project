// Authentication & Session Management Helper
const Auth = {
  getToken() {
    return localStorage.getItem('wallet_token');
  },

  setToken(token) {
    localStorage.setItem('wallet_token', token);
  },

  getUser() {
    const data = localStorage.getItem('wallet_user');
    return data ? JSON.parse(data) : null;
  },

  setUser(user) {
    localStorage.setItem('wallet_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('wallet_token');
    localStorage.removeItem('wallet_user');
    window.location.href = '/login';
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login';
    }
  },

  requireGuest() {
    if (this.isLoggedIn()) {
      window.location.href = '/dashboard';
    }
  },

  updateNavbar() {
    const user = this.getUser();
    const navUserContainer = document.getElementById('nav-user-container');
    const navGuestContainer = document.getElementById('nav-guest-container');

    if (this.isLoggedIn() && user) {
      if (navUserContainer) navUserContainer.style.display = 'flex';
      if (navGuestContainer) navGuestContainer.style.display = 'none';

      const navUsername = document.getElementById('nav-username');
      if (navUsername) {
        navUsername.textContent = user.username;
      }
    } else {
      if (navUserContainer) navUserContainer.style.display = 'none';
      if (navGuestContainer) navGuestContainer.style.display = 'flex';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbar();
});
