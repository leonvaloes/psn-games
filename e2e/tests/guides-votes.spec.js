import { test, expect } from '@playwright/test';

function uniqueId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function registerUser(request, prefix) {
  const id = uniqueId(prefix);
  const payload = {
    username: id,
    email: `${id}@example.com`,
    password: 'senha123'
  };

  const response = await request.post('/api/auth/register', { data: payload });
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  return { ...data, credentials: payload };
}

async function createGuide(request, token, slug, title) {
  const response = await request.post(`/api/guides/${slug}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      content: 'Introducao do guia\n=== Trofeu Principal ===\nPasso a passo para concluir.'
    }
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function voteGuide(request, token, slug, guideId, vote) {
  const response = await request.post(`/api/guides/${slug}/${guideId}/vote`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { vote }
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function getGuide(request, slug, guideId, token) {
  const response = await request.get(`/api/guides/${slug}/${guideId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function openGuidesPageAs(page, slug, auth) {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: auth.token, user: auth.user });

  await page.goto(`/game/${slug}/guides`);
}

test.describe('Guias - votos', () => {
  test('troca upvote para downvote e mantém score consistente após reload', async ({ page, request }) => {
    const slug = uniqueId('votes');
    const author = await registerUser(request, 'author');
    const voterA = await registerUser(request, 'voter_a');
    const voterB = await registerUser(request, 'voter_b');
    const guide = await createGuide(request, author.token, slug, 'Guia para testar votos');

    await voteGuide(request, voterA.token, slug, guide._id, 1);
    await voteGuide(request, voterB.token, slug, guide._id, 1);

    await openGuidesPageAs(page, slug, voterA);

    const guideCard = page.locator('.guide-card', { hasText: guide.title });
    const score = guideCard.locator('.score');
    const upButton = guideCard.locator('.vote-btn.up');
    const downButton = guideCard.locator('.vote-btn.down');

    await expect(guideCard).toBeVisible();
    await expect(score).toHaveText('2');
    await expect(upButton).toHaveClass(/active/);
    await expect(downButton).not.toHaveClass(/active/);

    await downButton.click();
    await expect(score).toHaveText('0');
    await expect(downButton).toHaveClass(/active/);
    await expect(upButton).not.toHaveClass(/active/);

    let persisted = await getGuide(request, slug, guide._id, voterA.token);
    expect(persisted.score).toBe(0);
    expect(persisted.upvotes).toBe(1);
    expect(persisted.downvotes).toBe(1);
    expect(persisted.userVote).toBe(-1);

    await page.reload();
    await expect(score).toHaveText('0');
    await expect(downButton).toHaveClass(/active/);

    await downButton.click();
    await expect(score).toHaveText('1');
    await expect(upButton).not.toHaveClass(/active/);
    await expect(downButton).not.toHaveClass(/active/);

    persisted = await getGuide(request, slug, guide._id, voterA.token);
    expect(persisted.score).toBe(1);
    expect(persisted.upvotes).toBe(1);
    expect(persisted.downvotes).toBe(0);
    expect(persisted.userVote).toBe(0);

    await upButton.click();
    await expect(score).toHaveText('2');
    await expect(upButton).toHaveClass(/active/);
    await expect(downButton).not.toHaveClass(/active/);

    persisted = await getGuide(request, slug, guide._id, voterA.token);
    expect(persisted.score).toBe(2);
    expect(persisted.upvotes).toBe(2);
    expect(persisted.downvotes).toBe(0);
    expect(persisted.userVote).toBe(1);
  });

  test('mantém estado consistente sob estresse com votos repetidos do mesmo usuário', async ({ request }) => {
    const slug = uniqueId('votes_stress');
    const author = await registerUser(request, 'author_stress');
    const voter = await registerUser(request, 'voter_stress');
    const guide = await createGuide(request, author.token, slug, 'Guia stress test');

    await Promise.all(
      Array.from({ length: 11 }, () => voteGuide(request, voter.token, slug, guide._id, 1))
    );

    let persisted = await getGuide(request, slug, guide._id, voter.token);
    expect(persisted.score).toBe(1);
    expect(persisted.upvotes).toBe(1);
    expect(persisted.downvotes).toBe(0);
    expect(persisted.userVote).toBe(1);

    await Promise.all(
      Array.from({ length: 9 }, () => voteGuide(request, voter.token, slug, guide._id, 1))
    );

    persisted = await getGuide(request, slug, guide._id, voter.token);
    expect(persisted.score).toBe(0);
    expect(persisted.upvotes).toBe(0);
    expect(persisted.downvotes).toBe(0);
    expect(persisted.userVote).toBe(0);

    await Promise.all(
      Array.from({ length: 7 }, () => voteGuide(request, voter.token, slug, guide._id, -1))
    );

    persisted = await getGuide(request, slug, guide._id, voter.token);
    expect(persisted.score).toBe(-1);
    expect(persisted.upvotes).toBe(0);
    expect(persisted.downvotes).toBe(1);
    expect(persisted.userVote).toBe(-1);
  });
});
