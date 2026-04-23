import { exchangeNpssoForAccessCode, exchangeAccessCodeForAuthTokens, getUserTitles } from "psn-api";

const npsso = "fj4B5mOFDI2YTWJy9Dn42tHKLA0pJazJTqjXKdqFdWkrsW99rT83Ay5wlgDVx7DA";

async function main() {
  // 1. NPSSO → access code
  const accessCode = await exchangeNpssoForAccessCode(npsso);

  // 2. access code → tokens
  const auth = await exchangeAccessCodeForAuthTokens(accessCode);

  // 3. pegar jogos
  const games = await getUserTitles(
    { accessToken: auth.accessToken },
    "me"
  );

  console.log(games);
}

main();