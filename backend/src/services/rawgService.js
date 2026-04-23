import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.rawg.io/api',
  params: { key: process.env.RAWG_API_KEY }
});

export async function searchGames(query, page = 1, pageSize = 20) {
  const { data } = await client.get('/games', {
    params: {
      search: query,
      page,
      page_size: pageSize,
      ordering: '-rating'
    }
  });
  return data;
}

export async function getGame(slug) {
  const { data } = await client.get(`/games/${slug}`);
  return data;
}

export async function getGameAchievements(slug, page = 1) {
  const { data } = await client.get(`/games/${slug}/achievements`, {
    params: { page, page_size: 50 }
  });
  return data;
}
