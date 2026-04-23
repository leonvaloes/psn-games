import { ref, computed } from 'vue';
import { userApi } from '../services/api.js';
import { useAuth } from './useAuth.js';

const favorites = ref([]);
let loaded = false;

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const slugSet = computed(() => new Set(favorites.value.map(f => f.slug)));

  async function load() {
    if (!isAuthenticated.value || loaded) return;
    favorites.value = await userApi.getFavorites();
    loaded = true;
  }

  function reset() {
    favorites.value = [];
    loaded = false;
  }

  function isFavorite(slug) {
    return slugSet.value.has(slug);
  }

  async function toggle(game) {
    if (!isAuthenticated.value) return;
    if (isFavorite(game.slug)) {
      await userApi.removeFavorite(game.slug);
      favorites.value = favorites.value.filter(f => f.slug !== game.slug);
    } else {
      const fav = await userApi.addFavorite({
        slug:            game.slug,
        name:            game.name,
        backgroundImage: game.background_image || null,
        metacritic:      game.metacritic || null,
        released:        game.released || null
      });
      favorites.value.unshift(fav);
    }
  }

  return { favorites, isFavorite, toggle, load, reset };
}
