import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../financeiro-logica.js', import.meta.url), 'utf8'), ctx);
const {
  lerValor, valorDistribuicao, valorParaCampo, somarMes, mesValido, dataBR, nomeMes, brlCurto,
  enriquecer, filtrarReceber, filtrarPagar, resumoMes, despesasPorGrupo, transacoes, clientesResumo,
  pessoasResumo, pontoDoMes, pontoDeEquilibrio, totaisPorAno, despesasDoAno, receitaPorCliente, escala, distribuicaoDe,
} = ctx;

const base = () => enriquecer({
  categorias: [{ id: 1, nome: 'Produção', tipo: 'receita', grupo: null }, { id: 6, nome: 'Editores', tipo: 'despesa', grupo: 'pessoal' }, { id: 9, nome: 'Aluguel', tipo: 'despesa', grupo: 'fixa' }],
  clientes: [{ id: 1, nome: 'Bahia Homes' }, { id: 2, nome: 'Ana' }],
  pessoas: [{ id: 1, nome: 'Editor', tipo: 'editor' }],
  receber: [
    { id: 1, cliente_id: 1, titulo: 'Casa A', categoria_id: 1, valor: 100000, vencimento: '2026-11-05', status: 'recebido', recebido_em: '2026-11-06' },
    { id: 2, cliente_id: 1, titulo: 'Casa B', categoria_id: 1, valor: 50000, vencimento: '2026-11-10', status: 'pendente', recebido_em: null },
    { id: 3, cliente_id: 2, titulo: 'Reels', categoria_id: 1, valor: 30000, vencimento: '2026-11-30', status: 'pendente', recebido_em: null },
    { id: 4, cliente_id: 1, titulo: 'Casa C', categoria_id: 1, valor: 70000, vencimento: '2026-12-10', status: 'pendente', recebido_em: null, recorrente_id: 1, competencia: '2026-12' },
  ],
  pagar: [
    { id: 1, pessoa_id: 1, descricao: 'Edição Casa A', categoria_id: 6, valor: '30000', vencimento: '2026-11-05', status: 'pago', pago_em: '2026-11-07', receber_id: 1 },
    { id: 2, pessoa_id: null, descricao: 'Aluguel', categoria_id: 9, valor: 20000, vencimento: '2026-11-05', status: 'pendente', pago_em: null, recorrente_id: 1, competencia: '2026-11' },
    { id: 3, pessoa_id: null, descricao: 'Cancelada', categoria_id: 9, valor: 99999, vencimento: '2026-11-05', status: 'cancelado', pago_em: null, receber_id: 1 },
  ],
  recorrentes: [{ id: 1, descricao: 'Aluguel', valor: 20000, dia: 5, inicio: '2026-11', ativo: true }],
  receitasRec: [{ id: 1, descricao: 'Mensal', valor: 70000, dia: 10, inicio: '2026-09', fim: '2027-01', ativo: true }],
  puladas: [{ recorrente_id: 1, competencia: '2027-01' }],
});
const HOJE = '2026-11-27';
const igual = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);

test('lerValor: padrão brasileiro', () => {
  assert.equal(lerValor('1.234,56'), 123456);
  assert.equal(lerValor('1.500'), 150000);
  assert.equal(lerValor('1500'), 150000);
  assert.equal(lerValor('1500,5'), 150050);
  assert.equal(lerValor('12.5'), 1250);
  assert.equal(lerValor('R$ 80,00'), 8000);
  assert.equal(lerValor(''), null);
  assert.equal(lerValor('abc'), null);
  assert.equal(lerValor('1,2,3'), null);
});

test('valorDistribuicao: percentual ou reais', () => {
  assert.equal(valorDistribuicao('30%', 100000), 30000);
  assert.equal(valorDistribuicao('12,5%', 100000), 12500);
  assert.equal(valorDistribuicao('1.500,00', 100000), 150000);
  assert.equal(valorDistribuicao('%', 100000), null);
});

test('datas e meses', () => {
  assert.equal(somarMes('2026-12', 1), '2027-01');
  assert.equal(somarMes('2026-01', -1), '2025-12');
  assert.equal(somarMes('2026-11', -3), '2026-08');
  assert.equal(mesValido('2026-13', 'x'), 'x');
  assert.equal(mesValido('2026-02', 'x'), '2026-02');
  assert.equal(dataBR('2026-11-05'), '05/11/2026');
  assert.equal(nomeMes('2026-03'), 'Março de 2026');
  assert.equal(valorParaCampo(123456), '1234,56');
  assert.equal(brlCurto(1500000), 'R$ 15 mil');
});

