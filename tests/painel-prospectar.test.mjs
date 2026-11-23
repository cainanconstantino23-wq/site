import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../painel-logica.js', import.meta.url), 'utf8'), ctx);
const { dominio, duplicadoDe, achadoParaLead } = ctx;

test('dominio limpa protocolo, www e caminho', () => {
  assert.equal(dominio('https://www.Matuete.com/pt/villas?x=1'), 'matuete.com');
  assert.equal(dominio('niama.com.br'), 'niama.com.br');
  assert.equal(dominio(''), '');
});

const leads = [
  { id: 'a', empresa: 'Pousada Etnia', site: 'https://etniabrasil.com.br', ig: 'etniapousada' },
  { id: 'b', empresa: 'Uxua Casa Hotel', site: '', ig: '' },
];

test('duplicadoDe encontra por site, Instagram ou nome', () => {
  assert.equal(duplicadoDe({ empresa: 'X', site: 'http://www.etniabrasil.com.br/' }, leads).id, 'a');
  assert.equal(duplicadoDe({ empresa: 'Y', ig: '@EtniaPousada' }, leads).id, 'a');
  assert.equal(duplicadoDe({ empresa: 'UXUÁ Casa Hotel & Spa' }, leads), null);
  assert.equal(duplicadoDe({ empresa: 'Uxua Casa Hotel' }, leads).id, 'b');
  assert.equal(duplicadoDe({ empresa: 'Pousada Nova', site: 'nova.com' }, leads), null);
});

test('duplicadoDe ignora nomes curtos demais depois de limpar', () => {
  assert.equal(duplicadoDe({ empresa: 'Pousada' }, [{ id: 'z', empresa: 'Hotel' }]), null);
});

test('achadoParaLead monta a linha do lead', () => {
  const l = achadoParaLead({ area: 'pousadas', empresa: 'Casa X', nota: 8, ig: '@casax', wa: '(73) 99999-0000', porque: 'sem vídeo', frase: 'f' }, 'b1', 'Pousada / hotel boutique');
  assert.equal(l.id, 'b1');
  assert.equal(l.custom, true);
  assert.equal(l.ig, 'casax');
  assert.equal(l.wa, '73999990000');
  assert.equal(l.obs, 'Busca: sem vídeo');
  assert.equal(l.segmento, 'Pousada / hotel boutique');
  assert.equal(l.video, '?');
});

test('achadoParaLead leva telefone, endereço e vídeo no Instagram', () => {
  const l = achadoParaLead({ area: 'pousadas', empresa: 'Casa X', nota: 8, porque: 'sem vídeo', telefone: '+55 73 3668-1234', endereco: 'Rua A, Trancoso', ig_video: 'não' }, 'b2', '');
  assert.equal(l.telefone, '+55 73 3668-1234');
  assert.equal(l.endereco, 'Rua A, Trancoso');
  assert.equal(l.obs, 'Busca: sem vídeo Quase sem vídeo no Instagram.');
});
