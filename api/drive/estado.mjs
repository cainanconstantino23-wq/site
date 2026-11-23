// Situação da conexão com o Drive (qualquer usuário do espaço).
import { exigir } from '../_lib/acesso.mjs';
import { appGoogle, conexao } from '../_lib/google.mjs';
import { json } from '../_lib/http.mjs';
import { sb } from '../_lib/supabase.mjs';

export async function GET(request) {
  const { usuario, erro } = await exigir(request);
  if (erro) return erro;
  const c = await conexao().catch(() => null);
  const ge = usuario.papel === 'editor'
    ? (await sb(`/rest/v1/drive_editor?user_id=eq.${encodeURIComponent(usuario.id)}&select=email`).catch(() => []))?.[0] || null
    : null;
  return json({
    papel: usuario.papel,
    nome: usuario.nome,
    configurado: Boolean(appGoogle()),
    conectado: Boolean(c),
    email: usuario.papel === 'dono' ? c?.email ?? null : null,
    google_editor: ge ? { email: ge.email } : null,
    raiz: c?.raiz_id ? { id: c.raiz_id, nome: c.raiz_nome } : null,
  });
}
