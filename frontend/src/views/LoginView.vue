<template>
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar
      </RouterLink>

      <h1>Entrar</h1>
      <p class="subtitle">Acesse sua conta para gerenciar favoritos e conquistas</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" v-model="email" type="email" placeholder="seu@email.com" autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Senha</label>
          <input id="password" v-model="password" type="password" placeholder="••••••" autocomplete="current-password" />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="switch">
        Não tem conta?
        <RouterLink to="/register">Criar conta</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import { useFavorites } from '../composables/useFavorites.js';

const router = useRouter();
const { login } = useAuth();
const { load } = useFavorites();

const email    = ref('');
const password = ref('');
const loading  = ref(false);
const error    = ref('');

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await login(email.value, password.value);
    await load();
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao fazer login';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import '../style-auth.css';
</style>
