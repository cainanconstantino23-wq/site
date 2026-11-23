// Envio de um vídeo de aprovação para o R2: devolve um link de PUT assinado (1 h) e a chave.
// POST { tarefa, nome, tipo, tamanho } → { url, chave }. O navegador manda o arquivo direto para o R2.
import { exigir, falha } from '../_lib/acesso.mjs';
import { assinarUrl, chaveNova, r2Configurado } from '../_lib/r2.mjs';
import { sb } from '../_lib/supabase.mjs';
import { json, lerJson } from '../_lib/http.mjs';

const MAXIMO = 5 * 1024 ** 3; // envio único do R2

export async function POST(request) {
  const { erro } = await exigir(request);
  if (erro) return erro;
  if (!r2Configurado()) return json({ erro: 'r2_nao_configurado' }, 503);
  const { tarefa: tarefaId, nome, tipo, tamanho } = await lerJson(request);
  if (typeof tipo !== 'string' || !tipo.startsWith('video/')) return json({ erro: 'nao_e_video' }, 400);
  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > MAXIMO) return json({ erro: 'tamanho_invalido' }, 400);
  try {
    const tarefa = (await sb(`/rest/v1/tarefas?id=eq.${Number(tarefaId) || 0}&select=id,status`))?.[0];
    if (!tarefa) return json({ erro: 'tarefa_nao_encontrada' }, 404);
    if (tarefa.status === 'aprovado') return json({ erro: 'ja_aprovada' }, 409);
    const chave = chaveNova(tarefa.id, nome);
    return json({ url: assinarUrl({ metodo: 'PUT', chave, segundos: 3600 }), chave });
  } catch (e) {
    return falha(e, 'Falha ao preparar o envio para o R2:');
  }
}
