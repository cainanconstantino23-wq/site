// Dono conecta o Google Drive da Daime: /api/google/login?token=<sessão do painel> → tela do Google.
import { randomBytes } from 'node:crypto';
import { appGoogle, urlLogin } from '../_lib/google.mjs';
import { usuarioDaRequisicao } from '../_lib/supabase.mjs';
import { origemDe } from '../_lib/http.mjs';

export async function GET(request) {
  const url = new URL(request.url);
  const origem = origemDe(request);
  const falso = new Request(request.url, { headers: { authorization: `Bearer ${url.searchParams.get('token') || ''}` } });
  const usuario = await usuarioDaRequisicao(falso).catch(() => null);
  if (!usuario || usuario.papel !== 'dono') return Response.redirect(`${origem}/edicao.html?drive=sem_permissao`, 302);
  if (!appGoogle()) return Response.redirect(`${origem}/edicao.html?drive=nao_configurado`, 302);
  const state = randomBytes(24).toString('base64url');
  const seguro = origem.startsWith('https') ? '; Secure' : '';
  return new Response(null, {
    status: 302,
    headers: { Location: urlLogin(origem, state), 'Set-Cookie': `daime_google_state=${state}; Path=/api/google; HttpOnly; SameSite=Lax; Max-Age=600${seguro}` },
  });
}
