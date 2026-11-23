// Limpeza dos vídeos de aprovação no R2: somem 30 dias depois da aprovação (a mais recente) da tarefa.
export const DIAS = 30;

/** Versões cujo vídeo no R2 deve ser apagado agora. versoes: [{ id, tarefa_id, r2_key, video_removido_em, status }]. */
export function paraRemover(versoes, eventos, agora = Date.now()) {
  const aprovadaEm = {};
  for (const e of eventos || []) {
    if (e.tipo !== 'aprovada') continue;
    const t = Date.parse(e.criado_em);
    if (!(aprovadaEm[e.tarefa_id] >= t)) aprovadaEm[e.tarefa_id] = t;
  }
  const limite = agora - DIAS * 86400000;
  return (versoes || []).filter((v) => v.r2_key && !v.video_removido_em && v.status === 'aprovado'
    && aprovadaEm[v.tarefa_id] !== undefined && aprovadaEm[v.tarefa_id] < limite);
}
