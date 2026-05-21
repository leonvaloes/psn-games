<template>
  <div>
    <nav class="navbar">
      <RouterLink to="/" class="nav-logo">
        <span class="ps-mark" aria-hidden="true">PS</span>
        PSN Games
      </RouterLink>

      <div class="nav-right">
        <template v-if="isAuthenticated">
          <RouterLink to="/favorites" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Favoritos
          </RouterLink>
          <div class="nav-user">
            <span class="username">{{ state.user?.username }}</span>
            <button class="btn-logout" @click="handleLogout">Sair</button>
          </div>
        </template>
        <template v-else>
          <RouterLink to="/login" class="nav-link">Entrar</RouterLink>
          <RouterLink to="/register" class="btn-register">Criar conta</RouterLink>
        </template>
      </div>
    </nav>

    <RouterView />
  </div>
</template>

<script setup>
import { RouterView, RouterLink, useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth.js';
import { useFavorites } from './composables/useFavorites.js';

const router = useRouter();
const { state, isAuthenticated, logout } = useAuth();
const { reset, load } = useFavorites();

if (isAuthenticated.value) load();

function handleLogout() {
  logout();
  reset();
  router.push('/');
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: rgba(15, 15, 19, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  transition: opacity 0.2s;
}

.nav-logo:hover { opacity: 0.8; }

.ps-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-muted);
  transition: color 0.2s;
}

.nav-link svg { width: 16px; height: 16px; }
.nav-link:hover { color: var(--text); }

.nav-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.btn-logout {
  font-size: 13px;
  color: var(--text-muted);
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 5px 12px;
  transition: color 0.2s, border-color 0.2s;
}

.btn-logout:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

.btn-register {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border-radius: var(--radius-sm);
  padding: 6px 16px;
  transition: background 0.2s;
}

.btn-register:hover { background: var(--accent-hover); }
</style>
