import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Favorite from '../models/Favorite.js';
import UserAchievement from '../models/UserAchievement.js';

const router = Router();
router.use(requireAuth);

// ─── Favoritos ────────────────────────────────────────────────────────────────

router.get('/favorites', async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch {
    res.status(500).json({ error: 'Erro ao listar favoritos' });
  }
});

router.post('/favorites', async (req, res) => {
  const { slug, name, backgroundImage, metacritic, released } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'slug e name são obrigatórios' });

  try {
    const fav = await Favorite.findOneAndUpdate(
      { userId: req.userId, slug },
      { name, backgroundImage, metacritic, released },
      { upsert: true, new: true }
    );
    res.status(201).json(fav);
  } catch {
    res.status(500).json({ error: 'Erro ao favoritar jogo' });
  }
});

router.delete('/favorites/:slug', async (req, res) => {
  try {
    await Favorite.deleteOne({ userId: req.userId, slug: req.params.slug });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

// ─── Conquistas concluídas ─────────────────────────────────────────────────────

router.get('/achievements/:gameSlug', async (req, res) => {
  try {
    const docs = await UserAchievement.find({
      userId: req.userId,
      gameSlug: req.params.gameSlug
    });
    res.json(docs.map(d => d.achievementId));
  } catch {
    res.status(500).json({ error: 'Erro ao listar conquistas' });
  }
});

router.post('/achievements/:gameSlug', async (req, res) => {
  const { achievementId } = req.body;
  if (achievementId === undefined) return res.status(400).json({ error: 'achievementId obrigatório' });

  try {
    await UserAchievement.findOneAndUpdate(
      { userId: req.userId, gameSlug: req.params.gameSlug, achievementId },
      { completedAt: new Date() },
      { upsert: true }
    );
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar conquista' });
  }
});

router.delete('/achievements/:gameSlug/:achievementId', async (req, res) => {
  try {
    await UserAchievement.deleteOne({
      userId: req.userId,
      gameSlug: req.params.gameSlug,
      achievementId: Number(req.params.achievementId)
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao remover conquista' });
  }
});

export default router;
