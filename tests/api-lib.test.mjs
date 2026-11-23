import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.ASSINATURA_SECRET = 'segredo-de-teste-123';
const { assinar, conferirAssinatura } = await import('../api/_lib/assinatura.mjs');
const { dentroDaRaiz } = await import('../api/_lib/raiz.mjs');

test('assinatura válida para o mesmo arquivo', () => {
  const t = assinar('arquivoABC123456', 60, 1_000_000);
  assert.equal(conferirAssinatura('arquivoABC123456', t, 1_000_000 + 30_000), true);
});

test('assinatura expira, não vale para outro arquivo e não aceita adulteração', () => {
  const t = assinar('arquivoABC123456', 60, 1_000_000);
  assert.equal(conferirAssinatura('arquivoABC123456', t, 1_000_000 + 61_000), false);
  assert.equal(conferirAssinatura('outroArquivo9999', t, 1_000_000), false);
  const [exp, sig] = t.split('.');
  assert.equal(conferirAssinatura('arquivoABC123456', `${Number(exp) + 999}.${sig}`, 1_000_000), false);
  assert.equal(conferirAssinatura('arquivoABC123456', 'lixo', 1_000_000), false);
  assert.equal(conferirAssinatura('arquivoABC123456', undefined, 1_000_000), false);
});

const arvore = { raiz: [], casa: ['raiz'], brutas: ['casa'], video: ['brutas'], fora: ['outra'], outra: [], ciclo1: ['ciclo2'], ciclo2: ['ciclo1'] };
const parents = async (id) => arvore[id] ?? [];

test('dentroDaRaiz: a própria raiz, filho, neto e bisneto', async () => {
  assert.equal(await dentroDaRaiz('raiz', 'raiz', parents), true);
  assert.equal(await dentroDaRaiz('casa', 'raiz', parents), true);
  assert.equal(await dentroDaRaiz('video', 'raiz', parents), true);
});

test('dentroDaRaiz: fora da raiz, ciclo e raiz vazia', async () => {
  assert.equal(await dentroDaRaiz('fora', 'raiz', parents), false);
  assert.equal(await dentroDaRaiz('ciclo1', 'raiz', parents), false);
  assert.equal(await dentroDaRaiz('casa', '', parents), false);
});

const { ehPastaSaida } = await import('../api/_lib/saida.mjs');
test('ehPastaSaida do servidor segue a mesma regra da página', () => {
  for (const nome of ['06 Saída', '06 Saida', '06 SAÍDA', '6 saida']) assert.equal(ehPastaSaida(nome), true, nome);
  for (const nome of ['05 Projetos', 'Saída antiga', '06 Saídas velhas']) assert.equal(ehPastaSaida(nome), false, nome);
});
