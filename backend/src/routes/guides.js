import { Router } from 'express';
import Guide from '../models/Guide.js';
import User  from '../models/User.js';
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

    const upIdx   = guide.upvotes.findIndex(id => id.toString() === req.userId);
    const downIdx = guide.downvotes.findIndex(id => id.toString() === req.userId);

    if (vote === 1) {
      if (upIdx >= 0) {
        guide.upvotes.splice(upIdx, 1);                          // toggle off
      } else {
        guide.upvotes.push(req.userId);
        if (downIdx >= 0) guide.downvotes.splice(downIdx, 1);   // troca de voto
      }
    } else {
      if (downIdx >= 0) {
        guide.downvotes.splice(downIdx, 1);                      // toggle off
      } else {
        guide.downvotes.push(req.userId);
        if (upIdx >= 0) guide.upvotes.splice(upIdx, 1);         // troca de voto
      }
    }

    await guide.save();
    // Re-fetch para garantir ObjectIds corretamente castados
    const updated = await Guide.findById(guide._id);
    res.json(updated.toPublic(req.userId));
  } catch {
    res.status(500).json({ error: 'Erro ao processar voto' });
  }
});

export default router;
