<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal" role="dialog" aria-modal="true">

          <!-- Header -->
          <div class="modal-header">
            <button class="btn-close" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Achievement info -->
          <div class="achievement-row">
            <div class="ach-thumb">
              <img v-if="achievement.image" :src="achievement.image" :alt="achievement.name" />
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
              </svg>
            </div>
            <div class="ach-info">
              <span class="ach-badge">CONQUISTA</span>
              <h2 class="ach-name">{{ achievement.name }}</h2>
              <p v-if="achievement.description" class="ach-desc">{{ achievement.description }}</p>
              <span v-if="achievement.percent" class="ach-rarity">
                {{ Math.round(parseFloat(achievement.percent)) }}% dos jogadores obtiveram
              </span>
            </div>
          </div>

          <div class="divider" />

          <!-- Guide section -->
          <div v-if="loading" class="guide-state">
            <div class="spinner" />
            <span>Buscando guia...</span>
          </div>

          <div v-else-if="!bestGuide" class="guide-state empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            <p>Nenhum guia cobre esta conquista ainda.</p>
            <RouterLink :to="`/game/${gameSlug}/guides/new`" class="btn-create" @click="$emit('close')">
              Seja o primeiro a escrever!
            </RouterLink>
          </div>

          <template v-else>
            <div class="guide-meta-bar">
              <span class="guide-label">Guia mais votado</span>
              <div class="guide-score" :class="scoreClass">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
                {{ bestGuide.score }}
              </div>
            </div>

            <div class="guide-card-inner">
              <h3 class="guide-title">{{ bestGuide.title }}</h3>
              <div class="guide-author-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {{ bestGuide.authorName }}
                <span class="dot">·</span>
                {{ formatDate(bestGuide.createdAt) }}
              </div>

              <div v-if="sectionContent" class="guide-section-content">
                {{ sectionContent }}
              </div>
              <div v-else class="guide-section-empty">
                Seção sem conteúdo de texto.
              </div>
            </div>

            <div class="modal-footer">
              <RouterLink
                :to="`/game/${gameSlug}/guides/${bestGuide._id}`"
                class="btn-full-guide"
                @click="$emit('close')"
              >
                Ver guia completo
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </RouterLink>
            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { guidesApi } from '../services/api.js';

const props = defineProps({
  show:        { type: Boolean, required: true },
  achievement: { type: Object,  required: true },
  gameSlug:    { type: String,  required: true }
});
defineEmits(['close']);

const loading   = ref(false);
const bestGuide = ref(null);

const sectionContent = computed(() => {
  if (!bestGuide.value) return null;
  const parts = bestGuide.value.content.split(/\n=== (.+?) ===/);
  for (let i = 1; i < parts.length; i += 2) {
    if (parts[i].trim().toLowerCase() === props.achievement.name.toLowerCase()) {
      return (parts[i + 1] || '').trim() || null;
    }
  }
  return null;
});

const scoreClass = computed(() => {
  if (!bestGuide.value) return '';
  if (bestGuide.value.score > 0) return 'positive';
  if (bestGuide.value.score < 0) return 'negative';
  return '';
});

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function findBestGuide() {
  loading.value  = true;
  bestGuide.value = null;
  try {
    const data = await guidesApi.list(props.gameSlug, { limit: 100 });
    const marker = `=== ${props.achievement.name} ===`;
    const matching = (data.results || []).filter(g => g.content.includes(marker));
    matching.sort((a, b) => b.score - a.score);
    bestGuide.value = matching[0] || null;
  } catch { /* silencioso */ }
  finally { loading.value = false; }
}

watch(() => props.show, (val) => {
  if (val) findBestGuide();
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

/* Header */
.modal-header {
  display: flex;
  justify-content: flex-end;
  padding: 12px 12px 0;
}

.btn-close {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.btn-close svg { width: 16px; height: 16px; }
.btn-close:hover { background: var(--border); color: var(--text); }

/* Achievement row */
.achievement-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 4px 22px 22px;
}

.ach-thumb {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.ach-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ach-thumb svg { width: 28px; height: 28px; color: var(--gold); }

.ach-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ach-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent);
}

.ach-name {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--text);
}

.ach-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.ach-rarity {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2px 10px;
  width: fit-content;
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 0 22px;
}

/* Loading / empty */
.guide-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 24px;
  color: var(--text-muted);
  font-size: 14px;
}
.guide-state.empty svg { width: 40px; height: 40px; opacity: 0.3; }

.btn-create {
  padding: 8px 20px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-create:hover { background: var(--accent-hover); }

/* Guide meta bar */
.guide-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px 8px;
}

.guide-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.guide-score {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
}
.guide-score svg { width: 14px; height: 14px; }
.guide-score.positive { color: #f5a623; }
.guide-score.negative { color: #6c8eff; }

/* Guide card inner */
.guide-card-inner {
  margin: 0 22px;
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.35;
}

.guide-author-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
}
.guide-author-row svg { width: 12px; height: 12px; }
.dot { opacity: 0.4; }

.guide-section-content {
  font-size: 13px;
  color: var(--text);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.guide-section-empty {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

/* Footer */
.modal-footer {
  padding: 16px 22px 22px;
  display: flex;
  justify-content: flex-end;
}

.btn-full-guide {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-full-guide svg { width: 14px; height: 14px; }
.btn-full-guide:hover { background: var(--accent-hover); }

/* Spinner */
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal scrollbar */
.modal::-webkit-scrollbar { width: 4px; }
.modal::-webkit-scrollbar-track { background: transparent; }
.modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* Transitions */
.modal-enter-active { transition: all 0.2s ease; }
.modal-leave-active { transition: all 0.15s ease; }
.modal-enter-from  { opacity: 0; }
.modal-leave-to    { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.95) translateY(8px); }
.modal-leave-to   .modal { transform: scale(0.95) translateY(8px); }
</style>
