<template>
  <div class="trophy" :class="{ done: isDone }" @click="$emit('open-guide', trophy)">
    <div class="trophy-img">
      <img v-if="trophy.image" :src="trophy.image" :alt="trophy.name" loading="lazy" />
      <div v-else class="trophy-placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
        </svg>
      </div>
    </div>

    <div class="trophy-info">
      <span class="trophy-name">{{ trophy.name }}</span>
      <span class="trophy-desc">{{ trophy.description || 'Sem descrição disponível' }}</span>
    </div>

    <div class="trophy-right">
      <div class="trophy-percent">
        <svg viewBox="0 0 36 36" class="circle-chart">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" stroke-width="3"/>
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            :stroke="isDone ? '#46c864' : 'var(--accent)'"
            stroke-width="3"
            stroke-dasharray="100"
            :stroke-dashoffset="100 - percent"
            stroke-linecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span>{{ percent }}%</span>
      </div>

      <!-- Checkbox apenas quando autenticado -->
      <button
        v-if="isAuthenticated"
        class="done-btn"
        :class="{ active: isDone }"
        :title="isDone ? 'Marcar como não feito' : 'Marcar como feito'"
        @click="$emit('toggle', trophy.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline v-if="isDone" points="20 6 9 17 4 12"/>
          <circle v-else cx="12" cy="12" r="9"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const props = defineProps({
  trophy: { type: Object, required: true },
  isDone: { type: Boolean, default: false }
});

defineEmits(['toggle', 'open-guide']);

const { isAuthenticated } = useAuth();
const percent = computed(() => Math.round(parseFloat(props.trophy.percent || 0)));
</script>

<style scoped>
.trophy {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.2s;
  cursor: pointer;
}

.trophy:hover { border-color: var(--accent); }
.trophy.done  { border-color: rgba(70, 200, 100, 0.4); background: rgba(70, 200, 100, 0.04); }

.trophy-img {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface2);
}

.trophy-img img { width: 100%; height: 100%; object-fit: cover; }

.trophy-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
}

.trophy-placeholder svg { width: 28px; height: 28px; }

.trophy-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trophy-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trophy-desc {
  font-size: 12px;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trophy-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.trophy-percent {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-chart {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.trophy-percent span {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  position: relative;
}

.done-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.done-btn svg { width: 16px; height: 16px; }

.done-btn:hover {
  color: #46c864;
  border-color: #46c864;
}

.done-btn.active {
  color: #46c864;
  border-color: #46c864;
  background: rgba(70, 200, 100, 0.12);
}
</style>
