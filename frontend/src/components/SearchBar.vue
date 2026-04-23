<template>
  <form class="search-bar" @submit.prevent="emit('search', query)">
    <div class="input-wrap">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Buscar jogos..."
        autocomplete="off"
        @input="onInput"
      />
      <button v-if="query" type="button" class="clear" @click="clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
    <button type="submit" class="btn-search">Buscar</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ modelValue: { type: String, default: '' } });
const emit = defineEmits(['search', 'update:modelValue']);

const query = ref(props.modelValue);

let debounceTimer;
function onInput() {
  emit('update:modelValue', query.value);
  clearTimeout(debounceTimer);
  if (query.value.length >= 3) {
    debounceTimer = setTimeout(() => emit('search', query.value), 500);
  }
}

function clear() {
  query.value = '';
  emit('update:modelValue', '');
  emit('search', '');
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 700px;
}

.input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  pointer-events: none;
}

input {
  width: 100%;
  padding: 12px 42px 12px 44px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

input::placeholder {
  color: var(--text-muted);
}

input:focus {
  border-color: var(--accent);
}

.clear {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.clear svg {
  width: 16px;
  height: 16px;
}

.clear:hover {
  color: var(--text);
}

.btn-search {
  padding: 12px 24px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-search:hover {
  background: var(--accent-hover);
}
</style>
