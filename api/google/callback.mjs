// Volta do Google. Dono: guarda o acesso ao Drive da Daime (drive_conexao).
// Editor: guarda o acesso só leitura da conta dele (drive_editor). Só o servidor lê os dois.
import { emailDoGoogle, trocarCodigo, conexao } from '../_lib/google.mjs';
import { sb } from '../_lib/supabase.mjs';
import { lerCookieEstado } from '../_lib/assinatura.mjs';
import { origemDe } from '../_lib/http.mjs';

export async function GET(request) {
  const url = new URL(request.url);
  const origem = origemDe(request);
  const voltar = (chave, estado) => new Response(null, {
    status: 302,
    headers: { Location: `${origem}/edicao.html?${chave}=${estado}`, 'Set-Cookie': 'daime_google_state=; Path=/api/google; Max-Age=0' },
  });
  const cookie = (request.headers.get('cookie') || '').match(/daime_google_state=([^;]+)/)?.[1] || '';
  const ponto = cookie.indexOf('.');
  const state = url.searchParams.get('state') || '';
  // o papel vem do cookie assinado no login: nunca de uma consulta que possa falhar
  const quem = ponto > 0 && cookie.slice(0, ponto) === state ? lerCookieEstado(cookie.slice(ponto + 1), state) : null;
  if (!quem) return voltar('drive', 'erro');
  const { userId } = quem, editor = quem.papel === 'editor';
  const chave = editor ? 'google' : 'drive';
  if (url.searchParams.get('error')) return voltar(chave, 'cancelado');
  try {
    const token = await trocarCodigo(url.searchParams.get('code') || '', origem);
    if (!token.refresh_token) return voltar(chave, 'erro');
    const email = await emailDoGoogle(token.access_token);
    const expira_em = new Date(Date.now() + token.expires_in * 1000).toISOString();
    if (editor) {
      await sb('/rest/v1/drive_editor?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: userId, email, refresh_token: token.refresh_token, access_token: token.access_token, expira_em, atualizada_em: new Date().toISOString() }),
      });
      return voltar('google', 'ok');
    }
    const anterior = await conexao().catch(() => null);
    await sb('/rest/v1/drive_conexao?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: 1,
        email,
        refresh_token: token.refresh_token,
        access_token: token.access_token,
        expira_em,
        raiz_id: anterior?.raiz_id ?? null,
        raiz_nome: anterior?.raiz_nome ?? null,
        atualizada_em: new Date().toISOString(),
      }),
    });
    return voltar('drive', 'ok');
  } catch (erro) {
    console.error('Falha ao conectar o Google:', erro);
    return voltar(chave, 'erro');
  }
}
