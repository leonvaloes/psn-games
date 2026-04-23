<template>
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar
      </RouterLink>

      <h1>Criar conta</h1>
      <p class="subtitle">Registre-se para favoritar jogos e marcar conquistas</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="username">Usuário</label>
          <input id="username" v-model="username" type="text" placeholder="seu_usuario" autocomplete="username" />
        </div>
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" v-model="email" type="email" placeholder="seu@email.com" autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Senha <span class="hint">(mínimo 6 caracteres)</span></label>
          <input id="password" v-model="password" type="password" placeholder="••••••" autocomplete="new-password" />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Criando...' : 'Criar conta' }}
        </button>
      </form>

      <p class="switch">
        Já tem conta?
        <RouterLink to="/login">Entrar</RouterLink>
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
const { register } = useAuth();
const { load } = useFavorites();

const username = ref('');
const email    = ref('');
const password = ref('');
const loading  = ref(false);
const error    = ref('');

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await register(username.value, email.value, password.value);
    await load();
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao criar conta';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import '../style-auth.css';
</style>
