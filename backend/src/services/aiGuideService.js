import axios from 'axios';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

function getGeminiModel() {
  const model = process.env.GEMINI_MODEL || process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite';
  return model.replace(/^models\//, '');
}

function getGeminiModels() {
  const configured = getGeminiModel();
  return [...new Set([
    configured,
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash'
  ])];
}

function buildGeminiError(err, model) {
  const status = err.response?.status;
  const message = err.response?.data?.error?.message || err.message;
  const isAuthError = [401, 403].includes(status) || /api key|permission|credential|auth/i.test(message);
  const isQuotaError = status === 429 || /quota|rate limit/i.test(message);
  const error = new Error(
    isAuthError
      ? 'GEMINI_API_KEY inválida, ausente ou sem permissão para usar o Gemini'
      : isQuotaError
        ? `Cota do Gemini esgotada ou indisponível para os modelos testados. Último modelo: ${model}. Verifique billing/cota no Google AI Studio.`
        : `Gemini retornou erro${status ? ` ${status}` : ''}${model ? ` no modelo ${model}` : ''}: ${message}`
  );

  error.statusCode = isAuthError || isQuotaError || status >= 500 ? 503 : 500;
  error.isQuotaError = isQuotaError;
  return error;
}

function compactText(value = '', max = 600) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function extractOutputText(response) {
  const chunks = [];

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.text) chunks.push(part.text);
    }
  }

  return chunks.join('\n').trim();
}

function parseGuideJson(text) {
  const withoutFence = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Resposta da IA sem JSON válido');
  }

  const clean = withoutFence.slice(start, end + 1);
  const data = JSON.parse(clean);

  if (!data?.title?.trim() || !data?.content?.trim()) {
    throw new Error('Resposta da IA sem título ou conteúdo');
  }

  return {
    title: data.title.trim().slice(0, 200),
    content: data.content.trim().slice(0, 50000)
  };
}

export async function generateGuideDraft({ game, achievements = [] }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY não configurada');
    error.statusCode = 503;
    throw error;
  }

  const trophyList = achievements.slice(0, 25).map((achievement, index) => ({
    index: index + 1,
    name: achievement.name,
    description: compactText(achievement.description, 240),
    percent: achievement.percent
  }));

  const gameContext = {
    slug: game.slug,
    name: game.name,
    released: game.released,
    genres: game.genres?.map(g => g.name).filter(Boolean),
    platforms: game.platforms?.map(p => p.platform?.name).filter(Boolean),
    description: compactText(game.description_raw, 1200),
    achievements: trophyList
  };

  const instructions = [
    'Você é um especialista em guias de troféus de PlayStation.',
    'Gere um guia inicial em português do Brasil para ajudar a comunidade a platinar o jogo.',
    'Use somente as informações fornecidas. Se faltar detalhe específico, escreva uma orientação honesta e genérica.',
    'Retorne somente JSON válido no formato {"title":"...","content":"..."}.',
    'No content, use uma introdução e seções no padrão === Nome da conquista === quando houver conquistas.'
  ].join('\n');

  let data;
  let lastError;
  try {
    for (const model of getGeminiModels()) {
      try {
        const response = await axios.post(
          `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            systemInstruction: {
              parts: [{ text: instructions }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: `Contexto do jogo:\n${JSON.stringify(gameContext, null, 2)}` }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 3500,
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  title: { type: 'STRING' },
                  content: { type: 'STRING' }
                },
                required: ['title', 'content']
              }
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        data = response.data;
        break;
      } catch (err) {
        lastError = buildGeminiError(err, model);
        if (!lastError.isQuotaError) throw lastError;
      }
    }
  } catch (err) {
    throw err.statusCode ? err : buildGeminiError(err);
  }

  if (!data) throw lastError;

  return parseGuideJson(extractOutputText(data));
}
