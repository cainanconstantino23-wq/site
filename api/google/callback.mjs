// Volta do Google: guarda o acesso ao Drive (só o servidor lê) e volta para a Edição.
import { emailDoGoogle, trocarCodigo, conexao } from '../_lib/google.mjs';
import { sb } from '../_lib/supabase.mjs';
import { origemDe } from '../_lib/http.mjs';

export async function GET(request) {
  const url = new URL(request.url);
  const origem = origemDe(request);
  const voltar = (estado) => new Response(null, {
    status: 302,
    headers: { Location: `${origem}/edicao.html?drive=${estado}`, 'Set-Cookie': 'daime_google_state=; Path=/api/google; Max-Age=0' },
  });
  const cookie = (request.headers.get('cookie') || '').match(/daime_google_state=([^;]+)/)?.[1];
  if (!cookie || cookie !== url.searchParams.get('state')) return voltar('erro');
  if (url.searchParams.get('error')) return voltar('cancelado');
  try {
    const token = await trocarCodigo(url.searchParams.get('code') || '', origem);
    if (!token.refresh_token) return voltar('erro');
    const anterior = await conexao().catch(() => null);
    await sb('/rest/v1/drive_conexao?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: 1,
        email: await emailDoGoogle(token.access_token),
        refresh_token: token.refresh_token,
        access_token: token.access_token,
        expira_em: new Date(Date.now() + token.expires_in * 1000).toISOString(),
        raiz_id: anterior?.raiz_id ?? null,
        raiz_nome: anterior?.raiz_nome ?? null,
        atualizada_em: new Date().toISOString(),
      }),
    });
    return voltar('ok');
  } catch (erro) {
    console.error('Falha ao conectar o Drive:', erro);
    return voltar('erro');
  }
}
