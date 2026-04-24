import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Guide from '../src/models/Guide.js';

const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET || 'test-secret';

if (!mongoUri) {
  throw new Error('MONGO_URI must be defined to run backend tests');
}

process.env.JWT_SECRET = jwtSecret;

let server;
let baseUrl;

function unique(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function json(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

async function register(prefix) {
  const credentials = {
    username: unique(prefix),
    email: `${unique(prefix)}@example.com`,
    password: 'senha123'
  };

  const response = await json('POST', '/api/auth/register', { body: credentials });
  assert.equal(response.status, 201);
  return response.data;
}

async function createGuide(token, slug, title = 'Guia de teste') {
  const response = await json('POST', `/api/guides/${slug}`, {
    token,
    body: {
      title,
      content: 'Introducao do guia\n=== Trofeu Principal ===\nPasso a passo.'
    }
  });

  assert.equal(response.status, 201);
  return response.data;
}

async function voteGuide(token, slug, guideId, vote) {
  const response = await json('POST', `/api/guides/${slug}/${guideId}/vote`, {
    token,
    body: { vote }
  });

  assert.equal(response.status, 200);
  return response.data;
}

test.before(async () => {
  await mongoose.connect(`${mongoUri}-backend-tests`);

  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close(err => (err ? reject(err) : resolve()));
  });
  await mongoose.disconnect();
});

test.beforeEach(async () => {
  await Promise.all([
    Guide.deleteMany({}),
    User.deleteMany({})
  ]);
});

test('switches from upvote to downvote without corrupting score', async () => {
  const slug = unique('vote_switch');
  const author = await register('author');
  const voterA = await register('voter_a');
  const voterB = await register('voter_b');
  const guide = await createGuide(author.token, slug);

  await voteGuide(voterA.token, slug, guide._id, 1);
  await voteGuide(voterB.token, slug, guide._id, 1);

  let current = await json('GET', `/api/guides/${slug}/${guide._id}`, { token: voterA.token });
  assert.equal(current.status, 200);
  assert.equal(current.data.score, 2);
  assert.equal(current.data.upvotes, 2);
  assert.equal(current.data.downvotes, 0);
  assert.equal(current.data.userVote, 1);

  await voteGuide(voterA.token, slug, guide._id, -1);

  current = await json('GET', `/api/guides/${slug}/${guide._id}`, { token: voterA.token });
  assert.equal(current.status, 200);
  assert.equal(current.data.score, 0);
  assert.equal(current.data.upvotes, 1);
  assert.equal(current.data.downvotes, 1);
  assert.equal(current.data.userVote, -1);
});

test('toggles repeated votes consistently under stress', async () => {
  const slug = unique('vote_stress');
  const author = await register('author');
  const voter = await register('voter');
  const guide = await createGuide(author.token, slug);

  await Promise.all(Array.from({ length: 11 }, () => voteGuide(voter.token, slug, guide._id, 1)));

  let current = await json('GET', `/api/guides/${slug}/${guide._id}`, { token: voter.token });
  assert.equal(current.status, 200);
  assert.equal(current.data.score, 1);
  assert.equal(current.data.upvotes, 1);
  assert.equal(current.data.downvotes, 0);
  assert.equal(current.data.userVote, 1);

  await Promise.all(Array.from({ length: 9 }, () => voteGuide(voter.token, slug, guide._id, 1)));

  current = await json('GET', `/api/guides/${slug}/${guide._id}`, { token: voter.token });
  assert.equal(current.status, 200);
  assert.equal(current.data.score, 0);
  assert.equal(current.data.upvotes, 0);
  assert.equal(current.data.downvotes, 0);
  assert.equal(current.data.userVote, 0);

  await Promise.all(Array.from({ length: 7 }, () => voteGuide(voter.token, slug, guide._id, -1)));

  current = await json('GET', `/api/guides/${slug}/${guide._id}`, { token: voter.token });
  assert.equal(current.status, 200);
  assert.equal(current.data.score, -1);
  assert.equal(current.data.upvotes, 0);
  assert.equal(current.data.downvotes, 1);
  assert.equal(current.data.userVote, -1);
});

test('rejects voting on your own guide', async () => {
  const slug = unique('vote_author');
  const author = await register('author');
  const guide = await createGuide(author.token, slug);

  const response = await json('POST', `/api/guides/${slug}/${guide._id}/vote`, {
    token: author.token,
    body: { vote: 1 }
  });

  assert.equal(response.status, 400);
  assert.match(response.data.error, /próprio guia/i);
});
