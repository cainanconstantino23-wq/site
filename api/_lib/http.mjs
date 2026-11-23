// Respostas das funções.
export const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } });

export const lerJson = async (request) => {
  try { return await request.json(); } catch { return {}; }
};

/** IDs do Google Drive: letras, números, - e _. */
export const DRIVE_ID = /^[A-Za-z0-9_-]{10,200}$/;

/** Origem do site (para os endereços de retorno do Google). */
export const origemDe = (request) => process.env.SITE_URL || new URL(request.url).origin;

/** Endereço de onde o navegador está chamando (ex.: https://www.daimefilmes.com.br).
 *  Para a sessão de envio do Google: ela só libera a resposta para essa origem exata. */
export const origemDoNavegador = (request) => new URL(request.url).origin;
