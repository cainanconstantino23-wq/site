// Versões de uma tarefa.
// GET ?tarefa=<id>  → links assinados do player para cada versão.
// POST { tarefa, arquivo, nota } → registra o vídeo (já no Drive, dentro da casa) como nova versão para revisar.
import { exigir, falha } from '../_lib/acesso.mjs';
import { assinar } from '../_lib/assinatura.mjs';
import { driveJson, paisDe } from '../_lib/google.mjs';
import { dentroDaRaiz } from '../_lib/raiz.mjs';
import { sb } from '../_lib/supabase.mjs';
import { DRIVE_ID, json, lerJson } from '../_lib/http.mjs';

const tarefaDe = async (id) => (await sb(`/rest/v1/tarefas?id=eq.${Number(id) || 0}&select=*`))?.[0] || null;

export async function GET(request) {
  const { erro } = await exigir(request);
  if (erro) return erro;
  const tarefa = Number(new URL(request.url).searchParams.get('tarefa')) || 0;
  const versoes = await sb(`/rest/v1/versoes?tarefa_id=eq.${tarefa}&select=numero,drive_file_id&order=numero`);
  return json({ versoes: versoes.map((v) => ({ numero: v.numero, video: `/api/drive/video?id=${v.drive_file_id}&t=${assinar(v.drive_file_id)}` })) });
}

export async function POST(request) {
  const { usuario, erro } = await exigir(request);
  if (erro) return erro;
  const { tarefa: tarefaId, arquivo, nota } = await lerJson(request);
  if (typeof arquivo !== 'string' || !DRIVE_ID.test(arquivo)) return json({ erro: 'arquivo_invalido' }, 400);
  try {
    const tarefa = await tarefaDe(tarefaId);
    if (!tarefa) return json({ erro: 'tarefa_nao_encontrada' }, 404);
    if (tarefa.status === 'aprovado') return json({ erro: 'ja_aprovada' }, 409);
    if (!(await dentroDaRaiz(arquivo, tarefa.casa_pasta_id, paisDe))) return json({ erro: 'fora_da_casa' }, 403);
    const meta = await driveJson(`/files/${arquivo}`, { fields: 'id,name,size,mimeType,trashed' });
    if (meta.trashed || !meta.mimeType?.startsWith('video/')) return json({ erro: 'nao_e_video' }, 400);
    const ultimas = await sb(`/rest/v1/versoes?tarefa_id=eq.${tarefa.id}&select=numero&order=numero.desc&limit=1`);
    const numero = (ultimas?.[0]?.numero || 0) + 1;
    await sb('/rest/v1/versoes', {
      method: 'POST',
      body: JSON.stringify({ tarefa_id: tarefa.id, numero, drive_file_id: meta.id, nome: meta.name, tamanho: meta.size ? Number(meta.size) : null, nota: typeof nota === 'string' ? nota.slice(0, 2000) : '', enviada_por: usuario.nome }),
    });
    await sb(`/rest/v1/tarefas?id=eq.${tarefa.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'para_revisar' }) });
    await sb('/rest/v1/eventos', {
      method: 'POST',
      body: JSON.stringify({ tarefa_id: tarefa.id, tipo: 'versao', versao: numero, autor: usuario.nome, texto: typeof nota === 'string' ? nota.slice(0, 2000) : '' }),
    });
    return json({ numero });
  } catch (e) {
    return falha(e, 'Falha ao registrar a versão:');
  }
}
