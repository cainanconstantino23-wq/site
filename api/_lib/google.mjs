// Google Drive da Daime Filmes: login OAuth (dono, e editor só leitura), tokens em drive_conexao/drive_editor e chamadas à API.
// Regra: só listar, ler, criar pasta e enviar arquivo novo. Nunca apagar, mover ou renomear.
import { sb } from './supabase.mjs';
import { dentroDaRaiz } from './raiz.mjs';

export const ESCOPOS = ['openid', 'email', 'https://www.googleapis.com/auth/drive'];
// editor: só leitura, para baixar direto do Google no navegador dele
export const ESCOPOS_EDITOR = ['openid', 'email', 'https://www.googleapis.com/auth/drive.readonly'];
export const escoposDe = (papel) => (papel === 'editor' ? ESCOPOS_EDITOR : ESCOPOS);
export const CALLBACK = '/api/google/callback';
const API = 'https://www.googleapis.com/drive/v3';

export class DriveDesconectado extends Error {}
export class GoogleEditorDesconectado extends Error {}

export function appGoogle() {
  const id = process.env.GOOGLE_CLIENT_ID, segredo = process.env.GOOGLE_CLIENT_SECRET;
  return id && segredo ? { id, segredo } : null;
}

export function urlLogin(origem, state, escopos = ESCOPOS) {
  const app = appGoogle();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', app.id);
  url.searchParams.set('redirect_uri', origem + CALLBACK);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', escopos.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

async function pedirToken(corpo) {
  const app = appGoogle();
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: app.id, client_secret: app.segredo, ...corpo }),
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok || !dados.access_token) throw new Error(`Google token: ${dados.error || r.status}`);
  return dados;
}

export const trocarCodigo = (code, origem) => pedirToken({ code, grant_type: 'authorization_code', redirect_uri: origem + CALLBACK });

export async function emailDoGoogle(accessToken) {
  const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
  return r.ok ? (await r.json()).email || null : null;
}

export async function conexao() {
  const linhas = await sb('/rest/v1/drive_conexao?id=eq.1&select=*');
  return linhas?.[0] || null;
}

/** Token de acesso válido (renova quando falta menos de 1 minuto). */
export async function tokenGoogle() {
  const c = await conexao();
  if (!c) throw new DriveDesconectado();
  if (c.access_token && c.expira_em && Date.parse(c.expira_em) - Date.now() > 60_000) return c.access_token;
  let novo;
  try {
    novo = await pedirToken({ refresh_token: c.refresh_token, grant_type: 'refresh_token' });
  } catch {
    throw new DriveDesconectado();
  }
  await sb('/rest/v1/drive_conexao?id=eq.1', {
    method: 'PATCH',
    body: JSON.stringify({ access_token: novo.access_token, expira_em: new Date(Date.now() + novo.expires_in * 1000).toISOString(), atualizada_em: new Date().toISOString() }),
  });
  return novo.access_token;
}

/** Token da conta Google do editor (renova quando falta menos de 5 minutos). */
export async function tokenDoEditor(userId, forcar = false) {
  const linhas = await sb(`/rest/v1/drive_editor?user_id=eq.${encodeURIComponent(userId)}&select=*`);
  const c = linhas?.[0];
  if (!c) throw new GoogleEditorDesconectado();
  if (!forcar && c.access_token && c.expira_em && Date.parse(c.expira_em) - Date.now() > 5 * 60_000) return { token: c.access_token, expira_em: c.expira_em, email: c.email };
  let novo;
  try {
    novo = await pedirToken({ refresh_token: c.refresh_token, grant_type: 'refresh_token' });
  } catch {
    throw new GoogleEditorDesconectado();
  }
  const expira_em = new Date(Date.now() + novo.expires_in * 1000).toISOString();
  await sb(`/rest/v1/drive_editor?user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ access_token: novo.access_token, expira_em, atualizada_em: new Date().toISOString() }),
  });
  return { token: novo.access_token, expira_em, email: c.email };
}

/** Chamada à API do Drive (GET por padrão). Lança DriveDesconectado em 401. */
export async function drive(caminho, params = {}, init = {}) {
  const url = new URL(caminho.startsWith('http') ? caminho : API + caminho);
  for (const [k, v] of Object.entries({ supportsAllDrives: 'true', ...params })) url.searchParams.set(k, v);
  const r = await fetch(url, { ...init, headers: { Authorization: `Bearer ${await tokenGoogle()}`, ...(init.headers || {}) } });
  if (r.status === 401) throw new DriveDesconectado();
  if (!r.ok && !init.semErro) throw new Error(`Drive ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r;
}

export const driveJson = async (caminho, params, init) => (await drive(caminho, params, init)).json();

// pais de cada arquivo, guardados por 10 minutos (subir até a raiz em toda chamada fica rápido)
const cachePais = new Map();
export async function paisDe(id) {
  const guardado = cachePais.get(id);
  if (guardado && guardado.ate > Date.now()) return guardado.pais;
  const r = await drive(`/files/${encodeURIComponent(id)}`, { fields: 'parents' }, { semErro: true });
  const pais = r.ok ? (await r.json()).parents || [] : [];
  cachePais.set(id, { pais, ate: Date.now() + 10 * 60_000 });
  return pais;
}

/** O arquivo/pasta está dentro da pasta de trabalho? */
export async function naRaiz(id) {
  const c = await conexao();
  if (!c) throw new DriveDesconectado();
  return dentroDaRaiz(id, c.raiz_id, paisDe);
}
