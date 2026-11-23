// Pasta de entrega da casa ("06 Saída"): acha ou cria. Criar é permitido; nunca altera nada que já existe.
import { drive, driveJson } from './google.mjs';

/** Mesma regra de ehPastaSaida() em edicao-logica.js. */
export const ehPastaSaida = (nome) =>
  /^0?6 saida$/.test(String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim());

export async function pastaSaida(casaId) {
  const r = await driveJson('/files', {
    q: `'${casaId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name)',
    pageSize: '200',
    includeItemsFromAllDrives: 'true',
  });
  const achada = (r.files || []).find((f) => ehPastaSaida(f.name));
  if (achada) return achada.id;
  const nova = await (
    await drive('/files', { fields: 'id' }, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '06 Saída', mimeType: 'application/vnd.google-apps.folder', parents: [casaId] }),
    })
  ).json();
  return nova.id;
}
