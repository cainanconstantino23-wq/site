import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../painel-logica.js', import.meta.url), 'utf8'), ctx);
const { resumoLead, paraHoje, promptPesquisa, promptResposta } = ctx;

const envios = [
  { etapa: 0, canal: 'email', enviado: '2026-11-12T13:00:00Z' },
  { etapa: 1, canal: 'email', enviado: '2026-11-16T13:00:00Z' },
];
const respondeu = { status: 'Respondeu', primeiro: '2026-11-12T13:00:00Z', proximo: 'ligar', proximo_em: '2026-11-20' };

test('resumo de lead novo sem envios', () => {
  assert.equal(resumoLead({ status: 'Novo' }, [], '2026-11-17'), 'Ainda não contatada');
});

test('resumo com envios, resposta e próximo passo', () => {
  assert.equal(resumoLead(respondeu, envios, '2026-11-17'),
    'Contatada 12/11 por E-mail · lembrete 16/11 · respondeu · próximo: ligar em 20/11');
});

test('resumo marca próximo passo atrasado', () => {
  assert.match(resumoLead(respondeu, envios, '2026-11-21'), /em 20\/11 \(atrasado\)$/);
});

test('resumo mostra motivo da perda', () => {
  const l = { status: 'Sem interesse', primeiro: '2026-11-12T13:00:00Z', motivo_perda: 'Sem orçamento' };
  assert.match(resumoLead(l, envios, '2026-11-17'), /perdida: Sem orçamento/);
});

test('resumo usa a data de primeiro contato quando não há envio registrado', () => {
  assert.equal(resumoLead({ status: 'Contatado', primeiro: '2026-11-12T13:00:00Z' }, [], '2026-11-17'), 'Contatada 12/11');
});

test('para hoje: inclui hoje e atrasados, exclui futuro, sem data e encerrados, em ordem', () => {
  const L = [
    { id: 'a', status: 'Contatado', proximo: 'x', proximo_em: '2026-11-17' },
    { id: 'b', status: 'Respondeu', proximo: 'x', proximo_em: '2026-11-16' },
    { id: 'c', status: 'Contatado', proximo: 'x', proximo_em: '2026-11-18' },
    { id: 'd', status: 'Contatado', proximo: 'x' },
    { id: 'e', status: 'Fechou', proximo: 'x', proximo_em: '2026-11-10' },
    { id: 'f', status: 'Sem interesse', proximo: 'x', proximo_em: '2026-11-10' },
  ];
  assert.deepEqual(paraHoje(L, '2026-11-17').map(l => l.id), ['b', 'a']);
});

test('pedido de pesquisa sem site, Instagram ou descrição não tem buracos', () => {
  const p = promptPesquisa({ empresa: 'Pousada X', cidade: 'Trancoso' }, 'Pousadas');
  assert.doesNotMatch(p, /undefined|null|Site:|Instagram:/);
  assert.match(p, /Pousada X/);
  assert.match(p, /daimefilmes\.com\.br/);
  assert.match(p, /não fale de valor/);
});

test('pedido de pesquisa inclui site e Instagram quando existem', () => {
  const p = promptPesquisa({ empresa: 'Y', site: 'https://y.com', ig: 'yy' }, 'Villas');
  assert.match(p, /Site: https:\/\/y\.com/);
  assert.match(p, /Instagram: @yy/);
});

test('pedido de resposta inclui o que o cliente escreveu e o resumo', () => {
  const p = promptResposta({ empresa: 'Z', resposta: 'Quanto custa?' }, 'Villas', 'Contatada 12/11');
  assert.match(p, /Quanto custa\?/);
  assert.match(p, /Contatada 12\/11/);
  assert.match(p, /não fale de valor/);
});
