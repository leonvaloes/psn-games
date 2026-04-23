<template>
  <div class="card-wrap">
    <RouterLink :to="`/game/${game.slug}`" class="card">
      <div class="cover">
        <img v-if="game.background_image" :src="game.background_image" :alt="game.name" loading="lazy" />
        <div v-else class="no-cover">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="m8 21 4-4 4 4M12 17v4" />
          </svg>
        </div>
        <div class="overlay" />
      </div>

      <div class="info">
        <h3 class="title">{{ game.name }}</h3>
        <div class="meta">
          <span v-if="game.released" class="year">{{ game.released.slice(0, 4) }}</span>
          <span v-if="game.metacritic" class="score" :class="scoreClass(game.metacritic)">
            {{ game.metacritic }}
          </span>
        </div>
        <div class="platforms">
          <span v-for="p in psnPlatforms" :key="p" class="platform-badge">{{ p }}</span>
        </div>
      </div>
    </RouterLink>

    <!-- Botão favorito (só aparece quando autenticado) -->
    <button
      v-if="isAuthenticated"
      class="fav-btn"
      :class="{ active: isFavorite(game.slug) }"
      :title="isFavorite(game.slug) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
      @click.prevent="toggle(game)"
    >
      <svg viewBox="0 0 24 24" :fill="isFavorite(game.slug) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import { useFavorites } from '../composables/useFavorites.js';

const props = defineProps({ game: { type: Object, required: true } });

const { isAuthenticated } = useAuth();
const { isFavorite, toggle } = useFavorites();

const PSN_SLUGS = ['playstation4', 'playstation5', 'playstation3', 'playstation-vita', 'ps-vita'];

const psnPlatforms = computed(() => {
  if (!props.game.platforms) return [];
  return props.game.platforms
    .map(p => p.platform)
    .filter(p => PSN_SLUGS.includes(p.slug))
    .map(p => p.name)
    .slice(0, 3);
});

function scoreClass(score) {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}
</script>

<style scoped>
.card-wrap {
  position: relative;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 8px 32px rgba(0, 112, 209, 0.2);
}

.cover {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: var(--surface2);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.card:hover .cover img { transform: scale(1.05); }

.no-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.no-cover svg { width: 48px; height: 48px; }

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  pointer-events: none;
}

.info {
  padding: 14px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.year { font-size: 12px; color: var(--text-muted); }

.score {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.score.green  { background: rgba(70,200,100,0.15); color: #46c864; }
.score.yellow { background: rgba(245,200,66,0.15); color: #f5c842; }
.score.red    { background: rgba(255,80,80,0.15);  color: #ff5050; }

.platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
}

.platform-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
}

/* Botão de favorito */
.fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 34px;
  height: 34px;
  background: rgba(15, 15, 19, 0.75);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  z-index: 2;
}

.fav-btn svg { width: 16px; height: 16px; }

.fav-btn:hover {
  color: #e05c7a;
  border-color: #e05c7a;
}

.fav-btn.active {
  color: #e05c7a;
  border-color: #e05c7a;
  background: rgba(224, 92, 122, 0.15);
}
</style>
