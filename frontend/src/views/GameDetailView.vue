<template>
  <div class="detail">
    <div
      class="backdrop"
      :style="game?.background_image ? `background-image: url(${game.background_image})` : ''"
    />

    <div class="top-bar">
      <RouterLink to="/" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar
      </RouterLink>
    </div>

    <div v-if="loadingGame" class="state-box">
      <div class="spinner" />
      <span>Carregando jogo...</span>
    </div>

    <div v-else-if="errorGame" class="state-box error"><span>{{ errorGame }}</span></div>

    <div v-else-if="game" class="layout">
      <aside class="sidebar">
        <img v-if="game.background_image" :src="game.background_image" :alt="game.name" class="cover" />

        <!-- Botão de favorito -->
        <button
          v-if="isAuthenticated"
          class="fav-btn"
          :class="{ active: isFavorite(game.slug) }"
          @click="toggle(game)"
        >
          <svg viewBox="0 0 24 24" :fill="isFavorite(game.slug) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {{ isFavorite(game.slug) ? 'Favoritado' : 'Favoritar' }}
        </button>

        <div class="game-meta">
          <div v-if="game.metacritic" class="score" :class="scoreClass(game.metacritic)">
            Metacritic {{ game.metacritic }}
          </div>
          <div v-if="game.released" class="meta-row">
            <span class="label">Lançamento</span>
            <span>{{ formatDate(game.released) }}</span>
          </div>
          <div v-if="game.genres?.length" class="meta-row">
            <span class="label">Gêneros</span>
            <span>{{ game.genres.map(g => g.name).join(', ') }}</span>
          </div>
          <div v-if="psnPlatforms.length" class="meta-row">
            <span class="label">Plataformas</span>
            <div class="platform-list">
              <span v-for="p in psnPlatforms" :key="p" class="badge">{{ p }}</span>
            </div>
          </div>
          <div v-if="game.developers?.length" class="meta-row">
            <span class="label">Desenvolvedor</span>
            <span>{{ game.developers.map(d => d.name).join(', ') }}</span>
          </div>
        </div>
      </aside>

      <section class="main">
        <h1 class="game-title">{{ game.name }}</h1>

        <div v-if="game.description_raw" class="description">
          <p>{{ truncated ? shortDesc : game.description_raw }}</p>
          <button v-if="game.description_raw.length > 400" class="btn-toggle" @click="truncated = !truncated">
            {{ truncated ? 'Ler mais' : 'Mostrar menos' }}
          </button>
        </div>

        <!-- Guias de Platina -->
        <div class="guides-banner">
          <div class="guides-banner-text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          <div>
            <strong>Guias de Platina</strong>
            <span>{{ guidesBannerText }}</span>
          </div>
        </div>
        <div class="guides-actions">
          <button
            v-if="isAuthenticated && !loadingGuidesCount && guidesCount === 0"
            class="btn-guides ai"
            :disabled="generatingAiGuide"
            @click="generateAiGuide"
          >
            <svg v-if="generatingAiGuide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="10"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3 14.2 8.8 20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2Z"/>
            </svg>
            {{ generatingAiGuide ? 'Gerando...' : 'Gerar com IA' }}
          </button>
          <RouterLink :to="`/game/${slug}/guides`" class="btn-guides">
            Ver guias
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </RouterLink>
        </div>
        </div>
        <span v-if="aiGuideError" class="ai-guide-error">{{ aiGuideError }}</span>

        <div class="trophies-section">
          <div class="section-header">
            <h2>
              Conquistas
              <span v-if="trophies.length" class="count">{{ totalTrophies }}</span>
            </h2>
            <span v-if="isAuthenticated && trophies.length" class="progress-label">
              {{ doneIds.size }}/{{ trophies.length }} concluídas
            </span>
          </div>

          <!-- Barra de progresso -->
          <div v-if="isAuthenticated && trophies.length" class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPct + '%' }" />
          </div>

          <div v-if="loadingTrophies" class="state-box small">
            <div class="spinner" />
            <span>Carregando conquistas...</span>
          </div>

          <div v-else-if="errorTrophies" class="state-box small error"><span>{{ errorTrophies }}</span></div>

          <div v-else-if="trophies.length" class="trophy-list">
            <TrophyCard
              v-for="t in trophies"
              :key="t.id"
              :trophy="t"
              :isDone="doneIds.has(t.id)"
              @toggle="toggleAchievement"
              @open-guide="openGuideModal"
            />

            <div v-if="hasMoreTrophies" class="pagination">
              <button class="btn-load-more" :disabled="loadingMoreTrophies" @click="loadMoreTrophies">
                {{ loadingMoreTrophies ? 'Carregando...' : 'Carregar mais conquistas' }}
              </button>
            </div>
          </div>

          <div v-else class="state-box small">
            <span>Nenhuma conquista disponível para este jogo.</span>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Modal de guia por conquista -->
  <AchievementGuideModal
    v-if="modalAchievement"
    :show="showModal"
    :achievement="modalAchievement"
    :game-slug="slug"
    @close="closeModal"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import TrophyCard from '../components/TrophyCard.vue';
