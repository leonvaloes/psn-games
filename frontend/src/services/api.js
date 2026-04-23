import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Injeta token em todas as requisições autenticadas
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Jogos (RAWG) ─────────────────────────────────────────────────────────────
export function searchGames(query, page = 1) {
  return api.get('/games/search', { params: { q: query, page } }).then(r => r.data);
}

export function getGame(slug) {
  return api.get(`/games/${slug}`).then(r => r.data);
}

export function getAchievements(slug, page = 1) {
  return api.get(`/games/${slug}/achievements`, { params: { page } }).then(r => r.data);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }).then(r => r.data),

  login: (email, password) =>
    api.post('/auth/login', { email, password }).then(r => r.data),

  me: () =>
    api.get('/auth/me').then(r => r.data)
};

// ─── Usuário ──────────────────────────────────────────────────────────────────
export const userApi = {
  getFavorites:  ()     => api.get('/user/favorites').then(r => r.data),
  addFavorite:   (body) => api.post('/user/favorites', body).then(r => r.data),
  removeFavorite:(slug) => api.delete(`/user/favorites/${slug}`).then(r => r.data),

  getAchievements:   (gameSlug)              => api.get(`/user/achievements/${gameSlug}`).then(r => r.data),
  addAchievement:    (gameSlug, achievementId) => api.post(`/user/achievements/${gameSlug}`, { achievementId }).then(r => r.data),
  removeAchievement: (gameSlug, achievementId) => api.delete(`/user/achievements/${gameSlug}/${achievementId}`).then(r => r.data)
};

// ─── Guias de platina ─────────────────────────────────────────────────────────
export const guidesApi = {
  list:   (gameSlug, params) => api.get(`/guides/${gameSlug}`, { params }).then(r => r.data),
  get:    (gameSlug, id)     => api.get(`/guides/${gameSlug}/${id}`).then(r => r.data),
  create: (gameSlug, body)   => api.post(`/guides/${gameSlug}`, body).then(r => r.data),
  update: (gameSlug, id, body) => api.put(`/guides/${gameSlug}/${id}`, body).then(r => r.data),
  remove: (gameSlug, id)     => api.delete(`/guides/${gameSlug}/${id}`).then(r => r.data),
  vote:   (gameSlug, id, vote) => api.post(`/guides/${gameSlug}/${id}/vote`, { vote }).then(r => r.data)
};
