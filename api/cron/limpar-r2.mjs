// Todo dia (vercel.json): apaga no R2 os vídeos de aprovação de tarefas aprovadas há mais de 30 dias.
// A versão, a nota e os comentários ficam; o player mostra "vídeo removido em DD/MM".
import { paraRemover } from '../_lib/limpeza.mjs';
import { apagar, r2Configurado } from '../_lib/r2.mjs';
import { sb } from '../_lib/supabase.mjs';
import { json } from '../_lib/http.mjs';

export async function GET(request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get('authorization') !== `Bearer ${segredo}`) return json({ erro: 'sem_permissao' }, 401);
  if (!r2Configurado()) return json({ erro: 'r2_nao_configurado' }, 503);
  try {
    const linhas = await sb('/rest/v1/versoes?r2_key=not.is.null&video_removido_em=is.null&select=id,tarefa_id,r2_key,video_removido_em,tarefas(status)');
    const versoes = (linhas || []).map((v) => ({ ...v, status: v.tarefas?.status }));
    const ids = [...new Set(versoes.map((v) => v.tarefa_id))];
    const eventos = ids.length ? await sb(`/rest/v1/eventos?tipo=eq.aprovada&tarefa_id=in.(${ids.join(',')})&select=tarefa_id,tipo,criado_em`) : [];
    let removidos = 0;
    for (const v of paraRemover(versoes, eventos)) {
      if (!(await apagar(v.r2_key).catch(() => false))) { console.error('R2: não apagou', v.r2_key); continue; }
      await sb(`/rest/v1/versoes?id=eq.${v.id}`, { method: 'PATCH', body: JSON.stringify({ video_removido_em: new Date().toISOString() }) });
      removidos++;
    }
    return json({ removidos });
  } catch (e) {
    console.error('Limpeza do R2 falhou:', e);
    return json({ erro: 'falhou' }, 502);
  }
}
