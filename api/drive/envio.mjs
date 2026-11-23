// Envio de arquivo para o Drive: cria a sessão "resumable" do Google e devolve o endereço.
// O navegador manda o arquivo em partes direto para o Google (não passa por aqui).
// POST { pasta | casa, nome, tipo, tamanho }  — `casa` = envia para a "06 Saída" da casa.
import { exigir, falha } from '../_lib/acesso.mjs';
import { naRaiz, tokenGoogle } from '../_lib/google.mjs';
import { pastaSaida } from '../_lib/saida.mjs';
import { DRIVE_ID, json, lerJson, origemDoNavegador } from '../_lib/http.mjs';

export async function POST(request) {
  const { erro } = await exigir(request);
  if (erro) return erro;
  const { pasta, casa, nome, tipo, tamanho } = await lerJson(request);
  const alvoPedido = casa || pasta;
  if (typeof alvoPedido !== 'string' || !DRIVE_ID.test(alvoPedido)) return json({ erro: 'pasta_invalida' }, 400);
  if (typeof nome !== 'string' || !nome.trim() || nome.length > 300) return json({ erro: 'nome_invalido' }, 400);
  if (!Number.isFinite(tamanho) || tamanho <= 0) return json({ erro: 'tamanho_invalido' }, 400);
  try {
    if (!(await naRaiz(alvoPedido))) return json({ erro: 'fora_da_raiz' }, 403);
    const destino = casa ? await pastaSaida(casa) : pasta;
    const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,size,mimeType', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await tokenGoogle()}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': typeof tipo === 'string' && tipo ? tipo : 'application/octet-stream',
        'X-Upload-Content-Length': String(tamanho),
        // a sessão aceita o envio vindo do navegador nesta origem
        Origin: origemDoNavegador(request),
      },
      body: JSON.stringify({ name: nome.trim(), parents: [destino] }),
    });
    const url = r.headers.get('location');
    if (!r.ok || !url) throw new Error(`sessão de envio ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return json({ url, pasta: destino });
  } catch (e) {
    return falha(e, 'Falha ao preparar o envio:');
  }
}
