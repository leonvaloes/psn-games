<template>
  <div class="home">
    <header class="hero">
      <h1 class="logo">
        <span class="ps-mark" aria-hidden="true">PS</span>
        PSN Games
      </h1>
      <p class="subtitle">Busque qualquer jogo e veja as conquistas disponíveis</p>
      <SearchBar v-model="query" @search="onSearch" />
    </header>

    <main class="content">
      <div v-if="loading" class="state-box">
        <div class="spinner" />
        <span>Buscando jogos...</span>
      </div>

      <div v-else-if="error" class="state-box error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div v-else-if="games.length">
        <div class="results-header">
          <span class="results-count">{{ total }} resultado{{ total !== 1 ? 's' : '' }} para <strong>"{{ lastQuery }}"</strong></span>
        </div>

        <div class="grid">
          <GameCard v-for="game in games" :key="game.id" :game="game" />
        </div>

        <div v-if="hasMore" class="pagination">
          <button class="btn-load-more" :disabled="loadingMore" @click="loadMore">
            <span v-if="loadingMore">Carregando...</span>
            <span v-else>Carregar mais</span>
          </button>
        </div>
      </div>

      <div v-else-if="lastQuery" class="state-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>Nenhum jogo encontrado para "{{ lastQuery }}"</span>
      </div>

      <div v-else class="state-box hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="m15 15 6 6m-11-4a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
        </svg>
        <span>Digite o nome de um jogo para começar</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import GameCard from '../components/GameCard.vue';
import { searchGames } from '../services/api.js';

const query = ref('');
const lastQuery = ref('');
const games = ref([]);
const total = ref(0);
const currentPage = ref(1);
const hasMore = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref('');

async function onSearch(q) {
  if (!q?.trim()) {
    games.value = [];
    lastQuery.value = '';
    return;
  }

  loading.value = true;
  error.value = '';
  lastQuery.value = q.trim();
  currentPage.value = 1;

  try {
    const data = await searchGames(q.trim(), 1);
    games.value = data.results || [];
    total.value = data.count || 0;
    hasMore.value = !!data.next;
  } catch {
    error.value = 'Erro ao buscar jogos. Verifique se o servidor está rodando.';
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  loadingMore.value = true;
  currentPage.value++;

  try {
    const data = await searchGames(lastQuery.value, currentPage.value);
    games.value.push(...(data.results || []));
    hasMore.value = !!data.next;
  } catch {
    currentPage.value--;
  } finally {
    loadingMore.value = false;
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px 48px;
  background: linear-gradient(180deg, #0d0d1a 0%, var(--bg) 100%);
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.ps-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 19px;
  font-weight: 800;
  line-height: 1;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin-bottom: 8px;
}

.content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.results-header {
  margin-bottom: 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.results-header strong {
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  color: var(--text-muted);
  font-size: 15px;
}

.state-box svg {
  width: 48px;
  height: 48px;
  opacity: 0.4;
}

.state-box.error {
  color: #ff6b6b;
}

.state-box.error svg {
  opacity: 1;
}

.state-box.hint svg {
  opacity: 0.25;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.btn-load-more {
  padding: 12px 40px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  transition: border-color 0.2s, background 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--surface2);
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
