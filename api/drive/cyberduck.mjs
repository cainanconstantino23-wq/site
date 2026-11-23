// "Abrir no Cyberduck": GET ?pasta=<id> → atalho .duck que abre essa pasta no Cyberduck de quem pediu.
// O caminho é montado com a conta Google de quem clicou: dono → "My Drive/…", editor → "Shared with me/…".
import { randomUUID } from 'node:crypto';
import { exigir, falha } from '../_lib/acesso.mjs';
import { conexao, naRaiz, tokenDoEditor, tokenGoogle } from '../_lib/google.mjs';
import { cadeiaDePastas, caminhoCyberduck, duckPlist } from '../_lib/cyberduck.mjs';
import { DRIVE_ID, json } from '../_lib/http.mjs';

export async function GET(request) {
  const { usuario, erro } = await exigir(request);
  if (erro) return erro;
  const pasta = new URL(request.url).searchParams.get('pasta') || '';
  if (!DRIVE_ID.test(pasta)) return json({ erro: 'pasta_invalida' }, 400);
  try {
    if (!(await naRaiz(pasta))) return json({ erro: 'fora_da_raiz' }, 403);
    const { token, email } = usuario.papel === 'editor'
      ? await tokenDoEditor(usuario.id)
      : { token: await tokenGoogle(), email: (await conexao())?.email };
    const get = async (id) => {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,parents&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` } });
      return r.ok ? r.json() : null;
    };
    const raizId = (await get('root'))?.id;
    const cadeia = await cadeiaDePastas(pasta, get, raizId);
    if (!cadeia) return json({ erro: 'sem_acesso_pasta' }, 403);
    const nome = cadeia.nomes.at(-1);
    const corpo = duckPlist({ apelido: `Daime · ${nome}`, email, caminho: caminhoCyberduck(cadeia), uuid: randomUUID() });
    const arquivo = `${nome.replace(/[\\/:*?"<>|]/g, '_')}.duck`;
    return new Response(corpo, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="pasta.duck"; filename*=UTF-8''${encodeURIComponent(arquivo)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return falha(e, 'Falha ao montar o atalho do Cyberduck:');
  }
}
