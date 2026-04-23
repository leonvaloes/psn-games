<template>
  <div class="page">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="editor-header">
      <RouterLink :to="`/game/${slug}/guides`" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Voltar
      </RouterLink>

      <div class="header-center">
        <input
          v-model="title"
          class="title-input"
          placeholder="Título do guia..."
          maxlength="200"
          autocomplete="off"
        />
        <span class="game-tag">{{ slug }}</span>
      </div>

      <div class="header-right">
        <span class="block-count">
          {{ usedIds.size }} conquista{{ usedIds.size !== 1 ? 's' : '' }} adicionada{{ usedIds.size !== 1 ? 's' : '' }}
        </span>
        <button
          class="btn-publish"
          :disabled="loading || !title.trim() || !hasContent"
          @click="submit"
        >
          <svg v-if="loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="10"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 19-7z"/>
          </svg>
          {{ loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Publicar' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="global-error">{{ error }}</div>

    <!-- ── Layout ─────────────────────────────────────────────── -->
    <div class="editor-layout">

      <!-- ── Painel esquerdo ────────────────────────────────── -->
      <aside class="panel" :class="{ empty: availableAchievements.length === 0 && !loadingAchievements }">

        <div class="panel-top">
          <p class="panel-title">Conquistas disponíveis</p>
          <span class="panel-remaining">{{ availableAchievements.length }} restante{{ availableAchievements.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="panel-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input v-model="q" placeholder="Filtrar..." />
        </div>

        <div v-if="loadingAchievements" class="panel-loader">
          <div class="spinner" />
        </div>

        <div v-else-if="availableAchievements.length === 0" class="panel-done">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{{ q ? 'Nenhum resultado' : 'Todas adicionadas!' }}</span>
        </div>

        <TransitionGroup tag="ul" name="slide-out" class="achievement-list">
          <li
            v-for="a in filteredAvailable"
            :key="a.id"
            class="a-item"
            @click="addBlock(a)"
          >
            <div class="a-thumb">
              <img v-if="a.image" :src="a.image" :alt="a.name" loading="lazy" />
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
              </svg>
            </div>
            <div class="a-meta">
              <span class="a-name">{{ a.name }}</span>
              <span class="a-desc">{{ a.description || '—' }}</span>
            </div>
            <div class="a-add">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
          </li>
        </TransitionGroup>
      </aside>

      <!-- ── Editor ─────────────────────────────────────────── -->
      <div class="editor-body">

        <!-- Intro livre -->
        <div class="block intro-block">
          <div class="block-label">Introdução</div>
          <textarea
            v-model="intro"
            class="block-textarea intro-textarea"
            placeholder="Apresente o guia, fale sobre a dificuldade, dicas gerais antes de começar..."
            rows="4"
          />
        </div>

        <!-- Blocos de conquistas -->
        <TransitionGroup name="block-in" tag="div" class="blocks-list">
          <div
            v-for="(block, idx) in blocks"
            :key="block.id"
            class="block conquest-block"
            :class="{ focused: focusedBlock === block.id }"
          >
            <!-- Cabeçalho da conquista -->
            <div class="conquest-header">
              <div class="conquest-thumb">
                <img v-if="block.achievement.image" :src="block.achievement.image" :alt="block.achievement.name" />
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
                </svg>
              </div>
              <div class="conquest-info">
                <span class="conquest-badge">CONQUISTA</span>
                <h3>{{ block.achievement.name }}</h3>
                <p v-if="block.achievement.description">{{ block.achievement.description }}</p>
              </div>
              <div class="conquest-actions">
                <span class="conquest-pct">{{ Math.round(parseFloat(block.achievement.percent || 0)) }}%</span>
                <button
                  class="btn-move"
                  :disabled="idx === 0"
                  title="Mover para cima"
                  @click="moveBlock(idx, -1)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                </button>
                <button
                  class="btn-move"
                  :disabled="idx === blocks.length - 1"
                  title="Mover para baixo"
                  @click="moveBlock(idx, 1)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                <button class="btn-remove" title="Remover seção" @click="removeBlock(idx)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Textarea da conquista -->
            <textarea
              :ref="el => { if (el) blockRefs[block.id] = el }"
              v-model="block.content"
              class="block-textarea"
              :placeholder="`Como obter '${block.achievement.name}': descreva o caminho passo a passo...`"
              rows="5"
              @focus="focusedBlock = block.id"
              @blur="focusedBlock = null"
            />
          </div>
        </TransitionGroup>

        <!-- Empty state do editor -->
        <Transition name="fade">
          <div v-if="blocks.length === 0" class="editor-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            <p>Selecione uma conquista à esquerda<br/>para criar a primeira seção do guia</p>
          </div>
        </Transition>

        <!-- Rodapé -->
        <div v-if="blocks.length > 0" class="editor-footer">
          <span class="word-count">{{ wordCount }} palavra{{ wordCount !== 1 ? 's' : '' }}</span>
          <button
            class="btn-publish-bottom"
            :disabled="loading || !title.trim() || !hasContent"
            @click="submit"
          >
            {{ loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Publicar guia' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { guidesApi, getAchievements } from '../services/api.js';

const route  = useRoute();
const router = useRouter();
const slug   = route.params.slug;
const guideId = route.params.id;
const isEditing = computed(() => !!guideId);

// ─── Form ─────────────────────────────────────────────────────────────────────
const title   = ref('');
const intro   = ref('');
const blocks  = ref([]);   // { id, achievement, content }
const loading = ref(false);
const error   = ref('');
const focusedBlock = ref(null);

let blockCounter = 0;
const blockRefs = {};

// ─── Achievements panel ───────────────────────────────────────────────────────
const achievements       = ref([]);
const loadingAchievements = ref(true);
const usedIds            = ref(new Set());
const q                  = ref('');

const availableAchievements = computed(() =>
  achievements.value.filter(a => !usedIds.value.has(a.id))
);

const filteredAvailable = computed(() => {
  const query = q.value.toLowerCase().trim();
  if (!query) return availableAchievements.value;
  return availableAchievements.value.filter(a =>
    a.name?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query)
  );
});

// ─── Computed ─────────────────────────────────────────────────────────────────
const hasContent = computed(() =>
  intro.value.trim().length > 0 || blocks.value.some(b => b.content.trim().length > 0)
);

const wordCount = computed(() => {
  const text = intro.value + blocks.value.map(b => b.content).join(' ');
  return text.trim() ? text.trim().split(/\s+/).length : 0;
});

// ─── Block operations ─────────────────────────────────────────────────────────
function addBlock(achievement) {
  const id = ++blockCounter;
  usedIds.value = new Set([...usedIds.value, achievement.id]);
  blocks.value.push({ id, achievement, content: '' });
  nextTick(() => {
    const el = blockRefs[id];
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function removeBlock(idx) {
  const [removed] = blocks.value.splice(idx, 1);
  const newSet = new Set(usedIds.value);
  newSet.delete(removed.achievement.id);
  usedIds.value = newSet;
}

function moveBlock(idx, dir) {
  const arr  = blocks.value;
  const dest = idx + dir;
  if (dest < 0 || dest >= arr.length) return;
  [arr[idx], arr[dest]] = [arr[dest], arr[idx]];
}

// ─── Serialize ────────────────────────────────────────────────────────────────
function serialize() {
  const parts = [];
  if (intro.value.trim()) parts.push(intro.value.trim());
  for (const b of blocks.value) {
    parts.push(`\n=== ${b.achievement.name} ===`);
    if (b.content.trim()) parts.push(b.content.trim());
  }
  return parts.join('\n');
}

// Tenta reconstruir blocos a partir de texto salvo (mode edição)
function deserialize(text, achievementMap) {
  const sections = text.split(/\n=== (.+?) ===/);
  intro.value = sections[0].trim();
  for (let i = 1; i < sections.length; i += 2) {
    const name    = sections[i].trim();
    const content = (sections[i + 1] || '').trim();
    const found   = achievementMap.get(name.toLowerCase());
    if (found) {
      const id = ++blockCounter;
      usedIds.value = new Set([...usedIds.value, found.id]);
      blocks.value.push({ id, achievement: found, content });
    } else {
      // Conquista não encontrada — adiciona ao intro como texto
      intro.value += (intro.value ? '\n' : '') + `=== ${name} ===\n${content}`;
    }
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submit() {
  error.value   = '';
  loading.value = true;
  try {
    const payload = { title: title.value, content: serialize() };
    if (isEditing.value) {
      await guidesApi.update(slug, guideId, payload);
      router.push(`/game/${slug}/guides/${guideId}`);
    } else {
      const guide = await guidesApi.create(slug, payload);
      router.push(`/game/${slug}/guides/${guide._id}`);
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao salvar guia.';
  } finally {
    loading.value = false;
  }
}

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Carrega conquistas
  try {
    const p1 = await getAchievements(slug, 1);
    achievements.value = p1.results || [];
    if (p1.next) {
      const p2 = await getAchievements(slug, 2);
      achievements.value.push(...(p2.results || []));
    }
  } catch { /* panel fica vazio */ }
  finally { loadingAchievements.value = false; }

  // Edição: carrega e desserializa
  if (isEditing.value) {
    try {
      const guide = await guidesApi.get(slug, guideId);
      title.value = guide.title;
      const map = new Map(achievements.value.map(a => [a.name.toLowerCase(), a]));
      deserialize(guide.content, map);
    } catch {
      error.value = 'Erro ao carregar guia para edição.';
    }
  }
});
</script>

<style scoped>
/* ─── Reset & page ───────────────────────────────────────────── */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* ─── Header ─────────────────────────────────────────────────── */
.editor-header {
  position: sticky;
  top: 56px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  height: 56px;
  background: rgba(15,15,19,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s;
  flex-shrink: 0;
}
.btn-back svg { width: 15px; height: 15px; }
.btn-back:hover { color: var(--text); }

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.title-input {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  outline: none;
  padding: 4px 0;
  transition: border-color 0.2s;
  min-width: 0;
}
.title-input::placeholder { color: var(--text-muted); font-weight: 400; }
.title-input:focus { border-bottom-color: var(--accent); }

.game-tag {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2px 10px;
  text-transform: capitalize;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.block-count {
  font-size: 12px;
  color: var(--text-muted);
}

.btn-publish {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s, opacity 0.2s;
}
.btn-publish svg { width: 14px; height: 14px; }
.btn-publish:hover:not(:disabled) { background: var(--accent-hover); }
.btn-publish:disabled { opacity: 0.4; cursor: not-allowed; }

.global-error {
  padding: 10px 20px;
  background: rgba(255,80,80,0.08);
  border-bottom: 1px solid rgba(255,80,80,0.2);
  color: #ff6b6b;
  font-size: 13px;
}

/* ─── Layout ─────────────────────────────────────────────────── */
.editor-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 860px) {
  .editor-layout { grid-template-columns: 1fr; }
}

/* ─── Painel ─────────────────────────────────────────────────── */
.panel {
  border-right: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 112px;
  height: calc(100vh - 112px);
  overflow: hidden;
}

.panel-top {
  padding: 14px 14px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.panel-remaining {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface2);
  padding: 1px 7px;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.panel-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 10px 8px;
  padding: 7px 10px;
  background: var(--surface2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
.panel-search svg { width: 13px; height: 13px; color: var(--text-muted); flex-shrink: 0; }
.panel-search input {
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 12px;
  width: 100%;
}
.panel-search input::placeholder { color: var(--text-muted); }

.panel-loader {
  display: flex;
  justify-content: center;
  padding: 28px;
}

.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.panel-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
  color: var(--text-muted);
  font-size: 13px;
}
.panel-done svg { width: 32px; height: 32px; color: #46c864; opacity: 0.7; }

/* ── Lista de conquistas disponíveis ── */
.achievement-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  list-style: none;
}

.a-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.a-item:hover { background: rgba(0,112,209,0.06); }
.a-item:hover .a-add { opacity: 1; transform: scale(1) rotate(0deg); }

.a-thumb {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.a-thumb img { width: 100%; height: 100%; object-fit: cover; }
.a-thumb svg { width: 16px; height: 16px; color: var(--gold); }

.a-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.a-name {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.a-desc {
  font-size: 10.5px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.a-add {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transform: scale(0.5) rotate(-45deg);
  transition: opacity 0.2s, transform 0.2s;
}
.a-add svg { width: 12px; height: 12px; }

/* ─── Editor ─────────────────────────────────────────────────── */
.editor-body {
  padding: 24px 32px 80px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
}

/* ── Blocos genéricos ── */
.block {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.block-label {
  padding: 8px 14px 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.block-textarea {
  padding: 14px 16px;
  background: var(--surface);
  border: none;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  line-height: 1.75;
  outline: none;
  resize: vertical;
  width: 100%;
  transition: background 0.15s;
}
.block-textarea::placeholder { color: var(--text-muted); }
.block-textarea:focus { background: var(--surface2); }

.intro-textarea { min-height: 80px; }

/* ── Bloco de conquista ── */
.conquest-block {
  border-color: var(--border);
}
.conquest-block.focused {
  border-color: rgba(0, 112, 209, 0.4);
  box-shadow: 0 0 0 3px rgba(0, 112, 209, 0.06);
}

.conquest-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(0,112,209,0.08) 0%, rgba(0,112,209,0.03) 100%);
  border-bottom: 1px solid rgba(0,112,209,0.12);
}

.conquest-thumb {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.conquest-thumb img { width: 100%; height: 100%; object-fit: cover; }
.conquest-thumb svg { width: 26px; height: 26px; color: var(--gold); }

.conquest-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.conquest-badge {
  font-size: 9px;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.conquest-info h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conquest-info p {
  font-size: 12px;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.conquest-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.conquest-pct {
  font-size: 11px;
  color: var(--text-muted);
  margin-right: 8px;
}

.btn-move, .btn-remove {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-move svg, .btn-remove svg { width: 14px; height: 14px; }

.btn-move {
  color: var(--text-muted);
}
.btn-move:hover:not(:disabled) {
  background: var(--surface2);
  color: var(--text);
}
.btn-move:disabled { opacity: 0.2; cursor: not-allowed; }

.btn-remove {
  color: var(--text-muted);
  margin-left: 4px;
}
.btn-remove:hover {
  background: rgba(255,80,80,0.1);
  color: #ff6b6b;
}

/* ── Estado vazio ── */
.editor-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 24px;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  line-height: 1.6;
  user-select: none;
}
.editor-empty svg { width: 36px; height: 36px; opacity: 0.3; }

/* ── Footer ── */
.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 0;
  border-top: 1px solid var(--border);
}

.word-count {
  font-size: 12px;
  color: var(--text-muted);
}

.btn-publish-bottom {
  padding: 10px 28px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-publish-bottom:hover:not(:disabled) { background: var(--accent-hover); }
.btn-publish-bottom:disabled { opacity: 0.4; cursor: not-allowed; }

/* ─── Transições ──────────────────────────────────────────────── */

/* Conquistas saindo do painel */
.slide-out-enter-active { transition: all 0.25s ease; }
.slide-out-leave-active { transition: all 0.22s ease; position: absolute; width: 100%; }
.slide-out-enter-from   { opacity: 0; transform: translateX(-12px); }
.slide-out-leave-to     { opacity: 0; transform: translateX(12px); }
.slide-out-move         { transition: transform 0.25s ease; }

/* Blocos entrando no editor */
.block-in-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.block-in-leave-active { transition: all 0.2s ease; }
.block-in-enter-from   { opacity: 0; transform: translateY(-12px) scale(0.97); }
.block-in-leave-to     { opacity: 0; transform: scale(0.97); }
.block-in-move         { transition: transform 0.3s ease; }

/* Fade simples */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

/* ─── Scrollbar do painel ─────────────────────────────────────── */
.achievement-list::-webkit-scrollbar { width: 4px; }
.achievement-list::-webkit-scrollbar-track { background: transparent; }
.achievement-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
</style>
