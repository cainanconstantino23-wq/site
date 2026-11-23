// DELETE ?id= → exclui a tarefa (só o dono; regra no SQL, como o usuário) e apaga os vídeos de aprovação dela no R2.
import { exigir, falha } from '../_lib/acesso.mjs';
import { apagar } from '../_lib/r2.mjs';
import { rpcComoUsuario, sb } from '../_lib/supabase.mjs';
import { json } from '../_lib/http.mjs';

export async function DELETE(request) {
  const { erro } = await exigir(request, 'dono');
  if (erro) return erro;
  const id = Number(new URL(request.url).searchParams.get('id')) || 0;
  try {
    const chaves = ((await sb(`/rest/v1/versoes?tarefa_id=eq.${id}&r2_key=not.is.null&select=r2_key`)) || []).map((v) => v.r2_key);
    const r = await rpcComoUsuario(request, 'excluir_tarefa', { p_tarefa: id });
    if (!r.ok) return json({ erro: 'nao_excluiu', detalhe: r.erro }, 400);
    for (const c of chaves) if (!(await apagar(c).catch(() => false))) console.error('R2: não apagou', c);
    return json({ ok: true });
  } catch (e) {
    return falha(e, 'Falha ao excluir a tarefa:');
  }
}
