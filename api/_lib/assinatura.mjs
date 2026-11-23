// Link assinado para o player de vídeo (o <video> não manda o login): "validade.assinatura", HMAC-SHA256.
import { createHmac, timingSafeEqual } from 'node:crypto';

const segredo = () => {
  const s = process.env.ASSINATURA_SECRET;
  if (!s) throw new Error('ASSINATURA_SECRET não configurado');
  return s;
};
const hmac = (id, exp) => createHmac('sha256', segredo()).update(`${id}.${exp}`).digest('base64url');

/** Assinatura que vale `segundos` para o arquivo `id`. */
export function assinar(id, segundos = 6 * 3600, agora = Date.now()) {
  const exp = Math.floor(agora / 1000) + segundos;
  return `${exp}.${hmac(id, exp)}`;
}

export function conferirAssinatura(id, t, agora = Date.now()) {
  if (typeof t !== 'string' || !/^\d+\.[A-Za-z0-9_-]+$/.test(t)) return false;
  const [exp, sig] = t.split('.');
  if (Number(exp) * 1000 < agora) return false;
  const esperado = Buffer.from(hmac(id, exp));
  const recebido = Buffer.from(sig);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

/** Cookie do login Google: liga o `state` ao usuário e ao papel dele, assinado, vale 10 minutos. */
export function cookieEstado(state, userId, papel, agora = Date.now()) {
  return `${userId}~${papel}~${assinar(`${state}|${userId}|${papel}`, 600, agora)}`;
}

/** { userId, papel } se o cookie bate com o `state` e ainda vale; senão null. */
export function lerCookieEstado(valor, state, agora = Date.now()) {
  const partes = typeof valor === 'string' ? valor.split('~') : [];
  if (partes.length !== 3 || !partes[0] || typeof state !== 'string' || !state) return null;
  const [userId, papel, t] = partes;
  if (papel !== 'dono' && papel !== 'editor') return null;
  return conferirAssinatura(`${state}|${userId}|${papel}`, t, agora) ? { userId, papel } : null;
}
