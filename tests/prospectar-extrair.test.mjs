import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extrairDoSite, celularBR, notaPrevia, siteDeTerceiro, canalDe } from '../supabase/functions/prospectar/extrair.ts';

const pad = ' '.repeat(600);
test('extrairDoSite acha e-mail, Instagram, WhatsApp e vídeo', () => {
  const d = extrairDoSite(`<title>Casa Azul &amp; Mar</title><meta name="description" content="Villa em Trancoso">
    <a href="mailto:reservas@casaazul.com.br">x</a> logo@2x.png noreply@casaazul.com.br
    <a href="https://www.instagram.com/p/abc">post</a><a href="https://instagram.com/casa.azul/">ig</a>
    <a href="https://api.whatsapp.com/send?phone=5573999990000&text=oi">wa</a>
    <iframe src="https://www.youtube.com/embed/xyz"></iframe>${pad}`);
  assert.equal(d.emails[0], 'reservas@casaazul.com.br');
  assert.equal(d.ig, 'casa.azul');
  assert.equal(d.wa, '5573999990000');
  assert.equal(d.video, 'sim');
  assert.equal(d.titulo, 'Casa Azul & Mar');
  assert.equal(d.descricao, 'Villa em Trancoso');
});

test('extrairDoSite: página sem vídeo e página vazia', () => {
  assert.equal(extrairDoSite('<p>oi</p>' + pad).video, 'não');
  assert.equal(extrairDoSite('').video, '?');
  assert.equal(extrairDoSite('<a href="https://wa.me/73999990000">').wa, '73999990000');
});

test('celularBR só aceita celular', () => {
  assert.equal(celularBR('+55 73 99999-0000'), '5573999990000');
  assert.equal(celularBR('(73) 3668-1234'), '');
  assert.equal(celularBR(''), '');
});

test('siteDeTerceiro', () => {
  assert.equal(siteDeTerceiro('https://www.instagram.com/x'), true);
  assert.equal(siteDeTerceiro('https://linktr.ee/x'), true);
  assert.equal(siteDeTerceiro('https://casaazul.com.br'), false);
});

test('notaPrevia e canal', () => {
  assert.deepEqual(notaPrevia({ video: 'não', email: 'a@b.c', wa: '', ig: '', site: 'x' }).nota, 8);
  assert.equal(notaPrevia({ video: '?', email: '', wa: '', ig: '', site: '' }).nota, 3);
  assert.equal(canalDe({ email: '', wa: '1' }), 'wa');
});
