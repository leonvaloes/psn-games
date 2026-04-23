import { test, expect } from '@playwright/test';

// Credenciais únicas por chamada — evita conflito entre workers paralelos
async function registerAndLogin(page) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const user = {
    username: `fav_${id}`,
    email:    `fav_${id}@example.com`,
    password: 'senha123'
  };
  await page.goto('/register');
  await page.getByLabel('Usuário').fill(user.username);
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel(/Senha/).fill(user.password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/', { timeout: 10_000 });
}

async function searchAndWait(page, query) {
  await page.getByPlaceholder('Buscar jogos...').fill(query);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('Buscando jogos...')).not.toBeVisible({ timeout: 15_000 });
}

test.describe('Favoritos e conquistas', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('botão de favorito aparece nos cards quando logado', async ({ page }) => {
    await searchAndWait(page, 'God of War');
    await expect(page.locator('.fav-btn').first()).toBeVisible();
  });

  test('adicionar e remover favorito na home', async ({ page }) => {
    await searchAndWait(page, 'God of War');

    const favBtn = page.locator('.fav-btn').first();
    await expect(favBtn).not.toHaveClass(/active/);

    // Favoritar
    await favBtn.click();
    await expect(favBtn).toHaveClass(/active/);

    // Desfavoritar
    await favBtn.click();
    await expect(favBtn).not.toHaveClass(/active/);
  });

  test('jogo favoritado aparece na página /favorites', async ({ page }) => {
    await searchAndWait(page, 'God of War');
    await page.locator('.fav-btn').first().click();

    // Pega o título do card favoritado
    const title = await page.locator('.card .title').first().textContent();

    await page.goto('/favorites');
    await expect(page.getByText(title.trim())).toBeVisible();
  });

  test('página /favorites exibe mensagem quando sem favoritos', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page.getByText('Você ainda não favoritou nenhum jogo.')).toBeVisible();
  });

  test('botão favoritar na página de detalhe do jogo', async ({ page }) => {
    await searchAndWait(page, 'God of War');
    await page.locator('.card').first().click();
    await expect(page.locator('.fav-btn')).toBeVisible({ timeout: 10_000 });

    await page.locator('.fav-btn').click();
    await expect(page.locator('.fav-btn')).toHaveClass(/active/);
  });

  test('marcar e desmarcar conquista na página de detalhe', async ({ page }) => {
    await searchAndWait(page, 'God of War');
    await page.locator('.card').first().click();

    // Aguarda conquistas carregarem
    const spinner = page.locator('.trophies-section .spinner');
    if (await spinner.isVisible()) {
      await expect(spinner).not.toBeVisible({ timeout: 20_000 });
    }

    const trophies = page.locator('.trophy');
    if (await trophies.count() === 0) {
      test.skip(true, 'Sem conquistas disponíveis para este jogo');
      return;
    }

    const doneBtn = trophies.first().locator('.done-btn');

    // Marcar como feito
    await doneBtn.click();
    await expect(doneBtn).toHaveClass(/active/);
    await expect(trophies.first()).toHaveClass(/done/);

    // Desmarcar
    await doneBtn.click();
    await expect(doneBtn).not.toHaveClass(/active/);
  });

  test('barra de progresso aparece quando há conquistas', async ({ page }) => {
    await searchAndWait(page, 'God of War');
    await page.locator('.card').first().click();

    const spinner = page.locator('.trophies-section .spinner');
    if (await spinner.isVisible()) {
      await expect(spinner).not.toBeVisible({ timeout: 20_000 });
    }

    if (await page.locator('.trophy').count() > 0) {
      await expect(page.locator('.progress-bar')).toBeVisible();
    }
  });
});
