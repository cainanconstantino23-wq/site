// Navegador de arquivos: GET ?pasta=<id> lista pastas e arquivos (dentro da pasta de trabalho).
// O dono, para escolher a pasta de trabalho, pode listar fora dela com ?livre=1 (pasta=root | compartilhados | id).
// POST { raiz } (dono): define a pasta de trabalho.
import { exigir, falha } from '../_lib/acesso.mjs';
import { conexao, driveJson, naRaiz, paisDe } from '../_lib/google.mjs';
import { sb } from '../_lib/supabase.mjs';
import { DRIVE_ID, json, lerJson } from '../_lib/http.mjs';

const PASTA = 'application/vnd.google-apps.folder';
const ATALHO = 'application/vnd.google-apps.shortcut';
const tipoDe = (mime) => (mime === PASTA ? 'pasta' : mime?.startsWith('video/') ? 'video' : mime?.startsWith('image/') ? 'imagem' : 'arquivo');

function item(f) {
  const alvo = f.mimeType === ATALHO && f.shortcutDetails ? { id: f.shortcutDetails.targetId, mimeType: f.shortcutDetails.targetMimeType } : f;
  const tipo = tipoDe(alvo.mimeType);
  return {
    id: alvo.id,
    nome: f.name,
    tipo,
    mime: alvo.mimeType,
    tamanho: f.size ? Number(f.size) : null,
    modificado: f.modifiedTime || null,
    link: tipo === 'pasta' ? `https://drive.google.com/drive/folders/${alvo.id}` : `https://drive.google.com/file/d/${alvo.id}/view`,
    download: tipo === 'pasta' ? null : `https://drive.usercontent.google.com/download?id=${alvo.id}&export=download`,
  };
}

/** Todos os itens de uma pasta (pastas primeiro, ordem natural). */
export async function listar(q) {
  const itens = [];
  let pageToken = '';
  do {
    const r = await driveJson('/files', {
      q,
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,shortcutDetails)',
      orderBy: 'folder,name_natural',
      pageSize: '1000',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    });
    itens.push(...(r.files || []).map(item));
    pageToken = r.nextPageToken || '';
  } while (pageToken);
  return itens;
}

/** Caminho da raiz até a pasta (nomes para o topo do navegador). */
async function caminho(pastaId, raizId) {
  const passos = [];
  let atual = pastaId;
  for (let i = 0; i < 20 && atual; i++) {
    const f = await driveJson(`/files/${encodeURIComponent(atual)}`, { fields: 'id,name' });
    passos.unshift({ id: f.id, nome: f.name });
    if (atual === raizId) break;
    atual = (await paisDe(atual))[0];
  }
  return passos;
}

export async function GET(request) {
  const { usuario, erro } = await exigir(request);
  if (erro) return erro;
  const url = new URL(request.url);
  const livre = url.searchParams.get('livre') === '1' && usuario.papel === 'dono';
  try {
    const c = await conexao();
    if (!c) return json({ erro: 'drive_desconectado' }, 409);
    let pasta = url.searchParams.get('pasta') || c.raiz_id || '';
    if (livre && (pasta === 'root' || pasta === 'compartilhados')) {
      const q = pasta === 'root' ? "'root' in parents and trashed = false" : 'sharedWithMe = true and trashed = false';
      const itens = (await listar(q)).filter((i) => i.tipo === 'pasta');
      return json({ pasta: { id: pasta, nome: pasta === 'root' ? 'Meu Drive' : 'Compartilhados comigo' }, caminho: [], itens });
    }
    if (!pasta) return json({ erro: 'sem_raiz' }, 409);
    if (!DRIVE_ID.test(pasta)) return json({ erro: 'pasta_invalida' }, 400);
    if (!livre && !(await naRaiz(pasta))) return json({ erro: 'fora_da_raiz' }, 403);
    const meta = await driveJson(`/files/${encodeURIComponent(pasta)}`, { fields: 'id,name,mimeType' });
    if (meta.mimeType !== PASTA) return json({ erro: 'nao_e_pasta' }, 400);
    const itens = await listar(`'${pasta}' in parents and trashed = false`);
    return json({
      pasta: { id: meta.id, nome: meta.name, link: `https://drive.google.com/drive/folders/${meta.id}` },
      caminho: livre ? [{ id: meta.id, nome: meta.name }] : await caminho(pasta, c.raiz_id),
      itens,
    });
  } catch (e) {
    return falha(e, 'Falha ao listar o Drive:');
  }
}

export async function POST(request) {
  const { erro } = await exigir(request, 'dono');
  if (erro) return erro;
  const { raiz } = await lerJson(request);
  if (typeof raiz !== 'string' || !DRIVE_ID.test(raiz)) return json({ erro: 'pasta_invalida' }, 400);
  try {
    const meta = await driveJson(`/files/${encodeURIComponent(raiz)}`, { fields: 'id,name,mimeType' });
    if (meta.mimeType !== PASTA) return json({ erro: 'nao_e_pasta' }, 400);
    await sb('/rest/v1/drive_conexao?id=eq.1', { method: 'PATCH', body: JSON.stringify({ raiz_id: meta.id, raiz_nome: meta.name }) });
    return json({ raiz: { id: meta.id, nome: meta.name } });
  } catch (e) {
    return falha(e, 'Falha ao definir a pasta de trabalho:');
  }
}
