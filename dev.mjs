// Servidor local: arquivos do site + funções de api/ (como na Vercel). Uso: node dev.mjs  → http://localhost:3005
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';

const raiz = new URL('.', import.meta.url).pathname;
if (existsSync(join(raiz, '.env.local'))) {
  for (const linha of readFileSync(join(raiz, '.env.local'), 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const porta = Number(process.env.PORT) || 3005;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.json': 'application/json', '.ttf': 'font/ttf' };

async function funcao(caminho) {
  for (const arquivo of [`${caminho}.mjs`, join(caminho, 'index.mjs')]) {
    const completo = join(raiz, arquivo);
    if (existsSync(completo)) return import(completo + `?v=${(await stat(completo)).mtimeMs}`);
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${porta}`);
  try {
    if (url.pathname.startsWith('/api/') && !url.pathname.includes('/_lib')) {
      const mod = await funcao(normalize(url.pathname).slice(1));
      const handler = mod?.[req.method];
      if (!handler) { res.writeHead(404).end(); return; }
      const corpo = ['GET', 'HEAD'].includes(req.method) ? undefined : Readable.toWeb(req);
      const resposta = await handler(new Request(url, { method: req.method, headers: req.headers, body: corpo, duplex: 'half' }));
      const cab = {};
      resposta.headers.forEach((v, k) => { cab[k] = k === 'set-cookie' ? resposta.headers.getSetCookie() : v; });
      res.writeHead(resposta.status, cab);
      if (resposta.body) Readable.fromWeb(resposta.body).pipe(res); else res.end();
      return;
    }
    let arquivo = normalize(decodeURIComponent(url.pathname));
    if (arquivo.endsWith('/')) arquivo += 'index.html';
    const completo = join(raiz, arquivo);
    if (!completo.startsWith(raiz)) { res.writeHead(403).end(); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[extname(completo)] || 'application/octet-stream' }).end(await readFile(completo));
  } catch (e) {
    if (e.code === 'ENOENT') { res.writeHead(404).end('não encontrado'); return; }
    console.error(e);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(porta, () => console.log(`Site + api em http://localhost:${porta}`));
