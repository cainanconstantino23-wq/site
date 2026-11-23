// "Subir casa": acha ou cria uma subpasta pelo nome (só criar; nunca renomeia nem mexe no que existe).
// POST { pai, nome } (dono) → { id, nome, criada }
import { exigir, falha } from '../_lib/acesso.mjs';
import { drive, driveJson, naRaiz } from '../_lib/google.mjs';
import { DRIVE_ID, json, lerJson } from '../_lib/http.mjs';

const PASTA = 'application/vnd.google-apps.folder';

export async function POST(request) {
  const { erro } = await exigir(request, 'dono');
  if (erro) return erro;
  const { pai, nome } = await lerJson(request);
  const limpo = typeof nome === 'string' ? nome.trim() : '';
  if (typeof pai !== 'string' || !DRIVE_ID.test(pai)) return json({ erro: 'pasta_invalida' }, 400);
  if (!limpo || limpo.length > 250 || limpo.includes('/') || limpo.startsWith('.')) return json({ erro: 'nome_invalido' }, 400);
  try {
    if (!(await naRaiz(pai))) return json({ erro: 'fora_da_raiz' }, 403);
    const q = `'${pai}' in parents and mimeType = '${PASTA}' and trashed = false and name = '${limpo.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    const achadas = await driveJson('/files', { q, fields: 'files(id,name)', pageSize: '10', includeItemsFromAllDrives: 'true' });
    if (achadas.files?.length) return json({ id: achadas.files[0].id, nome: achadas.files[0].name, criada: false });
    const nova = await (await drive('/files', { fields: 'id,name' }, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: limpo, mimeType: PASTA, parents: [pai] }),
    })).json();
    return json({ id: nova.id, nome: nova.name, criada: true });
  } catch (e) {
    return falha(e, 'Falha ao criar a pasta:');
  }
}
