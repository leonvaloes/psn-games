import { Router } from 'express';
import mongoose from 'mongoose';
import Guide from '../models/Guide.js';
import User  from '../models/User.js';
import * as rawg from '../services/rawgService.js';
import { generateGuideDraft } from '../services/aiGuideService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ─── Listar guias de um jogo (público, ordenado por score desc) ───────────────
router.get('/:gameSlug', optionalAuth, async (req, res) => {
  const { page = 1, limit = 20, sort = 'score' } = req.query;
  const userId = req.userId; // pode ser undefined (rota pública)

  try {
    const guides = await Guide.find({ gameSlug: req.params.gameSlug })
      .sort(sort === 'new' ? { createdAt: -1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Guide.countDocuments({ gameSlug: req.params.gameSlug });

    // Ordena por score no JS (evita complexidade no aggregation)
    const sorted = sort === 'score'
      ? guides.sort((a, b) => b.score - a.score)
      : guides;

    res.json({
      results: sorted.map(g => g.toPublic(userId)),
      count: total,
      page: Number(page)
    });
  } catch {
    res.status(500).json({ error: 'Erro ao listar guias' });
  }
});

// ─── Buscar guia por ID (público) ─────────────────────────────────────────────
router.get('/:gameSlug/:id', optionalAuth, async (req, res) => {
  try {
    const guide = await Guide.findOne({ _id: req.params.id, gameSlug: req.params.gameSlug });
    if (!guide) return res.status(404).json({ error: 'Guia não encontrado' });
    res.json(guide.toPublic(req.userId));
  } catch {
    res.status(500).json({ error: 'Erro ao buscar guia' });
  }
});

// ─── Criar guia (auth) ────────────────────────────────────────────────────────
router.post('/:gameSlug', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'título e conteúdo são obrigatórios' });
  }

  try {
    const author = await User.findById(req.userId);
    if (!author) return res.status(404).json({ error: 'Usuário não encontrado' });

    const guide = await Guide.create({
      gameSlug:   req.params.gameSlug,
      title:      title.trim(),
      content:    content.trim(),
      authorId:   req.userId,
      authorName: author.username
    });

    res.status(201).json(guide.toPublic(req.userId));
  } catch {
    res.status(500).json({ error: 'Erro ao criar guia' });
  }
});

// ─── Gerar primeiro guia com IA (auth) ───────────────────────────────────────
router.post('/:gameSlug/ai-generate', requireAuth, async (req, res) => {
  const gameSlug = req.params.gameSlug;

  try {
    const existingCount = await Guide.countDocuments({ gameSlug });
    if (existingCount > 0) {
      return res.status(409).json({ error: 'Este jogo já possui guia publicado' });
    }

    const author = await User.findById(req.userId);
    if (!author) return res.status(404).json({ error: 'Usuário não encontrado' });

    const [game, achievementsData] = await Promise.all([
      rawg.getGame(gameSlug),
      rawg.getGameAchievements(gameSlug, 1).catch(() => ({ results: [] }))
    ]);

    const draft = await generateGuideDraft({
      game: { ...game, slug: gameSlug },
      achievements: achievementsData.results || []
    });

    const guide = await Guide.create({
      gameSlug,
      title: draft.title,
      content: draft.content,
      authorId: req.userId,
      authorName: author.username
    });

    res.status(201).json(guide.toPublic(req.userId));
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: status === 503 ? err.message : 'Erro ao gerar guia com IA'
    });
  }
});

// ─── Editar guia (somente autor) ──────────────────────────────────────────────
router.put('/:gameSlug/:id', requireAuth, async (req, res) => {
  const { title, content } = req.body;

  try {
    const guide = await Guide.findOne({ _id: req.params.id, gameSlug: req.params.gameSlug });
    if (!guide) return res.status(404).json({ error: 'Guia não encontrado' });
    if (guide.authorId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Sem permissão para editar este guia' });
    }

    if (title?.trim())   guide.title   = title.trim();
    if (content?.trim()) guide.content = content.trim();
    await guide.save();

    res.json(guide.toPublic(req.userId));
  } catch {
    res.status(500).json({ error: 'Erro ao editar guia' });
  }
});

// ─── Deletar guia (somente autor) ─────────────────────────────────────────────
router.delete('/:gameSlug/:id', requireAuth, async (req, res) => {
  try {
    const guide = await Guide.findOne({ _id: req.params.id, gameSlug: req.params.gameSlug });
    if (!guide) return res.status(404).json({ error: 'Guia não encontrado' });
    if (guide.authorId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Sem permissão para deletar este guia' });
    }

    await guide.deleteOne();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao deletar guia' });
  }
});

// ─── Votar em um guia (auth) — toggle: votar de novo remove o voto ────────────
router.post('/:gameSlug/:id/vote', requireAuth, async (req, res) => {
  const { vote } = req.body; // 1 = upvote, -1 = downvote
  if (vote !== 1 && vote !== -1) {
    return res.status(400).json({ error: 'vote deve ser 1 ou -1' });
  }

  try {
    const guide = await Guide.findOne({ _id: req.params.id, gameSlug: req.params.gameSlug });
    if (!guide) return res.status(404).json({ error: 'Guia não encontrado' });
    if (guide.authorId.toString() === req.userId) {
      return res.status(400).json({ error: 'Não é possível votar no próprio guia' });
    }

    const userId = req.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const removeUserFrom = field => ({
      $filter: {
        input: `$${field}`,
        as: 'existingVote',
        cond: { $ne: ['$$existingVote', userObjectId] }
      }
    });

    const updated = await Guide.findOneAndUpdate(
      { _id: guide._id, gameSlug: req.params.gameSlug },
      vote === 1
        ? [
            {
              $set: {
                upvotes: {
                  $cond: [
                    { $in: [userObjectId, '$upvotes'] },
                    removeUserFrom('upvotes'),
                    { $concatArrays: [removeUserFrom('upvotes'), [userObjectId]] }
                  ]
                },
                downvotes: {
                  $cond: [
                    { $in: [userObjectId, '$upvotes'] },
                    '$downvotes',
                    removeUserFrom('downvotes')
                  ]
                }
              }
            }
          ]
        : [
            {
              $set: {
                downvotes: {
                  $cond: [
                    { $in: [userObjectId, '$downvotes'] },
                    removeUserFrom('downvotes'),
                    { $concatArrays: [removeUserFrom('downvotes'), [userObjectId]] }
                  ]
                },
                upvotes: {
                  $cond: [
                    { $in: [userObjectId, '$downvotes'] },
                    '$upvotes',
                    removeUserFrom('upvotes')
                  ]
                }
              }
            }
          ],
      { new: true }
    );
    
    res.json(updated.toPublic(req.userId));
  } catch {
    res.status(500).json({ error: 'Erro ao processar voto' });
  }
});

export default router;
