// Link de revisão do cliente (sem login). O token é o acesso: só vale até expira_em.
// GET ?t=<token> → { titulo, expira_em, versoes: [{ numero, nome, video | removido }], comentarios (só os do cliente) }
// POST { t, nome, versao, tempo, texto } → comentário do cliente. Chega para o dono como rascunho;
//   ele decide se manda para o editor no "Pedir ajustes".
import { assinar } from './_lib/assinatura.mjs';
import { json, lerJson } from './_lib/http.mjs';
import { assinarUrl } from './_lib/r2.mjs';
import { sb } from './_lib/supabase.mjs';

const TOKEN = /^[0-9a-f]{64}$/;

async function linkValido(token) {
  if (typeof token !== 'string' || !TOKEN.test(token)) return null;
  const link = (await sb(`/rest/v1/links_revisao?token=eq.${token}&select=tarefa_id,expira_em`))?.[0];
  return link && new Date(link.expira_em) > new Date() ? link : null;
}

export async function GET(request) {
  try {
    const link = await linkValido(new URL(request.url).searchParams.get('t'));
    if (!link) return json({ erro: 'link_invalido' }, 404);
    const id = link.tarefa_id;
    const [tarefa] = await sb(`/rest/v1/tarefas?id=eq.${id}&select=casa_nome,tipo,status`);
    const versoes = await sb(`/rest/v1/versoes?tarefa_id=eq.${id}&select=numero,nome,drive_file_id,r2_key,video_removido_em&order=numero`);
    const comentarios = await sb(`/rest/v1/comentarios?tarefa_id=eq.${id}&convidado=eq.true&select=id,versao,tempo_seg,texto,autor,criado_em&order=criado_em`);
    return json({
      titulo: tarefa ? `${tarefa.casa_nome} · ${tarefa.tipo}` : 'Vídeo', aprovado: tarefa?.status === 'aprovado', expira_em: link.expira_em, comentarios,
      versoes: versoes.map((v) => ({
        numero: v.numero, nome: v.nome,
        ...(v.video_removido_em ? { removido: v.video_removido_em }
          : v.r2_key ? { video: assinarUrl({ metodo: 'GET', chave: v.r2_key, segundos: 21600 }) }
          : { video: `/api/drive/video?id=${v.drive_file_id}&t=${assinar(v.drive_file_id)}` }),
      })),
    });
  } catch (e) {
    console.error('revisao GET', e);
    return json({ erro: 'falha' }, 500);
  }
}

export async function POST(request) {
  try {
    const { t, nome, versao, tempo, texto } = await lerJson(request);
    const link = await linkValido(t);
    if (!link) return json({ erro: 'link_invalido' }, 404);
    const quem = typeof nome === 'string' ? nome.trim().slice(0, 60) : '';
    const msg = typeof texto === 'string' ? texto.trim().slice(0, 2000) : '';
    if (!quem || !msg) return json({ erro: 'faltou_nome_ou_texto' }, 400);
    const existe = await sb(`/rest/v1/versoes?tarefa_id=eq.${link.tarefa_id}&numero=eq.${Number(versao) || 0}&select=numero`);
    if (!existe.length) return json({ erro: 'versao_invalida' }, 400);
    const seg = Number(tempo);
    const [novo] = await sb('/rest/v1/comentarios', {
      method: 'POST',
      body: JSON.stringify({
        tarefa_id: link.tarefa_id, versao: Number(versao), tempo_seg: Number.isFinite(seg) && seg >= 0 ? Math.round(seg * 10) / 10 : null,
        texto: msg, autor: `${quem} (cliente)`, enviado: false, convidado: true,
      }),
    });
    return json({ comentario: { id: novo.id, versao: novo.versao, tempo_seg: novo.tempo_seg, texto: novo.texto, autor: novo.autor, criado_em: novo.criado_em } });
  } catch (e) {
    console.error('revisao POST', e);
    return json({ erro: 'falha' }, 500);
  }
}
