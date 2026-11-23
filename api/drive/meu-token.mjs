// Token curto (1 h) para o navegador baixar direto do Google.
// Editor: da conta Google dele (só leitura). Dono: do Drive da Daime, que já é dele.
import { exigir, falha } from '../_lib/acesso.mjs';
import { conexao, tokenDoEditor, tokenGoogle } from '../_lib/google.mjs';
import { json } from '../_lib/http.mjs';

export async function GET(request) {
  const { usuario, erro } = await exigir(request);
  if (erro) return erro;
  try {
    if (usuario.papel === 'editor') return json(await tokenDoEditor(usuario.id));
    const token = await tokenGoogle();
    const c = await conexao();
    return json({ token, expira_em: c.expira_em, email: c.email });
  } catch (e) {
    return falha(e, 'Falha ao entregar o token:');
  }
}
