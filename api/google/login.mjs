// Conectar o Google: /api/google/login?token=<sessão do painel> → tela do Google.
// Dono: conecta o Drive da Daime (escopo completo). Editor: conecta a própria conta, só leitura (para baixar).
import { randomBytes } from 'node:crypto';
import { appGoogle, escoposDe, urlLogin } from '../_lib/google.mjs';
import { usuarioDaRequisicao } from '../_lib/supabase.mjs';
import { cookieEstado } from '../_lib/assinatura.mjs';
import { origemDe } from '../_lib/http.mjs';

export async function GET(request) {
  const url = new URL(request.url);
  const origem = origemDe(request);
  const falso = new Request(request.url, { headers: { authorization: `Bearer ${url.searchParams.get('token') || ''}` } });
  const usuario = await usuarioDaRequisicao(falso).catch(() => null);
  if (!usuario) return Response.redirect(`${origem}/edicao.html?drive=sem_permissao`, 302);
  const volta = usuario.papel === 'editor' ? 'google' : 'drive';
  if (!appGoogle()) return Response.redirect(`${origem}/edicao.html?${volta}=nao_configurado`, 302);
  const state = randomBytes(24).toString('base64url');
  const seguro = origem.startsWith('https') ? '; Secure' : '';
  return new Response(null, {
    status: 302,
    headers: {
      Location: urlLogin(origem, state, escoposDe(usuario.papel)),
      'Set-Cookie': `daime_google_state=${state}.${cookieEstado(state, usuario.id)}; Path=/api/google; HttpOnly; SameSite=Lax; Max-Age=600${seguro}`,
    },
  });
}