test('enriquecer: nomes e distribuído (sem canceladas)', () => {
  const E = base();
  assert.equal(E.receber[0].cliente_nome, 'Bahia Homes');
  assert.equal(E.receber[0].distribuido, 30000);
  assert.equal(E.pagar[0].valor, 30000); // texto do banco vira número
  assert.equal(E.pagar[0].receber_titulo, 'Casa A');
  assert.equal(distribuicaoDe(E, 1).length, 1);
});

test('filtros de Receber e Pagar', () => {
  const E = base();
  igual(filtrarReceber(E, '2026-11', {}, HOJE).map((r) => r.id), [1, 2, 3]);
  igual(filtrarReceber(E, '2026-11', { status: 'vencido' }, HOJE).map((r) => r.id), [2]);
  igual(filtrarReceber(E, '2026-11', { q: 'ana' }, HOJE).map((r) => r.id), [3]);
  igual(filtrarPagar(E, '2026-11', {}, HOJE).map((p) => p.id), [1, 2]);
  igual(filtrarPagar(E, '2026-11', { status: 'pago' }, HOJE).map((p) => p.id), [1]);
});

test('resumo do mês', () => {
  const r = resumoMes(base(), '2026-11', HOJE);
  assert.equal(r.receita, 180000);
  assert.equal(r.recebido, 100000);
  assert.equal(r.receberVencido, 50000);
  assert.equal(r.receberPendente, 30000);
  assert.equal(r.despesas, 50000);
  assert.equal(r.pago, 30000);
  assert.equal(r.pagarVencido, 20000);
  assert.equal(r.lucro, 70000);
  igual(despesasPorGrupo(base(), '2026-11').map((g) => [g.grupo, g.total]), [['pessoal', 30000], ['fixa', 20000]]);
});

test('transações: entradas e saídas realizadas', () => {
  const t = transacoes(base(), '2026-11', '');
  igual(t.map((x) => x.tipo + x.id), ['saida1', 'entrada1']);
  assert.equal(transacoes(base(), '2026-11', 'entrada').length, 1);
});

test('clientes: em aberto só até o fim deste mês', () => {
  const c = clientesResumo(base(), '2026-11', HOJE, '');
  const bh = c.find((x) => x.id === 1);
  assert.equal(bh.em_aberto, 50000); // Casa C (dezembro) não conta
  assert.equal(bh.recebido_total, 100000);
  assert.equal(c[0].id, 1); // maior em aberto primeiro
  assert.equal(pessoasResumo(base(), '', '')[0].total_pago, 30000);
});

test('pontoDoMes: soma recorrências ainda não geradas, respeita puladas e fim', () => {
  const E = base();
  const dez = pontoDoMes(E, '2026-12', '2026-11');
  assert.equal(dez.entradasPrev, 70000);  // Casa C já gerada, não duplica
  assert.equal(dez.saidasPrev, 20000);    // aluguel ainda não gerado em dezembro
  assert.equal(pontoDoMes(E, '2027-01', '2026-11').entradasPrev, 0); // pulado
  assert.equal(pontoDoMes(E, '2027-02', '2026-11').entradasPrev, 0); // depois do fim
  assert.equal(pontoDoMes(E, '2026-10', '2026-11').saidasPrev, 0);   // passado não prevê
});

test('relatórios do ano e ponto de equilíbrio', () => {
  const E = base();
  const a = totaisPorAno(E, '2026-11').find((x) => x.ano === 2026);
  assert.equal(a.resultado, 70000);
  assert.equal(a.meses, 1);
  assert.equal(despesasDoAno(E, 2026).categorias[0].nome, 'Editores');
  assert.equal(receitaPorCliente(E, 2026)[0].total, 100000);
  const eq = pontoDeEquilibrio(E, '2026-12'); // base set–nov
  assert.equal(eq.fixo, 20000);
  assert.equal(eq.variavelMedia, 30000);
  assert.equal(eq.receitaMedia, 100000);
  igual(escala(0, 95000).ticks.at(-1) >= 95000, true);
});
