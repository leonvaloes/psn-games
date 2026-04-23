import express from 'express';
import cors from 'cors';
import gamesRouter  from './routes/games.js';
import authRouter   from './routes/auth.js';
import userRouter   from './routes/user.js';
import guidesRouter from './routes/guides.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/games', gamesRouter);
app.use('/api/auth', authRouter);
app.use('/api/user',   userRouter);
app.use('/api/guides', guidesRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

export default app;
