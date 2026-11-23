// Situação da conexão com o Drive (qualquer usuário do espaço).
import { exigir } from '../_lib/acesso.mjs';
import { appGoogle, conexao } from '../_lib/google.mjs';
import { json } from '../_lib/http.mjs';

export async function GET(request) {
  const { usuario, erro } = await exigir(request);
  if (erro) return erro;
  const c = await conexao().catch(() => null);
  return json({
    papel: usuario.papel,
    nome: usuario.nome,
    configurado: Boolean(appGoogle()),
    conectado: Boolean(c),
    email: usuario.papel === 'dono' ? c?.email ?? null : null,
    raiz: c?.raiz_id ? { id: c.raiz_id, nome: c.raiz_nome } : null,
  });
}
