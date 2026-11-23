import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../edicao-logica.js', import.meta.url), 'utf8'), ctx);
const { ETAPAS, etapaDe, caminhoTarefa, timecode, ehPastaSaida, tamanhoLegivel, prazoInfo, nomeWindows, nomesUnicos, planoRetomada, inicioDoRange, tokenValido, esperaTentativa, ehNativoGoogle, deveRepetir, podeExcluirVersao, linhasSubida, velocidade, tempoLegivel, textoProgresso, amostrar } = ctx;

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

test('planoRetomada: só pula com o mesmo tamanho; arquivo diferente no disco nunca é completado', () => {
  assert.deepEqual({ ...planoRetomada(null, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(500, 500) }, { acao: 'pular', inicio: 500 });
  assert.deepEqual({ ...planoRetomada(200, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(0, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(900, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(0, 0) }, { acao: 'pular', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(500, null) }, { acao: 'do_zero', inicio: 0 });
});

test('deveRepetir: conta Google desconectada e erros finais não insistem', () => {
  const rede = new Error('rede');
  assert.equal(deveRepetir(rede, 1), true);
  assert.equal(deveRepetir(rede, 5), true);
  assert.equal(deveRepetir(rede, 6), false);
  assert.equal(deveRepetir(Object.assign(new Error('x'), { codigo: 'google_editor' }), 1), false);
  assert.equal(deveRepetir(Object.assign(new Error('x'), { final: true }), 1), false);
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

test('podeExcluirVersao: editor só a última antes da revisão; dono qualquer uma', () => {
  assert.equal(podeExcluirVersao('editor', 'para_revisar', 2, 2), true);
  assert.equal(podeExcluirVersao('editor', 'para_revisar', 1, 2), false);
  assert.equal(podeExcluirVersao('editor', 'ajustes', 2, 2), false);
  assert.equal(podeExcluirVersao('editor', 'aprovado', 2, 2), false);
  assert.equal(podeExcluirVersao('dono', 'aprovado', 1, 2), true);
  assert.equal(podeExcluirVersao('dono', 'para_revisar', 2, 2), true);
  assert.equal(podeExcluirVersao(null, 'para_revisar', 2, 2), false);
});

test('linhasSubida: caminho dentro da casa, ordenado, com o estado de cada arquivo', () => {
  const linhas = linhasSubida([
    { pasta: '02 Audio', nome: 'trilha.wav', tamanho: 10, estado: 'subiu' },
    { pasta: '', nome: 'capa.jpg', tamanho: 5, estado: 'pulado' },
    { pasta: '01 Brutas/Drone', nome: 'DJI_0002.MP4', tamanho: 30, estado: 'falhou' },
    { pasta: '01 Brutas/Drone', nome: 'DJI_0001.MP4', tamanho: 20 },
  ]);
  assert.deepEqual(Array.from(linhas, l => l.rotulo), ['01 Brutas/Drone/DJI_0001.MP4', '01 Brutas/Drone/DJI_0002.MP4', '02 Audio/trilha.wav', 'capa.jpg']);
  assert.deepEqual(Array.from(linhas, l => l.estado), ['subiu', 'falhou', 'subiu', 'pulado']);
  assert.equal(linhas[0].tamanho, 20);
});

// ------------------------------------------------------------ painel de transferências
test('amostrar guarda só os últimos 5 s e recomeça se o progresso voltar', () => {
  let a = [];
  a = amostrar(a, 0, 0); a = amostrar(a, 100, 10); // menos de 250 ms: ignora
  assert.equal(a.length, 1);
  a = amostrar(a, 1000, 100); a = amostrar(a, 3000, 300);
  assert.deepEqual(Array.from(a, x => x.t), [0, 1000, 3000]);
  a = amostrar(a, 6500, 700); // mais de 5 s: as antigas saem
  assert.deepEqual(Array.from(a, x => x.t), [3000, 6500]);
  a = amostrar(a, 7000, 50); // tentou de novo do começo
  assert.deepEqual(Array.from(a, x => x.b), [50]);
});

test('velocidade em bytes por segundo na janela', () => {
  assert.equal(velocidade([{ t: 0, b: 0 }, { t: 2000, b: 2_000_000 }]), 1_000_000);
  assert.equal(velocidade([{ t: 0, b: 0 }]), 0);
  assert.equal(velocidade([]), 0);
});

test('tempoLegivel', () => {
  assert.equal(tempoLegivel(8), '8 s');
  assert.equal(tempoLegivel(0.4), '1 s');
  assert.equal(tempoLegivel(125), '2 min 5 s');
  assert.equal(tempoLegivel(3780), '1 h 3 min');
});

test('textoProgresso como no Cyberduck', () => {
  const mb = 1024 * 1024;
  assert.equal(textoProgresso(17.3 * mb, 67.3 * mb, 6.4 * mb), '17,3 MB de 67,3 MB (25%, 6,4 MB/s, 8 s restantes)');
  assert.equal(textoProgresso(0, 67.3 * mb, 0), '0 B de 67,3 MB (0%)');
  assert.equal(textoProgresso(5, 0, 0), '5 B de 0 B (100%)');
});
