import { reactive, computed } from 'vue';
import { authApi } from '../services/api.js';

const state = reactive({
  token: localStorage.getItem('token') || null,
  user:  JSON.parse(localStorage.getItem('user') || 'null')
});

function persist(token, user) {
  state.token = token;
  state.user  = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clear() {
  state.token = null;
  state.user  = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function useAuth() {
  const isAuthenticated = computed(() => !!state.token);

  async function register(username, email, password) {
    const { token, user } = await authApi.register(username, email, password);
    persist(token, user);
  }

  async function login(email, password) {
    const { token, user } = await authApi.login(email, password);
    persist(token, user);
  }

  function logout() {
    clear();
  }

  return { state, isAuthenticated, register, login, logout };
}
