import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../painel-logica.js', import.meta.url), 'utf8'), ctx);
const { itensAgora, itensProximos, linhaDoTempo, VISOES, resultados, feitoNota } = ctx;
const ids = a => a.map(x => x.id);
const plain = v => JSON.parse(JSON.stringify(v)); // objetos do vm vêm de outro contexto
const HOJE = '2026-11-18';

const leads = [
  { id: 'r1', status: 'Respondeu' },
  { id: 'r2', status: 'Respondeu', proximo: 'ligar', proximo_em: '2026-11-25' },
  { id: 'r3', status: 'Respondeu', proximo: 'ligar', proximo_em: '2026-11-18' },
  { id: 'p1', status: 'Contatado', proximo: 'x', proximo_em: '2026-11-17' },
  { id: 'p2', status: 'Contatado', proximo: 'x', proximo_em: '2026-11-21' },
  { id: 'p3', status: 'Fechou', proximo: 'x', proximo_em: '2026-11-17' },
  { id: 'n1', status: 'Novo' },
];
const fila = [
  { id: 'f1', lead_id: 'n1', canal: 'email', situacao: 'pendente' },
  { id: 'f2', lead_id: 'n1', canal: 'wa', situacao: 'pendente' },
  { id: 'f3', lead_id: 'p1', canal: 'email', situacao: 'erro' },
  { id: 'f4', lead_id: 'p2', canal: 'email', situacao: 'aprovada' },
  { id: 'f5', lead_id: 'p2', canal: 'email', situacao: 'enviada', enviado: '2026-11-18T12:00:00Z' },
  { id: 'f6', lead_id: 'p1', canal: 'email', situacao: 'enviada', enviado: '2026-11-10T12:00:00Z' },
];

test('agora: respostas sem próximo passo futuro', () => {
  assert.deepEqual(ids(itensAgora(leads, fila, HOJE).respostas), ['r1', 'r3']);
});

test('agora: separa e-mails para aprovar e envios à mão', () => {
  const a = itensAgora(leads, fila, HOJE);
  assert.deepEqual(ids(a.aprovar), ['f1']);
  assert.deepEqual(ids(a.manual), ['f2']);
  assert.deepEqual(ids(a.erros), ['f3']);
});

test('agora: próximos passos vencidos e de hoje, sem repetir quem já está em respostas', () => {
  assert.deepEqual(ids(itensAgora(leads, fila, HOJE).passos), ['p1']);
});

test('agora: total soma todos os grupos', () => {
  assert.equal(itensAgora(leads, fila, HOJE).total, 2 + 1 + 1 + 1 + 1);
});

test('próximos: passos futuros até 14 dias e aprovadas esperando o robô', () => {
  const p = itensProximos(leads, fila, HOJE);
  assert.deepEqual(ids(p.passos), ['p2', 'r2']);
  assert.deepEqual(ids(p.robo), ['f4']);
});

test('linha do tempo: envios em ordem, fila depois, resposta por último', () => {
  const l = { id: 'p1', status: 'Respondeu', resposta: 'Oi!', criado: '2026-11-01T10:00:00Z' };
  const F = [
    { id: 'a', lead_id: 'p1', situacao: 'enviada', enviado: '2026-11-12T10:00:00Z', etapa: 1 },
    { id: 'b', lead_id: 'p1', situacao: 'enviada', enviado: '2026-11-05T10:00:00Z', etapa: 0 },
    { id: 'c', lead_id: 'p1', situacao: 'pendente', etapa: 2 },
    { id: 'd', lead_id: 'outro', situacao: 'enviada', enviado: '2026-11-06T10:00:00Z', etapa: 0 },
  ];
  assert.deepEqual(plain(linhaDoTempo(l, F)).map(e => e.tipo + ':' + (e.item ? e.item.id : '')),
    ['criado:', 'enviada:b', 'enviada:a', 'fila:c', 'resposta:']);
});

test('linha do tempo: sem resposta quando o campo está vazio', () => {
  assert.equal(linhaDoTempo({ id: 'x', status: 'Respondeu' }, []).some(e => e.tipo === 'resposta'), false);
});

test('visões de leads filtram pela etapa', () => {
  const L = [{ status: 'Novo' }, { status: 'Contatado' }, { status: 'Lembrete 2' }, { status: 'Respondeu' }, { status: 'Reunião' }, { status: 'Fechou' }, { status: 'Sem interesse' }];
  const n = id => L.filter(VISOES[id].filtro).length;
  assert.deepEqual([n('todos'), n('novos'), n('esperando'), n('responderam'), n('fechados'), n('perdidos')], [7, 1, 2, 2, 1, 1]);
});

test('resultados: funil acumulado e taxa por área', () => {
  const L = [
    { area: 'villas', status: 'Novo' }, { area: 'villas', status: 'Contatado' }, { area: 'villas', status: 'Respondeu' },
    { area: 'gastro', status: 'Fechou' }, { area: 'gastro', status: 'Sem interesse', motivo_perda: 'Sem orçamento' },
  ];
  const r = plain(resultados(L, []));
  assert.deepEqual(r.funil.map(x => x.n), [5, 4, 2, 1, 1]);
  const v = r.porArea.find(x => x.area === 'villas');
  assert.deepEqual([v.total, v.contatadas, v.responderam], [3, 2, 1]);
  assert.deepEqual(r.motivos, [{ motivo: 'Sem orçamento', n: 1 }]);
});

test('resultados: respostas por canal do primeiro contato', () => {
  const L = [{ id: 'a', status: 'Respondeu' }, { id: 'b', status: 'Contatado' }];
  const F = [{ lead_id: 'a', etapa: 0, canal: 'wa', situacao: 'enviada' }, { lead_id: 'b', etapa: 0, canal: 'email', situacao: 'enviada' }];
  const c = plain(resultados(L, F).porCanal);
  assert.deepEqual(c.find(x => x.canal === 'wa'), { canal: 'wa', contatadas: 1, responderam: 1 });
  assert.deepEqual(c.find(x => x.canal === 'email'), { canal: 'email', contatadas: 1, responderam: 0 });
});

test('feito: registra o passo nas anotações com a data', () => {
  assert.equal(feitoNota('', 'Ligar para a gerente', HOJE), '18/11: feito — Ligar para a gerente');
  assert.equal(feitoNota('antes', 'x', HOJE), 'antes\n18/11: feito — x');
});
