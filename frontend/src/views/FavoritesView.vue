<template>
  <div class="page">
    <header class="page-header">
      <RouterLink to="/" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar
      </RouterLink>
      <h1>Meus Favoritos</h1>
    </header>

    <main class="content">
      <div v-if="favorites.length === 0" class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <p>Você ainda não favoritou nenhum jogo.</p>
        <RouterLink to="/" class="btn-explore">Explorar jogos</RouterLink>
      </div>

      <div v-else class="grid">
        <GameCard v-for="game in favGames" :key="game.slug" :game="game" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import GameCard from '../components/GameCard.vue';
import { useFavorites } from '../composables/useFavorites.js';

const { favorites, load } = useFavorites();

// Adapta o shape do Favorite para o que GameCard espera
const favGames = computed(() =>
  favorites.value.map(f => ({
    slug:             f.slug,
    name:             f.name,
    background_image: f.backgroundImage,
    metacritic:       f.metacritic,
    released:         f.released,
    platforms:        []
  }))
);

onMounted(load);
</script>

<style scoped>
.page { min-height: 100vh; }

.page-header {
  padding: 20px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1280px;
  margin: 0 auto;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
  width: fit-content;
}

.btn-back svg { width: 18px; height: 18px; }
.btn-back:hover { color: var(--text); }

h1 { font-size: 28px; font-weight: 700; }

.content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 24px 64px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  color: var(--text-muted);
}

.empty svg { width: 52px; height: 52px; opacity: 0.3; }
.empty p { font-size: 15px; }

.btn-explore {
  padding: 10px 28px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-explore:hover { background: var(--accent-hover); }
</style>
