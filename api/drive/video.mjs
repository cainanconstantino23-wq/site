// Player: repassa o vídeo do Drive em partes (Range, até 4 MB por resposta). Link assinado (?id&t).
import { conferirAssinatura } from '../_lib/assinatura.mjs';
import { tokenGoogle } from '../_lib/google.mjs';
import { DRIVE_ID } from '../_lib/http.mjs';

const PARTE = 4 * 1024 * 1024;

export async function GET(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!DRIVE_ID.test(id) || !conferirAssinatura(id, url.searchParams.get('t'))) return new Response(null, { status: 403 });
  const pedido = /bytes=(\d+)-(\d*)/.exec(request.headers.get('range') || '');
  const inicio = pedido ? Number(pedido[1]) : 0;
  const fim = pedido && pedido[2] ? Math.min(Number(pedido[2]), inicio + PARTE - 1) : inicio + PARTE - 1;
  try {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${await tokenGoogle()}`, Range: `bytes=${inicio}-${fim}` },
    });
    if (!r.ok || !r.body) return new Response(null, { status: r.status === 416 ? 416 : 502 });
    const headers = new Headers({ 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=600' });
    for (const nome of ['content-type', 'content-length', 'content-range']) {
      const v = r.headers.get(nome);
      if (v) headers.set(nome, v);
    }
    return new Response(r.body, { status: r.status, headers });
  } catch (e) {
    console.error('Falha no vídeo:', e);
    return new Response(null, { status: 502 });
  }
}
