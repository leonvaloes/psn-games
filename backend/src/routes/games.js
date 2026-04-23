import { Router } from 'express';
import * as rawg from '../services/rawgService.js';
import Game from '../models/Game.js';

const router = Router();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

router.get('/search', async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: 'Parâmetro "q" obrigatório' });

  try {
    const data = await rawg.searchGames(q.trim(), Number(page));
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Erro ao buscar jogos na RAWG', detail: err.message });
  }
});

router.get('/:slug/achievements', async (req, res) => {
  const { slug } = req.params;
  const { page = 1 } = req.query;

  try {
    const cached = await Game.findOne({ slug });
    const isFresh = cached?.cachedAt && Date.now() - cached.cachedAt < CACHE_TTL;

    if (isFresh && cached.achievements) {
      return res.json(cached.achievements);
    }

    const data = await rawg.getGameAchievements(slug, Number(page));
    await Game.findOneAndUpdate({ slug }, { achievements: data, cachedAt: new Date() }, { upsert: true });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Erro ao buscar conquistas', detail: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const cached = await Game.findOne({ slug });
    const isFresh = cached?.cachedAt && Date.now() - cached.cachedAt < CACHE_TTL;

    if (isFresh && cached.detail) {
      return res.json(cached.detail);
    }

    const data = await rawg.getGame(slug);
    await Game.findOneAndUpdate({ slug }, { detail: data, cachedAt: new Date() }, { upsert: true });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Erro ao buscar detalhes do jogo', detail: err.message });
  }
});

export default router;
