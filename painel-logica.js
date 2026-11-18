/* Lógica pura do painel de prospecção (sem dados, sem rede). Carregado pelo painel.html e testado em tests/. */

var NOME_CANAL = { email: 'E-mail', wa: 'WhatsApp', ig: 'Instagram' };
var ENCERRADOS = ['Fechou', 'Sem interesse'];
var REGRAS_TEXTO = [
  'Regras de texto (obrigatórias):',
  '- não fale de valor, preço, orçamento nem de pacote;',
  '- não diga que eu filmo em um dia;',
  '- o pedido é só um: visitar o site daimefilmes.com.br;',
  '- tom humano, direto e curto, em português do Brasil.'
].join('\n');

/** 'YYYY-MM-DD' ou timestamp ISO → 'DD/MM' (timestamps no fuso da Bahia). */
function ddmm(v) {
  if (!v) return '';
  var s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(8, 10) + '/' + s.slice(5, 7);
  return new Date(s).toLocaleDateString('pt-BR', { timeZone: 'America/Bahia', day: '2-digit', month: '2-digit' });
}

function resumoLead(lead, enviadas, hoje) {
  var partes = [];
  var env = (enviadas || []).filter(function (e) { return e.enviado; })
    .slice().sort(function (a, b) { return a.enviado < b.enviado ? -1 : 1; });
  var primeira = env.filter(function (e) { return e.etapa === 0; })[0];
  if (primeira) partes.push('Contatada ' + ddmm(primeira.enviado) + ' por ' + (NOME_CANAL[primeira.canal] || primeira.canal));
  else if (lead.primeiro) partes.push('Contatada ' + ddmm(lead.primeiro));
  env.filter(function (e) { return e.etapa > 0; }).forEach(function (e) { partes.push('lembrete ' + ddmm(e.enviado)); });
  if (['Respondeu', 'Reunião', 'Fechou'].indexOf(lead.status) >= 0) partes.push('respondeu');
  if (lead.status === 'Sem interesse' && lead.motivo_perda) partes.push('perdida: ' + lead.motivo_perda);
  if (lead.proximo) {
    var p = 'próximo: ' + lead.proximo;
    if (lead.proximo_em) p += ' em ' + ddmm(lead.proximo_em) + (lead.proximo_em < hoje ? ' (atrasado)' : '');
    partes.push(p);
  }
  return partes.length ? partes.join(' · ') : 'Ainda não contatada';
}

function paraHoje(leads, hoje) {
  return (leads || []).filter(function (l) {
    return l.proximo_em && l.proximo_em <= hoje && ENCERRADOS.indexOf(l.status) < 0;
  }).sort(function (a, b) { return a.proximo_em < b.proximo_em ? -1 : a.proximo_em > b.proximo_em ? 1 : 0; });
}

function linhasLead_(lead, areaNome) {
  var ls = ['Empresa: ' + lead.empresa];
  if (areaNome) ls.push('Área: ' + areaNome);
  if (lead.cidade) ls.push('Cidade: ' + lead.cidade);
  if (lead.site) ls.push('Site: ' + lead.site);
  if (lead.ig) ls.push('Instagram: @' + String(lead.ig).replace(/^@/, ''));
  if (lead.sobre) ls.push('Como a empresa se descreve: ' + lead.sobre);
  if (lead.obs) ls.push('Minha observação: ' + lead.obs);
  return ls.join('\n');
}

var QUEM_SOU = 'Sou o Cainan, da Daime Filmes: faço filmes, fotos e drone de imóveis, hospedagem e experiências no sul da Bahia.';

function promptPesquisa(lead, areaNome) {
  return [
    QUEM_SOU,
    'Vou entrar em contato com esta empresa para oferecer meu trabalho. Pesquise sobre ela (site e Instagram, se puder acessar).',
    '',
    linhasLead_(lead, areaNome),
    '',
    'Me devolva:',
    '1. De 4 a 6 tópicos curtos sobre a empresa (o que vende, público, diferenciais, tamanho).',
    '2. Se ela já usa vídeo no site ou no Instagram, e com que qualidade.',
    '3. Uma frase personalizada de uma linha para abrir a minha mensagem, mostrando que conheço a empresa.',
    '',
    REGRAS_TEXTO
  ].join('\n');
}

function promptResposta(lead, areaNome, resumo) {
  var ls = [
    QUEM_SOU,
    'Esta empresa respondeu à minha prospecção. Escreva um rascunho de resposta por e-mail.',
    '',
    linhasLead_(lead, areaNome),
    'Histórico: ' + (resumo || '')
  ];
  if (lead.pesquisa) ls.push('', 'O que sei da empresa:', lead.pesquisa);
  if (lead.notas) ls.push('', 'Minhas anotações:', lead.notas);
  ls.push('', 'O que o cliente escreveu:', lead.resposta || '(cole aqui a resposta do cliente)', '',
    'Responda ao que ele perguntou, em poucas linhas, e proponha um próximo passo simples (uma conversa rápida ou ver o site).',
    '', REGRAS_TEXTO);
  return ls.join('\n');
}
