import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../edicao-logica.js', import.meta.url), 'utf8'), ctx);
const { ETAPAS, etapaDe, caminhoTarefa, timecode, ehPastaSaida, tamanhoLegivel, prazoInfo } = ctx;

test('ETAPAS na ordem da linha do tempo', () => {
  assert.deepEqual(Array.from(ETAPAS, (e) => e.id), ['a_fazer', 'em_edicao', 'para_revisar', 'ajustes', 'reenviado', 'aprovado']);
});

test('etapaDe separa para revisar de reenviado', () => {
  assert.equal(etapaDe('a_fazer', 0), 'a_fazer');
  assert.equal(etapaDe('em_edicao', 0), 'em_edicao');
  assert.equal(etapaDe('para_revisar', 1), 'para_revisar');
  assert.equal(etapaDe('para_revisar', 2), 'reenviado');
  assert.equal(etapaDe('ajustes', 1), 'ajustes');
  assert.equal(etapaDe('aprovado', 3), 'aprovado');
});

test('caminhoTarefa a partir dos eventos', () => {
  const ev = [{ tipo: 'criada' }, { tipo: 'comecou' }, { tipo: 'versao', versao: 1 }, { tipo: 'ajustes', versao: 1 }, { tipo: 'versao', versao: 2 }, { tipo: 'aprovada', versao: 2 }];
  assert.deepEqual(Array.from(caminhoTarefa(ev)), ['a_fazer', 'em_edicao', 'para_revisar', 'ajustes', 'reenviado', 'aprovado']);
  assert.deepEqual(Array.from(caminhoTarefa([])), ['a_fazer']);
});

test('timecode', () => {
  assert.equal(timecode(0), '00:00');
  assert.equal(timecode(134.6), '02:14');
  assert.equal(timecode(3725), '1:02:05');
  assert.equal(timecode(null), '');
});

test('ehPastaSaida reconhece 06 Saída com ou sem acento', () => {
  for (const nome of ['06 Saída', '06 Saida', '06 SAÍDA', '6 saida', '06  Saída ']) assert.equal(ehPastaSaida(nome), true, nome);
  for (const nome of ['05 Projetos', 'Saída antiga', '06 Saídas velhas']) assert.equal(ehPastaSaida(nome), false, nome);
});

test('tamanhoLegivel', () => {
  assert.equal(tamanhoLegivel(0), '0 B');
  assert.equal(tamanhoLegivel(1536), '1,5 KB');
  assert.equal(tamanhoLegivel(734003200), '700 MB');
  assert.equal(tamanhoLegivel(2147483648), '2,0 GB');
  assert.equal(tamanhoLegivel(null), '');
});

test('prazoInfo', () => {
  assert.deepEqual({ ...prazoInfo('2026-11-25', '2026-11-23') }, { texto: 'até 25/11', atrasado: false });
  assert.deepEqual({ ...prazoInfo('2026-11-20', '2026-11-23') }, { texto: 'venceu 20/11', atrasado: true });
  assert.deepEqual({ ...prazoInfo('2026-11-23', '2026-11-23') }, { texto: 'hoje', atrasado: false });
  assert.equal(prazoInfo(null, '2026-11-23'), null);
});