import AchievementGuideModal from '../components/AchievementGuideModal.vue';
import { getGame, getAchievements, userApi, guidesApi } from '../services/api.js';
import { useAuth } from '../composables/useAuth.js';
import { useFavorites } from '../composables/useFavorites.js';

const route = useRoute();
const router = useRouter();
const slug  = route.params.slug;

const { isAuthenticated } = useAuth();
const { isFavorite, toggle } = useFavorites();

const game        = ref(null);
const trophies    = ref([]);
const totalTrophies = ref(0);
const trophyPage  = ref(1);
const hasMoreTrophies = ref(false);
const doneIds     = ref(new Set());
const guidesCount = ref(null);

const modalAchievement = ref(null);
const showModal        = ref(false);

function openGuideModal(trophy) {
  modalAchievement.value = trophy;
  showModal.value = true;
}

function closeModal() { showModal.value = false; }

function onKeyDown(e) { if (e.key === 'Escape') closeModal(); }
onMounted(() => window.addEventListener('keydown', onKeyDown));
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));

const loadingGame  = ref(true);
const loadingTrophies = ref(true);
const loadingMoreTrophies = ref(false);
const loadingGuidesCount = ref(true);
const generatingAiGuide = ref(false);
const errorGame    = ref('');
const errorTrophies = ref('');
const aiGuideError = ref('');
const truncated    = ref(true);

const shortDesc   = computed(() => game.value?.description_raw?.slice(0, 400) + '...');
const progressPct = computed(() =>
  trophies.value.length ? Math.round((doneIds.value.size / trophies.value.length) * 100) : 0
);
const guidesBannerText = computed(() => {
  if (loadingGuidesCount.value) return 'Estratégias e dicas da comunidade para 100% do jogo';
  if (guidesCount.value === null) return 'Estratégias e dicas da comunidade para 100% do jogo';
  if (guidesCount.value === 0) return 'Nenhum guia publicado ainda. Gere um rascunho inicial com IA.';
  return `${guidesCount.value} guia${guidesCount.value !== 1 ? 's' : ''} publicado${guidesCount.value !== 1 ? 's' : ''}`;
});

const psnPlatforms = computed(() => {
  if (!game.value?.platforms) return [];
  const PSN = ['playstation4', 'playstation5', 'playstation3', 'playstation-vita'];
  return game.value.platforms
    .map(p => p.platform)
    .filter(p => PSN.includes(p.slug))
    .map(p => p.name);
});

