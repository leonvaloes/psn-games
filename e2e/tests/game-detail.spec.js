import { test, expect } from '@playwright/test';

async function searchAndOpenFirst(page, query) {
  await page.goto('/');
  await page.getByPlaceholder('Buscar jogos...').fill(query);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('Buscando jogos...')).not.toBeVisible({ timeout: 15_000 });
  await page.locator('.card').first().click();
  await expect(page).not.toHaveURL('/');
}

test.describe('Página de detalhe do jogo', () => {
  test('navega para a página de detalhe ao clicar no card', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');
    await expect(page.url()).toMatch(/\/game\/.+/);
  });

  test('exibe título do jogo', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');
    await expect(page.locator('.game-title')).toBeVisible({ timeout: 15_000 });
    const title = await page.locator('.game-title').textContent();
    expect(title?.trim().length).toBeGreaterThan(0);
  });

  test('exibe imagem de capa', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');
    await expect(page.locator('.cover')).toBeVisible({ timeout: 15_000 });
  });

  test('exibe seção de conquistas', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');
    await expect(page.locator('.trophies-section')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.trophies-section h2')).toContainText('Conquistas');
  });

  test('conquistas carregam (lista ou mensagem de vazio)', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');

    // Aguarda o spinner de conquistas desaparecer
    const spinner = page.locator('.trophies-section .spinner');
    if (await spinner.isVisible()) {
      await expect(spinner).not.toBeVisible({ timeout: 20_000 });
    }

    const hasTrophies = await page.locator('.trophy').count();
    const hasEmpty = await page.getByText('Nenhuma conquista disponível').count();
    expect(hasTrophies + hasEmpty).toBeGreaterThan(0);
  });

  test('cada conquista exibe nome e percentual', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');
    const spinner = page.locator('.trophies-section .spinner');
    if (await spinner.isVisible()) {
      await expect(spinner).not.toBeVisible({ timeout: 20_000 });
    }

    const trophies = page.locator('.trophy');
    if (await trophies.count() > 0) {
      const first = trophies.first();
      await expect(first.locator('.trophy-name')).toBeVisible();
      await expect(first.locator('.trophy-percent')).toBeVisible();
    }
  });

  test('botão voltar retorna para a home', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');
    await page.locator('.btn-back').click();
    await expect(page).toHaveURL('/');
  });

  test('sidebar exibe metadados do jogo', async ({ page }) => {
    await searchAndOpenFirst(page, 'God of War');
    await expect(page.locator('.game-meta')).toBeVisible({ timeout: 15_000 });
  });
});
