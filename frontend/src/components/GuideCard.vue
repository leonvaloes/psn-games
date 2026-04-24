<template>
  <div class="guide-card">
    <!-- Coluna de votos -->
    <div class="vote-col">
      <button
        class="vote-btn up"
        :class="{ active: guide.userVote === 1 }"
        :disabled="!isAuthenticated || guide.isAuthor || isVoting"
        :title="guide.isAuthor ? 'Não é possível votar no próprio guia' : 'Upvote'"
        @click.stop="$emit('vote', guide._id, 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>

      <span class="score" :class="scoreClass">{{ guide.score }}</span>

      <button
        class="vote-btn down"
        :class="{ active: guide.userVote === -1 }"
        :disabled="!isAuthenticated || guide.isAuthor || isVoting"
        :title="guide.isAuthor ? 'Não é possível votar no próprio guia' : 'Downvote'"
        @click.stop="$emit('vote', guide._id, -1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    </div>

    <!-- Thumbnail da conquista -->
    <div class="achievement-thumb">
      <img v-if="firstAchievement?.image" :src="firstAchievement.image" :alt="firstAchievement.name" />
      <svg v-else viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
      </svg>
    </div>

    <!-- Conteúdo -->
    <RouterLink :to="`/game/${guide.gameSlug}/guides/${guide._id}`" class="guide-body">
      <h3 class="guide-title">{{ guide.title }}</h3>
      <p class="guide-preview">{{ preview }}</p>
      <div class="guide-meta">
        <span class="author">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          {{ guide.authorName }}
        </span>
        <span class="date">{{ formatDate(guide.createdAt) }}</span>
        <span v-if="guide.updatedAt !== guide.createdAt" class="edited">(editado)</span>
      </div>
    </RouterLink>

    <!-- Ações do autor -->
    <div v-if="guide.isAuthor" class="guide-actions">
      <RouterLink :to="`/game/${guide.gameSlug}/guides/${guide._id}/edit`" class="btn-action edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
        </svg>
      </RouterLink>
      <button class="btn-action delete" @click.stop="$emit('delete', guide._id)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';

const props = defineProps({
  guide: { type: Object, required: true },
  achievementMap: { type: Map, default: () => new Map() },
  isVoting: { type: Boolean, default: false }
});
defineEmits(['vote', 'delete']);

const { isAuthenticated } = useAuth();

const firstAchievement = computed(() => {
  const match = props.guide.content?.match(/=== (.+?) ===/);
  if (!match) return null;
  return props.achievementMap.get(match[1].trim().toLowerCase()) || null;
});

const preview = computed(() => {
  const text = (props.guide.content || '').replace(/\n?=== .+? ===\n?/g, ' ').trim();
  return text.length > 160 ? text.slice(0, 160) + '…' : text;
});

const scoreClass = computed(() => {
  if (props.guide.score > 0) return 'positive';
  if (props.guide.score < 0) return 'negative';
  return '';
});

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
</script>

<style scoped>
.guide-card {
  display: flex;
  gap: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.2s;
}

.guide-card:hover { border-color: var(--accent); }

/* Coluna de votos */
.vote-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding: 16px 10px;
  background: var(--surface2);
  min-width: 52px;
}

.vote-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
}

.vote-btn svg { width: 16px; height: 16px; }

.vote-btn:hover:not(:disabled) { background: var(--border); }
.vote-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.vote-btn.up.active  { color: #f5a623; }
.vote-btn.down.active { color: #6c8eff; }

.score {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 24px;
  text-align: center;
}

.score.positive { color: #f5a623; }
.score.negative { color: #6c8eff; }

/* Thumbnail da conquista */
.achievement-thumb {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  margin: auto 0;
  margin-left: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

.achievement-thumb img { width: 100%; height: 100%; object-fit: cover; }
.achievement-thumb svg { width: 22px; height: 22px; color: var(--text-muted); opacity: 0.4; }

/* Corpo do guia */
.guide-body {
  flex: 1;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  min-width: 0;
}

.guide-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text);
}

.guide-preview {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.author {
  display: flex;
  align-items: center;
  gap: 4px;
}

.author svg { width: 12px; height: 12px; }
.edited { font-style: italic; }

/* Ações do autor */
.guide-actions {
  display: flex;
  flex-direction: column;
  padding: 12px 10px;
  gap: 6px;
  border-left: 1px solid var(--border);
}

.btn-action {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
  cursor: pointer;
}

.btn-action svg { width: 14px; height: 14px; }
.btn-action.edit:hover  { color: var(--accent); background: rgba(0,112,209,0.1); }
.btn-action.delete:hover { color: #ff6b6b; background: rgba(255,80,80,0.1); }
</style>