function scoreClass(score) {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

async function toggleAchievement(achievementId) {
  if (!isAuthenticated.value) return;
  const set = new Set(doneIds.value);
  if (set.has(achievementId)) {
    set.delete(achievementId);
    doneIds.value = set;
    await userApi.removeAchievement(slug, achievementId);
  } else {
    set.add(achievementId);
    doneIds.value = set;
    await userApi.addAchievement(slug, achievementId);
  }
}

async function loadMoreTrophies() {
  loadingMoreTrophies.value = true;
  trophyPage.value++;
  try {
    const data = await getAchievements(slug, trophyPage.value);
    trophies.value.push(...(data.results || []));
    hasMoreTrophies.value = !!data.next;
  } catch {
    trophyPage.value--;
  } finally {
    loadingMoreTrophies.value = false;
  }
}

async function loadGuidesCount() {
  loadingGuidesCount.value = true;
  try {
    const data = await guidesApi.list(slug, { limit: 1 });
    guidesCount.value = data.count || 0;
  } catch {
    guidesCount.value = null;
  } finally {
    loadingGuidesCount.value = false;
  }
}

async function generateAiGuide() {
  if (generatingAiGuide.value) return;

  generatingAiGuide.value = true;
  aiGuideError.value = '';

  try {
    const guide = await guidesApi.generateWithAi(slug);
    router.push(`/game/${slug}/guides/${guide._id}`);
  } catch (e) {
    aiGuideError.value = e.response?.data?.error || 'Erro ao gerar guia com IA.';
    await loadGuidesCount();
  } finally {
    generatingAiGuide.value = false;
  }
}

onMounted(async () => {
  // Carrega jogo
  try {
    game.value = await getGame(slug);
  } catch {
    errorGame.value = 'Erro ao carregar detalhes do jogo.';
  } finally {
    loadingGame.value = false;
  }

  loadGuidesCount();

  // Carrega conquistas da RAWG
  try {
    const data = await getAchievements(slug);
    trophies.value    = data.results || [];
    totalTrophies.value = data.count || 0;
    hasMoreTrophies.value = !!data.next;
  } catch {
    errorTrophies.value = 'Erro ao carregar conquistas.';
  } finally {
    loadingTrophies.value = false;
  }

  // Carrega conquistas feitas pelo usuário
  if (isAuthenticated.value) {
    try {
      const ids = await userApi.getAchievements(slug);
      doneIds.value = new Set(ids);
    } catch { /* não bloqueia */ }
  }
});
</script>

<style scoped>
.detail { min-height: 100vh; position: relative; }

.backdrop {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(24px) brightness(0.15);
  z-index: 0;
  pointer-events: none;
}

.top-bar {
  position: relative;
  z-index: 1;
  padding: 20px 24px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.btn-back svg { width: 18px; height: 18px; }
.btn-back:hover { color: var(--text); }

.layout {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px 64px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 40px;
}

@media (max-width: 768px) {
  .layout { grid-template-columns: 1fr; }
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cover {
  width: 100%;
  border-radius: var(--radius);
  aspect-ratio: 16/9;
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

.fav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  width: 100%;
}

.fav-btn svg { width: 18px; height: 18px; }

.fav-btn:hover { color: #e05c7a; border-color: #e05c7a; }
.fav-btn.active {
  color: #e05c7a;
  border-color: #e05c7a;
  background: rgba(224, 92, 122, 0.1);
}

.game-meta {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  text-align: center;
}

.score.green  { background: rgba(70,200,100,0.15); color: #46c864; }
.score.yellow { background: rgba(245,200,66,0.15); color: #f5c842; }
.score.red    { background: rgba(255,80,80,0.15);  color: #ff5050; }

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.label {
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.platform-list { display: flex; flex-wrap: wrap; gap: 4px; }

.badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
}

.main { display: flex; flex-direction: column; gap: 28px; }

.game-title {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.description {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-toggle {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  padding: 0;
  text-align: left;
}

.btn-toggle:hover { color: var(--accent-hover); }

.trophies-section { display: flex; flex-direction: column; gap: 16px; }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.count {
  font-size: 14px;
  font-weight: 500;
  padding: 2px 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-muted);
}

.progress-label {
  font-size: 13px;
  color: var(--text-muted);
}

.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #46c864;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.trophy-list { display: flex; flex-direction: column; gap: 8px; }

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  color: var(--text-muted);
  font-size: 15px;
}

.state-box.small { padding: 40px 24px; }
.state-box.error { color: #ff6b6b; }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.pagination { display: flex; justify-content: center; margin-top: 8px; }

.btn-load-more {
  padding: 10px 32px;
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

.btn-load-more:disabled { opacity: 0.5; cursor: not-allowed; }

/* Guias banner */
.guides-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(0,112,209,0.12) 0%, rgba(0,112,209,0.05) 100%);
  border: 1px solid rgba(0,112,209,0.25);
  border-radius: var(--radius);
}

.guides-banner-text {
  display: flex;
  align-items: center;
  gap: 14px;
}

.guides-banner-text svg {
  width: 22px;
  height: 22px;
  color: var(--accent);
  flex-shrink: 0;
}

.guides-banner-text div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.guides-banner-text strong {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.guides-banner-text span {
  font-size: 12px;
  color: var(--text-muted);
}

.guides-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-guides {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-guides svg { width: 14px; height: 14px; }
.btn-guides:hover { background: var(--accent-hover); }
.btn-guides:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-guides.ai:disabled svg { animation: spin 0.8s linear infinite; }

.ai-guide-error {
  margin-top: -20px;
  color: #ff6b6b;
  font-size: 13px;
}

@media (max-width: 640px) {
  .guides-banner {
    align-items: flex-start;
    flex-direction: column;
  }

  .guides-actions {
    justify-content: flex-start;
  }
}
</style>
