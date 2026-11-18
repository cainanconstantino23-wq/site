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

/* ---------- Organização (18/11): caixa de entrada, linha do tempo, visões, resultados ---------- */

var RESPONDEU = ['Respondeu', 'Reunião', 'Fechou'];
function porData_(campo) { return function (a, b) { var x = a[campo] || '', y = b[campo] || ''; return x < y ? -1 : x > y ? 1 : 0; }; }
function somaDias_(dia, n) { var d = new Date(dia + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

/** O que pede ação agora, em grupos. */
function itensAgora(leads, fila, hoje) {
  var respostas = (leads || []).filter(function (l) { return l.status === 'Respondeu' && !(l.proximo_em && l.proximo_em > hoje); });
  var naResp = {}; respostas.forEach(function (l) { naResp[l.id] = 1; });
  var pend = (fila || []).filter(function (f) { return f.situacao === 'pendente'; });
  var r = {
    respostas: respostas,
    aprovar: pend.filter(function (f) { return f.canal === 'email'; }),
    manual: pend.filter(function (f) { return f.canal !== 'email'; }),
    passos: paraHoje(leads, hoje).filter(function (l) { return !naResp[l.id]; }),
    erros: (fila || []).filter(function (f) { return f.situacao === 'erro'; })
  };
  r.total = r.respostas.length + r.aprovar.length + r.manual.length + r.passos.length + r.erros.length;
  return r;
}

/** O que vem nos próximos dias. */
function itensProximos(leads, fila, hoje, dias) {
  var ate = somaDias_(hoje, dias || 14);
  return {
    passos: (leads || []).filter(function (l) { return l.proximo_em && l.proximo_em > hoje && l.proximo_em <= ate && ENCERRADOS.indexOf(l.status) < 0; }).sort(porData_('proximo_em')),
    robo: (fila || []).filter(function (f) { return f.situacao === 'aprovada'; })
  };
}

/** Eventos do cliente, do mais antigo ao mais recente. */
function linhaDoTempo(lead, fila) {
  var meus = (fila || []).filter(function (f) { return f.lead_id === lead.id; });
  var ev = [];
  if (lead.criado) ev.push({ tipo: 'criado', data: lead.criado });
  meus.filter(function (f) { return f.situacao === 'enviada'; }).sort(porData_('enviado'))
    .forEach(function (f) { ev.push({ tipo: 'enviada', data: f.enviado, item: f }); });
  meus.filter(function (f) { return ['pendente', 'aprovada', 'erro'].indexOf(f.situacao) >= 0; })
    .forEach(function (f) { ev.push({ tipo: 'fila', data: f.criado || null, item: f }); });
  if (lead.resposta) ev.push({ tipo: 'resposta', data: null });
  return ev;
}

var VISOES = {
  todos:       { nome: 'Todos',              filtro: function () { return true; } },
  novos:       { nome: 'Novos',              filtro: function (l) { return l.status === 'Novo'; } },
  esperando:   { nome: 'Esperando resposta', filtro: function (l) { return ['Contatado', 'Lembrete 1', 'Lembrete 2'].indexOf(l.status) >= 0; } },
  responderam: { nome: 'Responderam',        filtro: function (l) { return ['Respondeu', 'Reunião'].indexOf(l.status) >= 0; } },
  fechados:    { nome: 'Fechados',           filtro: function (l) { return l.status === 'Fechou'; } },
  perdidos:    { nome: 'Perdidos',           filtro: function (l) { return l.status === 'Sem interesse'; } }
};

function resultados(leads, fila) {
  var L = leads || [];
  var conta = function (fn) { return L.filter(fn).length; };
  var funil = [
    { nome: 'Empresas', n: L.length },
    { nome: 'Contatadas', n: conta(function (l) { return l.status !== 'Novo'; }) },
    { nome: 'Responderam', n: conta(function (l) { return RESPONDEU.indexOf(l.status) >= 0; }) },
    { nome: 'Reunião', n: conta(function (l) { return ['Reunião', 'Fechou'].indexOf(l.status) >= 0; }) },
    { nome: 'Fecharam', n: conta(function (l) { return l.status === 'Fechou'; }) }
  ];
  var areas = {}, ordem = [];
  L.forEach(function (l) {
    if (!areas[l.area]) { areas[l.area] = { area: l.area, total: 0, contatadas: 0, responderam: 0 }; ordem.push(l.area); }
    var a = areas[l.area]; a.total++;
    if (l.status !== 'Novo') a.contatadas++;
    if (RESPONDEU.indexOf(l.status) >= 0) a.responderam++;
  });
  var porLead = {}; L.forEach(function (l) { porLead[l.id] = l; });
  var canais = { email: {}, wa: {}, ig: {} }, resp = { email: {}, wa: {}, ig: {} };
  (fila || []).forEach(function (f) {
    if (f.situacao !== 'enviada' || f.etapa !== 0 || !canais[f.canal]) return;
    canais[f.canal][f.lead_id] = 1;
    var l = porLead[f.lead_id]; if (l && RESPONDEU.indexOf(l.status) >= 0) resp[f.canal][f.lead_id] = 1;
  });
  var porCanal = ['email', 'wa', 'ig'].map(function (c) { return { canal: c, contatadas: Object.keys(canais[c]).length, responderam: Object.keys(resp[c]).length }; });
  var m = {};
  L.forEach(function (l) { if (l.status === 'Sem interesse') { var k = l.motivo_perda || 'Sem motivo registrado'; m[k] = (m[k] || 0) + 1; } });
  var motivos = Object.keys(m).map(function (k) { return { motivo: k, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; });
  return { funil: funil, porArea: ordem.map(function (k) { return areas[k]; }), porCanal: porCanal, motivos: motivos };
}

/** Linha que entra nas anotações quando um próximo passo é concluído. */
function feitoNota(notas, passo, hoje) {
  var linha = ddmm(hoje) + ': feito — ' + passo;
  return notas ? notas + '\n' + linha : linha;
}
