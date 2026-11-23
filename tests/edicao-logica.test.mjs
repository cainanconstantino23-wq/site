import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../edicao-logica.js', import.meta.url), 'utf8'), ctx);
const { ETAPAS, etapaDe, caminhoTarefa, timecode, ehPastaSaida, tamanhoLegivel, prazoInfo, nomeWindows, nomesUnicos, planoRetomada, inicioDoRange, tokenValido, esperaTentativa, ehNativoGoogle } = ctx;

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

const { planoDaCasa, jaNoDrive } = ctx;

test('planoDaCasa: nome da casa, pastas em ordem e arquivos ocultos fora', () => {
  const plano = planoDaCasa([
    { caminho: '09 CASA 12 RB/01 Brutas/A001.MP4', tamanho: 100 },
    { caminho: '09 CASA 12 RB/01 Brutas/Drone/DJI_01.MP4', tamanho: 50 },
    { caminho: '09 CASA 12 RB/.DS_Store', tamanho: 6 },
    { caminho: '09 CASA 12 RB/01 Brutas/._A001.MP4', tamanho: 4 },
    { caminho: '09 CASA 12 RB/07 Roteiro/roteiro.pdf', tamanho: 10 },
    { caminho: '09 CASA 12 RB/.git/config', tamanho: 1 },
  ]);
  assert.equal(plano.casa, '09 CASA 12 RB');
  assert.deepEqual(Array.from(plano.pastas), ['01 Brutas', '01 Brutas/Drone', '07 Roteiro']);
  assert.deepEqual(Array.from(plano.arquivos, (a) => [a.pasta, a.nome, a.tamanho]), [
    ['01 Brutas', 'A001.MP4', 100],
    ['01 Brutas/Drone', 'DJI_01.MP4', 50],
    ['07 Roteiro', 'roteiro.pdf', 10],
  ]);
  assert.equal(plano.total, 160);
});

test('planoDaCasa: arquivo direto na pasta da casa fica na raiz da casa', () => {
  const plano = planoDaCasa([{ caminho: 'CASA/leia.txt', tamanho: 3 }]);
  assert.deepEqual(Array.from(plano.pastas), []);
  assert.equal(plano.arquivos[0].pasta, '');
});

test('planoDaCasa vazio', () => {
  const plano = planoDaCasa([]);
  assert.equal(plano.casa, '');
  assert.equal(plano.arquivos.length, 0);
});

test('jaNoDrive compara nome e tamanho', () => {
  const itens = [{ nome: 'A001.MP4', tamanho: 100, tipo: 'video' }, { nome: 'Drone', tipo: 'pasta', tamanho: null }];
  assert.equal(jaNoDrive({ nome: 'A001.MP4', tamanho: 100 }, itens), true);
  assert.equal(jaNoDrive({ nome: 'A001.MP4', tamanho: 99 }, itens), false);
  assert.equal(jaNoDrive({ nome: 'Drone', tamanho: null }, itens), false);
});

// ------------------------------------------------------------ transferências
test('nomeWindows troca caracteres proibidos e trata o fim e os reservados', () => {
  assert.equal(nomeWindows('Casa: Vilas'), 'Casa_ Vilas');
  assert.equal(nomeWindows('foto?.jpg'), 'foto_.jpg');
  assert.equal(nomeWindows('a<b>c"d|e*f\\g/h'), 'a_b_c_d_e_f_g_h');
  assert.equal(nomeWindows('Pasta. '), 'Pasta');
  assert.equal(nomeWindows('...'), '_');
  assert.equal(nomeWindows('CON'), '_CON');
  assert.equal(nomeWindows('nul.txt'), '_nul.txt');
  assert.equal(nomeWindows('DJI_0001.MP4'), 'DJI_0001.MP4');
});

test('nomesUnicos numera repetidos antes da extensão, sem diferenciar maiúsculas', () => {
  assert.deepEqual(Array.from(nomesUnicos(['a.mp4', 'A.MP4', 'a.mp4', 'b'])), ['a.mp4', 'A (2).MP4', 'a (3).mp4', 'b']);
  assert.deepEqual(Array.from(nomesUnicos(['x:y', 'x?y'])), ['x_y', 'x_y (2)']);
});

test('planoRetomada', () => {
  assert.deepEqual({ ...planoRetomada(null, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(500, 500) }, { acao: 'pular', inicio: 500 });
  assert.deepEqual({ ...planoRetomada(200, 500) }, { acao: 'continuar', inicio: 200 });
  assert.deepEqual({ ...planoRetomada(0, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(900, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(0, 0) }, { acao: 'pular', inicio: 0 });
});

test('inicioDoRange lê o Range do Google', () => {
  assert.equal(inicioDoRange('bytes=0-999'), 1000);
  assert.equal(inicioDoRange(null), 0);
  assert.equal(inicioDoRange('lixo'), 0);
});

test('tokenValido exige mais de 5 minutos', () => {
  const agora = Date.parse('2026-11-23T12:00:00Z');
  assert.equal(tokenValido({ token: 't', expira_em: '2026-11-23T12:06:00Z' }, agora), true);
  assert.equal(tokenValido({ token: 't', expira_em: '2026-11-23T12:04:00Z' }, agora), false);
  assert.equal(tokenValido(null, agora), false);
});

test('esperaTentativa dobra a cada tentativa', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(esperaTentativa), [1000, 2000, 4000, 8000, 16000]);
});

test('ehNativoGoogle', () => {
  assert.equal(ehNativoGoogle('application/vnd.google-apps.document'), true);
  assert.equal(ehNativoGoogle('application/vnd.google-apps.folder'), false);
  assert.equal(ehNativoGoogle('video/mp4'), false);
});
