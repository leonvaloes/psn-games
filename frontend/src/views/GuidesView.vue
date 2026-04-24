<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/game/${slug}`" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar para o jogo
      </RouterLink>

      <div class="header-row">
        <div>
          <h1>Guias de Platina</h1>
          <p class="game-name">{{ slug }}</p>
        </div>

        <RouterLink v-if="isAuthenticated" :to="`/game/${slug}/guides/new`" class="btn-new">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Publicar guia
        </RouterLink>
        <RouterLink v-else to="/login" class="btn-new outline">
          Entre para publicar
        </RouterLink>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          class="filter-btn"
          :class="{ active: sortBy === opt.value }"
          @click="sortBy = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="content">
      <div v-if="loading" class="state-box">
        <div class="spinner" />
        <span>Carregando guias...</span>
      </div>

      <div v-else-if="guides.length === 0" class="state-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
        <p>Nenhum guia publicado ainda para este jogo.</p>
        <RouterLink v-if="isAuthenticated" :to="`/game/${slug}/guides/new`" class="btn-new">
          Seja o primeiro!
        </RouterLink>
      </div>

      <div v-else class="guides-list">
        <GuideCard
          v-for="guide in sortedGuides"
          :key="guide._id"
          :guide="guide"
          :achievement-map="achievementMap"
          :is-voting="votingGuideIds.has(guide._id)"
          @vote="handleVote"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import GuideCard from '../components/GuideCard.vue';
import { guidesApi, getAchievements } from '../services/api.js';
import { useAuth } from '../composables/useAuth.js';

const route = useRoute();
const slug  = route.params.slug;
const { isAuthenticated } = useAuth();

const guides         = ref([]);
const loading        = ref(true);
const sortBy         = ref('score');
const achievementMap = ref(new Map());
const votingGuideIds = ref(new Set());

const sortOptions = [
  { label: 'Mais votados', value: 'score' },
  { label: 'Mais recentes', value: 'new' }
];

const sortedGuides = computed(() => {
  const list = [...guides.value];
  return sortBy.value === 'score'
    ? list.sort((a, b) => b.score - a.score)
    : list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

async function load() {
  loading.value = true;
  try {
    const [data, p1] = await Promise.all([
      guidesApi.list(slug, { limit: 50 }),
      getAchievements(slug, 1).catch(() => ({ results: [] }))
    ]);
    guides.value = data.results;

    const all = [...(p1.results || [])];
    if (p1.next) {
      const p2 = await getAchievements(slug, 2).catch(() => ({ results: [] }));
      all.push(...(p2.results || []));
    }
    achievementMap.value = new Map(all.map(a => [a.name.toLowerCase(), a]));
  } finally {
    loading.value = false;
  }
}

async function handleVote(guideId, vote) {
  if (!isAuthenticated.value || votingGuideIds.value.has(guideId)) return;

  votingGuideIds.value = new Set(votingGuideIds.value).add(guideId);

  try {
    const updated = await guidesApi.vote(slug, guideId, vote);
    const idx = guides.value.findIndex(g => g._id === guideId);
    if (idx >= 0) guides.value[idx] = updated;
  } catch { /* silencioso */ }
  finally {
    const next = new Set(votingGuideIds.value);
    next.delete(guideId);
    votingGuideIds.value = next;
  }
}

async function handleDelete(guideId) {
  if (!confirm('Tem certeza que deseja excluir este guia?')) return;
  try {
    await guidesApi.remove(slug, guideId);
    guides.value = guides.value.filter(g => g._id !== guideId);
  } catch { /* silencioso */ }
}

onMounted(load);
</script>

<style scoped>
.page { min-height: 100vh; }

.page-header {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
  width: fit-content;
}

.btn-back svg { width: 16px; height: 16px; }
.btn-back:hover { color: var(--text); }

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

h1 { font-size: 26px; font-weight: 700; }

.game-name {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
  text-transform: capitalize;
}

.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
  cursor: pointer;
}

.btn-new svg { width: 16px; height: 16px; }
.btn-new:hover { background: var(--accent-hover); }
.btn-new.outline {
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
}
.btn-new.outline:hover { background: rgba(0,112,209,0.1); }

.filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: none;
  color: var(--text-muted);
  font-size: 13px;
  transition: all 0.2s;
}

.filter-btn:hover { border-color: var(--accent); color: var(--text); }
.filter-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.content {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 24px 64px;
}

.guides-list { display: flex; flex-direction: column; gap: 10px; }

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  color: var(--text-muted);
  font-size: 15px;
}

.state-box svg { width: 48px; height: 48px; opacity: 0.3; }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
