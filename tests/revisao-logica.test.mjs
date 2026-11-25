import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../edicao-logica.js', import.meta.url), 'utf8'), ctx);
const { arvoreComentarios, filtrarComentarios, marcasLinha, validadeLink } = ctx;
const plain = (x) => JSON.parse(JSON.stringify(x));

const C = (id, extra = {}) => ({ id, versao: 1, tempo_seg: null, texto: 't' + id, autor: 'Cainan', resposta_a: null, resolvido: false, criado_em: `2026-11-24T10:00:0${id}Z`, ...extra });

test('arvoreComentarios põe as respostas embaixo do original, na ordem', () => {
  const lista = [C(1, { tempo_seg: 5 }), C(3, { resposta_a: 1 }), C(2, { tempo_seg: 2 }), C(4, { resposta_a: 1, criado_em: '2026-11-24T09:00:00Z' })];
  const a = plain(arvoreComentarios(lista));
  assert.deepEqual(a.map((c) => c.id), [1, 2]);
  assert.deepEqual(a[0].respostas.map((c) => c.id), [4, 3]);
  assert.deepEqual(a[1].respostas, []);
});

test('arvoreComentarios: resposta cujo original sumiu não aparece', () => {
  assert.deepEqual(plain(arvoreComentarios([C(5, { resposta_a: 99 })])), []);
});

test('filtrarComentarios por abertos, resolvidos e busca sem acento', () => {
  const a = arvoreComentarios([C(1, { texto: 'Trocar a música' }), C(2, { resolvido: true, texto: 'cor' }), C(3, { resposta_a: 2, texto: 'Ajustei a transição', autor: 'Rafael' })]);
  assert.deepEqual(plain(filtrarComentarios(a, { filtro: 'abertos' })).map((c) => c.id), [1]);
  assert.deepEqual(plain(filtrarComentarios(a, { filtro: 'resolvidos' })).map((c) => c.id), [2]);
  assert.deepEqual(plain(filtrarComentarios(a, { busca: 'MUSICA' })).map((c) => c.id), [1]);
  assert.deepEqual(plain(filtrarComentarios(a, { busca: 'transicao' })).map((c) => c.id), [2], 'acha pela resposta');
  assert.deepEqual(plain(filtrarComentarios(a, { busca: 'rafael' })).map((c) => c.id), [2], 'acha pelo autor');
  assert.equal(filtrarComentarios(a, {}).length, 2);
});

test('marcasLinha: posição em %, juntando comentários muito próximos', () => {
  const m = plain(marcasLinha([C(1, { tempo_seg: 10 }), C(2, { tempo_seg: 10.5, resolvido: true }), C(3, { tempo_seg: 50 }), C(4), C(5, { tempo_seg: 20, resposta_a: 1 })], 100));
  assert.deepEqual(m, [{ tempo: 10, pct: 10, n: 2, abertos: 1 }, { tempo: 50, pct: 50, n: 1, abertos: 1 }]);
});

test('marcasLinha sem duração ou fora do vídeo', () => {
  assert.deepEqual(plain(marcasLinha([C(1, { tempo_seg: 10 })], 0)), []);
  assert.deepEqual(plain(marcasLinha([C(1, { tempo_seg: 130 })], 100)), [{ tempo: 130, pct: 100, n: 1, abertos: 1 }]);
});

test('validadeLink', () => {
  const agora = new Date('2026-11-24T12:00:00Z');
  assert.deepEqual(plain(validadeLink('2026-12-01T12:00:00Z', agora)), { ativo: true, texto: 'vale por mais 7 dias' });
  assert.deepEqual(plain(validadeLink('2026-11-25T00:00:00Z', agora)), { ativo: true, texto: 'vale por menos de 1 dia' });
  assert.deepEqual(plain(validadeLink('2026-11-24T11:00:00Z', agora)), { ativo: false, texto: 'expirado' });
});
