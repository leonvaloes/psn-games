import { test, expect } from '@playwright/test';

test.describe('Busca de jogos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('exibe título e campo de busca na home', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PSN Games' })).toBeVisible();
    await expect(page.getByPlaceholder('Buscar jogos...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
  });

  test('exibe estado inicial sem resultados', async ({ page }) => {
    await expect(page.getByText('Digite o nome de um jogo para começar')).toBeVisible();
  });

  test('busca e exibe cards de jogos', async ({ page }) => {
    await page.getByPlaceholder('Buscar jogos...').fill('God of War');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Aguarda spinner sumir e cards aparecerem
    await expect(page.getByText('Buscando jogos...')).toBeVisible();
    await expect(page.getByText('Buscando jogos...')).not.toBeVisible({ timeout: 15_000 });

    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(await cards.count());
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('cada card exibe imagem e título', async ({ page }) => {
    await page.getByPlaceholder('Buscar jogos...').fill('God of War');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText('Buscando jogos...')).not.toBeVisible({ timeout: 15_000 });

    const firstCard = page.locator('.card').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    await expect(firstCard.locator('.title')).toBeVisible();
    // Imagem ou placeholder deve estar presente
    const hasImg = await firstCard.locator('img').count();
    const hasPlaceholder = await firstCard.locator('.no-cover').count();
    expect(hasImg + hasPlaceholder).toBeGreaterThan(0);
  });

  test('exibe mensagem quando busca não retorna resultados', async ({ page }) => {
    await page.getByPlaceholder('Buscar jogos...').fill('xyzxyzxyz_jogo_inexistente_99999');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText('Buscando jogos...')).not.toBeVisible({ timeout: 15_000 });

    await expect(page.getByText(/Nenhum jogo encontrado/)).toBeVisible();
  });

  test('botão limpar apaga a query', async ({ page }) => {
    const input = page.getByPlaceholder('Buscar jogos...');
    await input.fill('God of War');
    await page.locator('.clear').click();
    await expect(input).toHaveValue('');
  });

  test('exibe contador de resultados', async ({ page }) => {
    await page.getByPlaceholder('Buscar jogos...').fill('FIFA');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText('Buscando jogos...')).not.toBeVisible({ timeout: 15_000 });

    await expect(page.locator('.results-count')).toBeVisible();
    await expect(page.locator('.results-count')).toContainText('FIFA');
  });
});
