import { test, expect } from '@playwright/test';

const TIMESTAMP = Date.now();
const USER = {
  username: `testuser_${TIMESTAMP}`,
  email:    `test_${TIMESTAMP}@example.com`,
  password: 'senha123'
};

test.describe('Autenticação', () => {
  test('exibe botões Entrar e Criar conta na navbar quando deslogado', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar conta' })).toBeVisible();
  });

  test('fluxo completo de registro', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();

    await page.getByLabel('Usuário').fill(USER.username);
    await page.getByLabel('E-mail').fill(USER.email);
    await page.getByLabel(/Senha/).fill(USER.password);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    // Redireciona para home e exibe o username na navbar
    await expect(page).toHaveURL('/');
    await expect(page.getByText(USER.username)).toBeVisible();
  });

  test('exibe erro ao registrar com email duplicado', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Usuário').fill(`outro_${TIMESTAMP}`);
    await page.getByLabel('E-mail').fill(USER.email); // mesmo email
    await page.getByLabel(/Senha/).fill(USER.password);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.locator('.error-msg')).toBeVisible();
  });

  test('fluxo de login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(USER.email);
    await page.getByLabel('Senha').fill(USER.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText(USER.username)).toBeVisible();
  });

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(USER.email);
    await page.getByLabel('Senha').fill('senha_errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('.error-msg')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('logout limpa sessão e volta para home', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(USER.email);
    await page.getByLabel('Senha').fill(USER.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('/');

    // Logout
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByText(USER.username)).not.toBeVisible();
  });

  test('rota /favorites redireciona para /login quando deslogado', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL('/login');
  });
});
