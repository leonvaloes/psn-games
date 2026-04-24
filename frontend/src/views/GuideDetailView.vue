<template>
  <div class="page">
    <div class="content-wrap">

      <RouterLink :to="`/game/${slug}/guides`" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Todos os guias
      </RouterLink>

      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <div class="spinner" />
      </div>

      <!-- Erro -->
      <div v-else-if="error" class="state-box error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Conteúdo -->
      <template v-else-if="guide">

        <!-- Cabeçalho do guia -->
        <header class="guide-header">
          <div class="guide-headline">
            <h1>{{ guide.title }}</h1>
            <div class="guide-meta">
              <span class="meta-author">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {{ guide.authorName }}
              </span>
              <span class="meta-sep">·</span>
              <span>{{ formatDate(guide.createdAt) }}</span>
              <span v-if="guide.updatedAt !== guide.createdAt" class="meta-edited">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                </svg>
                editado
              </span>
            </div>
          </div>

          <!-- Votos + ações do autor -->
          <div class="guide-toolbar">
            <div class="vote-group">
              <button
                class="vote-btn up"
                :class="{ active: guide.userVote === 1 }"
                :disabled="!isAuthenticated || guide.isAuthor || isVoting"
                :title="!isAuthenticated ? 'Faça login para votar' : guide.isAuthor ? 'Não pode votar no próprio guia' : 'Útil'"
                @click="vote(1)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              </button>
              <span class="vote-score" :class="scoreClass">{{ guide.score }}</span>
              <button
                class="vote-btn down"
                :class="{ active: guide.userVote === -1 }"
                :disabled="!isAuthenticated || guide.isAuthor || isVoting"
                :title="!isAuthenticated ? 'Faça login para votar' : guide.isAuthor ? 'Não pode votar no próprio guia' : 'Não útil'"
                @click="vote(-1)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <span class="vote-label">{{ guide.upvotes }} upvote{{ guide.upvotes !== 1 ? 's' : '' }}</span>
            </div>

            <div v-if="guide.isAuthor" class="author-actions">
              <RouterLink :to="`/game/${slug}/guides/${guide._id}/edit`" class="btn-action edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                </svg>
                Editar guia
              </RouterLink>
              <button class="btn-action delete" @click="deleteGuide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
                Excluir
              </button>
            </div>
          </div>
        </header>

        <!-- Corpo do guia -->
        <div class="guide-body">

          <!-- Introdução -->
          <div v-if="parsed.intro" class="section intro-section">
            <div class="section-content">{{ parsed.intro }}</div>
          </div>

          <!-- Seções de conquista -->
          <div
            v-for="(section, i) in parsed.sections"
            :key="i"
            class="section conquest-section"
          >
            <!-- Header da conquista -->
            <div class="conquest-header">
              <div class="conquest-thumb">
                <img
                  v-if="achievementMap.get(section.name.toLowerCase())?.image"
                  :src="achievementMap.get(section.name.toLowerCase()).image"
                  :alt="section.name"
                />
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
                </svg>
              </div>
              <div class="conquest-info">
                <span class="conquest-badge">CONQUISTA</span>
                <h3 class="conquest-name">{{ section.name }}</h3>
                <p v-if="achievementMap.get(section.name.toLowerCase())?.description" class="conquest-desc">
                  {{ achievementMap.get(section.name.toLowerCase()).description }}
                </p>
              </div>
              <div
                v-if="achievementMap.get(section.name.toLowerCase())?.percent"
                class="conquest-pct"
                :title="`${achievementMap.get(section.name.toLowerCase()).percent}% dos jogadores obtiveram`"
              >
                {{ Math.round(parseFloat(achievementMap.get(section.name.toLowerCase()).percent)) }}%
              </div>
            </div>

            <!-- Conteúdo da seção -->
            <div v-if="section.content" class="section-content">{{ section.content }}</div>
            <div v-else class="section-empty">Nenhum conteúdo nesta seção.</div>
          </div>

          <!-- Rodapé -->
          <div class="guide-footer">
            <span>{{ wordCount }} palavra{{ wordCount !== 1 ? 's' : '' }}</span>
            <span>·</span>
            <span>{{ parsed.sections.length }} conquista{{ parsed.sections.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { guidesApi, getAchievements } from '../services/api.js';
import { useAuth } from '../composables/useAuth.js';

const route  = useRoute();
const router = useRouter();
const slug   = route.params.slug;
const id     = route.params.id;
const { isAuthenticated } = useAuth();

const guide    = ref(null);
const loading  = ref(true);
const error    = ref('');
const isVoting = ref(false);
const achievementMap = ref(new Map()); // name.toLowerCase() → achievement

// ─── Parse content into sections ─────────────────────────────────────────────
const parsed = computed(() => {
  if (!guide.value?.content) return { intro: '', sections: [] };
  const text = guide.value.content;
  const parts = text.split(/\n=== (.+?) ===/);
  const intro = parts[0].trim();
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({
      name:    parts[i].trim(),
      content: (parts[i + 1] || '').trim()
    });
  }
  return { intro, sections };
});

const scoreClass = computed(() => {
  if (!guide.value) return '';
  if (guide.value.score > 0) return 'positive';
  if (guide.value.score < 0) return 'negative';
  return '';
});

const wordCount = computed(() => {
  if (!guide.value?.content) return 0;
  const t = guide.value.content.replace(/=== .+? ===/g, '').trim();
  return t ? t.split(/\s+/).length : 0;
});

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function vote(v) {
  if (!isAuthenticated.value || guide.value?.isAuthor || isVoting.value) return;
  isVoting.value = true;
  try {
    guide.value = await guidesApi.vote(slug, id, v);
  } catch { /* silencioso */ }
  finally {
    isVoting.value = false;
  }
}

async function deleteGuide() {
  if (!confirm('Tem certeza que deseja excluir este guia?')) return;
  try {
    await guidesApi.remove(slug, id);
    router.push(`/game/${slug}/guides`);
  } catch {
    alert('Erro ao excluir guia.');
  }
}

onMounted(async () => {
  try {
    // Carrega guia e conquistas em paralelo
    const [guideData, p1] = await Promise.all([
      guidesApi.get(slug, id),
      getAchievements(slug, 1).catch(() => ({ results: [] }))
    ]);
    guide.value = guideData;

    const allAchievements = [...(p1.results || [])];
    if (p1.next) {
      const p2 = await getAchievements(slug, 2).catch(() => ({ results: [] }));
      allAchievements.push(...(p2.results || []));
    }
    achievementMap.value = new Map(allAchievements.map(a => [a.name.toLowerCase(), a]));
  } catch {
    error.value = 'Guia não encontrado.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px 24px 80px;
}

.content-wrap {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ─── Back ───────────────────────────────────────────────── */
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

/* ─── States ─────────────────────────────────────────────── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  color: var(--text-muted);
}
.state-box svg { width: 48px; height: 48px; opacity: 0.4; }
.state-box.error { color: #ff6b6b; }
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Guide header ────────────────────────────────────────── */
.guide-header {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-headline h1 {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 10px;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.meta-author {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  color: var(--text);
}
.meta-author svg { width: 14px; height: 14px; }
.meta-sep { opacity: 0.4; }

.meta-edited {
  display: flex;
  align-items: center;
  gap: 4px;
  font-style: italic;
  font-size: 12px;
}
.meta-edited svg { width: 11px; height: 11px; }

/* ─── Toolbar: votes + actions ────────────────────────────── */
.guide-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.vote-group {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
}

.vote-btn {
  width: 30px; height: 30px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  cursor: pointer;
}
.vote-btn svg { width: 16px; height: 16px; }
.vote-btn:hover:not(:disabled) { background: var(--border); color: var(--text); }
.vote-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.vote-btn.up.active   { color: #f5a623; background: rgba(245,166,35,0.12); }
.vote-btn.down.active { color: #6c8eff; background: rgba(108,142,255,0.12); }

.vote-score {
  font-size: 16px;
  font-weight: 700;
  min-width: 26px;
  text-align: center;
  color: var(--text-muted);
}
.vote-score.positive { color: #f5a623; }
.vote-score.negative { color: #6c8eff; }

.vote-label {
  font-size: 12px;
  color: var(--text-muted);
  padding-left: 4px;
  border-left: 1px solid var(--border);
  margin-left: 2px;
}

.author-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-action svg { width: 14px; height: 14px; }

.btn-action.edit {
  background: rgba(0,112,209,0.1);
  color: var(--accent);
  border: 1px solid rgba(0,112,209,0.2);
}
.btn-action.edit:hover { background: rgba(0,112,209,0.2); }

.btn-action.delete {
  background: rgba(255,80,80,0.08);
  color: #ff6b6b;
  border: 1px solid rgba(255,80,80,0.15);
}
.btn-action.delete:hover { background: rgba(255,80,80,0.18); }

/* ─── Guide body ─────────────────────────────────────────── */
.guide-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Sections ───────────────────────────────────────────── */
.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

/* Intro */
.intro-section .section-content {
  padding: 22px 26px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Conquest section */
.conquest-section { border-left: 3px solid var(--accent); }

.conquest-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 22px;
  background: linear-gradient(135deg, rgba(0,112,209,0.06) 0%, transparent 60%);
  border-bottom: 1px solid var(--border);
}

.conquest-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: var(--surface2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border);
}
.conquest-thumb img { width: 100%; height: 100%; object-fit: cover; }
.conquest-thumb svg { width: 26px; height: 26px; color: var(--text-muted); opacity: 0.5; }

.conquest-info { flex: 1; min-width: 0; }

.conquest-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent);
  background: rgba(0,112,209,0.1);
  border-radius: 4px;
  padding: 2px 6px;
  margin-bottom: 5px;
}

.conquest-name {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
  margin-bottom: 4px;
}

.conquest-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.conquest-pct {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
}

.section-content {
  padding: 18px 22px;
  font-size: 14px;
  line-height: 1.85;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.section-empty {
  padding: 16px 22px;
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}

/* ─── Footer ─────────────────────────────────────────────── */
.guide-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 0;
}
</style>
