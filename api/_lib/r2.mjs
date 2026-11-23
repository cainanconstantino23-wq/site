// Cloudflare R2 (API compatível com S3): links assinados (SigV4) sem dependências.
// Vídeos de aprovação da Edição. Bucket privado: o navegador só recebe links temporários.
import { createHash, createHmac } from 'node:crypto';

const sha256 = (t) => createHash('sha256').update(t).digest('hex');
const hmac = (chave, t) => createHmac('sha256', chave).update(t).digest();
// codificação do S3 (RFC 3986: tudo menos letras, números e - _ . ~)
const cod = (t) => encodeURIComponent(t).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

/** Link assinado (query string), cabeçalho assinado só "host", corpo UNSIGNED-PAYLOAD. */
export function presign({ metodo, host, caminho, regiao, servico, acesso, segredo, agora = new Date(), segundos }) {
  const amzDate = agora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dia = amzDate.slice(0, 8);
  const escopo = `${dia}/${regiao}/${servico}/aws4_request`;
  const params = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${acesso}/${escopo}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(segundos),
    'X-Amz-SignedHeaders': 'host',
  };
  const query = Object.keys(params).sort().map((k) => `${cod(k)}=${cod(params[k])}`).join('&');
  const canonica = [metodo, caminho, query, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const paraAssinar = ['AWS4-HMAC-SHA256', amzDate, escopo, sha256(canonica)].join('\n');
  const kAssinatura = hmac(hmac(hmac(hmac('AWS4' + segredo, dia), regiao), servico), 'aws4_request');
  return `https://${host}${caminho}?${query}&X-Amz-Signature=${createHmac('sha256', kAssinatura).update(paraAssinar).digest('hex')}`;
}

const env = () => ({
  conta: process.env.R2_ACCOUNT_ID, acesso: process.env.R2_ACCESS_KEY_ID,
  segredo: process.env.R2_SECRET_ACCESS_KEY, bucket: process.env.R2_BUCKET,
});
export const r2Configurado = () => Object.values(env()).every(Boolean);

/** Link assinado para um objeto do bucket (GET para tocar, PUT para enviar, HEAD/DELETE pelo servidor). */
export function assinarUrl({ metodo, chave, segundos, agora }) {
  const { conta, acesso, segredo, bucket } = env();
  const caminho = '/' + [bucket, ...chave.split('/')].map(cod).join('/');
  return presign({ metodo, host: `${conta}.r2.cloudflarestorage.com`, caminho, regiao: 'auto', servico: 's3', acesso, segredo, agora, segundos });
}

/** Tamanho do objeto, ou null se não existe. */
export async function existe(chave) {
  const r = await fetch(assinarUrl({ metodo: 'HEAD', chave, segundos: 300 }), { method: 'HEAD' });
  return r.ok ? Number(r.headers.get('content-length')) || 0 : null;
}

/** Apaga o objeto. Já apagado (404) também conta como apagado. */
export async function apagar(chave) {
  const r = await fetch(assinarUrl({ metodo: 'DELETE', chave, segundos: 300 }), { method: 'DELETE' });
  return r.ok || r.status === 404;
}

/** Chave de um vídeo de aprovação: edicao/<tarefa>/<quando>-<aleatório>.<ext> (o nome original fica só no banco). */
export function chaveNova(tarefaId, nomeArquivo, agora = Date.now(), aleatorio = Math.random().toString(36).slice(2, 10)) {
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(String(nomeArquivo || ''));
  return `edicao/${Number(tarefaId)}/${agora}-${aleatorio}.${m ? m[1].toLowerCase() : 'mp4'}`;
}

/** A chave pertence a esta tarefa (e não é forjada)? */
export function chaveDaTarefa(chave, tarefaId) {
  return typeof chave === 'string' && new RegExp(`^edicao/${Number(tarefaId)}/[0-9]+-[a-z0-9]+\\.[a-z0-9]{1,5}$`).test(chave);
}
