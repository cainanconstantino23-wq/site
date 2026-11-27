/* Lógica pura do Financeiro (sem rede, sem tela). Carregado pelo financeiro.html e testado em tests/.
   Valores em centavos (inteiros). Datas 'AAAA-MM-DD', meses 'AAAA-MM'.
   D = { categorias, clientes, pessoas, receber, pagar, recorrentes, receitasRec, puladas } (linhas do Supabase). */

var MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
var MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
var TIPOS_PESSOA = { editor: 'Editor', funcionario: 'Funcionário', freelancer: 'Freelancer', fornecedor: 'Fornecedor' };
var GRUPOS_DESPESA = { pessoal: 'Equipe (editores e funcionários)', fixa: 'Despesas fixas', variavel: 'Despesas variáveis', imposto: 'Impostos' };

// ------------------------------------------------------------ dinheiro
function brl(centavos) {
  return (Number(centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** "R$ 10 mil", "R$ 850" — para eixos e rótulos curtos. */
function brlCurto(centavos) {
  var v = centavos / 100, sinal = v < 0 ? '−' : '', a = Math.abs(v);
  if (a >= 1000) return sinal + 'R$ ' + (a / 1000).toLocaleString('pt-BR', { maximumFractionDigits: a >= 10000 ? 0 : 1 }) + ' mil';
  return sinal + 'R$ ' + Math.round(a).toLocaleString('pt-BR');
}

/** Texto digitado → centavos, ou null. "1.234,56" · "1.500" (mil e quinhentos) · "1500" · "1500,5" · "12.5". */
function lerValor(texto) {
  var s = String(texto == null ? '' : texto).trim().replace(/R\$|\s/g, '');
  if (!s) return null;
  if (s.indexOf(',') >= 0) {
    if (!/^-?[\d.]*,\d*$/.test(s)) return null;
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  var n = Number(s);
  if (!isFinite(n) || s === '' || s === '-') return null;
  return Math.round(n * 100);
}

/** Valor de uma parte da distribuição: "30%" do recebimento ou um valor em reais. */
function valorDistribuicao(texto, valorRecebimento) {
  var s = String(texto || '').trim();
  if (/%$/.test(s)) {
    var pct = Number(s.slice(0, -1).replace(',', '.').trim());
    return isFinite(pct) && s.length > 1 ? Math.round(valorRecebimento * pct / 100) : null;
  }
  return lerValor(s);
}

/** Centavos → texto de campo ("1234,56"). */
function valorParaCampo(centavos) {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

// ------------------------------------------------------------ datas
function pad2(n) { return String(n).padStart(2, '0'); }

/** Hoje no fuso da Bahia ('AAAA-MM-DD'). */
function hojeBahia(agora) {
  return (agora || new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
}

function somarMes(mes, delta) {
  var a = Number(mes.slice(0, 4)), m = Number(mes.slice(5, 7));
  var d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1);
}

function mesValido(mes, padrao) {
  return /^\d{4}-\d{2}$/.test(mes || '') && Number(mes.slice(5, 7)) >= 1 && Number(mes.slice(5, 7)) <= 12 ? mes : padrao;
}

function nomeMes(mes) { return MESES_NOME[Number(mes.slice(5, 7)) - 1] + ' de ' + mes.slice(0, 4); }
function mesCurto(mes) { return MESES_CURTO[Number(mes.slice(5, 7)) - 1]; }

function dataBR(iso) {
  if (!iso) return '—';
  var p = String(iso).slice(0, 10).split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

/** O dia cabe no intervalo [primeiro dia do mês, primeiro dia do mês seguinte)? */
function noMes(data, mes) { return !!data && data >= mes + '-01' && data < somarMes(mes, 1) + '-01'; }
function noAno(data, ano) { return !!data && data >= ano + '-01-01' && data < (ano + 1) + '-01-01'; }

// ------------------------------------------------------------ junções
function porId(lista) { var m = {}; (lista || []).forEach(function (x) { m[x.id] = x; }); return m; }

/** Liga nomes de cliente, categoria e pessoa às linhas; soma o distribuído de cada recebimento. */
function enriquecer(D) {
  var cli = porId(D.clientes), cat = porId(D.categorias), pes = porId(D.pessoas), rec = porId(D.receber);
  var distribuido = {};
  D.pagar.forEach(function (p) {
    if (p.receber_id && p.status !== 'cancelado') distribuido[p.receber_id] = (distribuido[p.receber_id] || 0) + Number(p.valor);
  });
  var receber = D.receber.map(function (r) {
    return Object.assign({}, r, {
      valor: Number(r.valor),
      cliente_nome: r.cliente_id && cli[r.cliente_id] ? cli[r.cliente_id].nome : null,
      categoria_nome: r.categoria_id && cat[r.categoria_id] ? cat[r.categoria_id].nome : null,
      distribuido: distribuido[r.id] || 0
    });
  });
  var pagar = D.pagar.map(function (p) {
    var c = p.categoria_id && cat[p.categoria_id], pe = p.pessoa_id && pes[p.pessoa_id];
    return Object.assign({}, p, {
      valor: Number(p.valor),
      pessoa_nome: pe ? pe.nome : null, pessoa_tipo: pe ? pe.tipo : null,
      categoria_nome: c ? c.nome : null, categoria_grupo: c ? c.grupo : null,
      receber_titulo: p.receber_id && rec[p.receber_id] ? rec[p.receber_id].titulo : null
    });
  });
  return Object.assign({}, D, { receber: receber, pagar: pagar });
}

function ordenarVenc(a, b) { return a.vencimento < b.vencimento ? -1 : a.vencimento > b.vencimento ? 1 : a.id - b.id; }
function contem(txt, q) { return String(txt || '').toLowerCase().indexOf(q) >= 0; }
function soma(lista) { return lista.reduce(function (s, x) { return s + Number(x.valor); }, 0); }

// ------------------------------------------------------------ listas com filtro
/** Receber: do mês, ou "vencido" = todos os atrasados de qualquer mês. f = { q, status, categoria }. */
function filtrarReceber(E, mes, f, hoje) {
  f = f || {};
  var q = (f.q || '').trim().toLowerCase();
  return E.receber.filter(function (r) {
    if (f.status === 'vencido') { if (!(r.status === 'pendente' && r.vencimento < hoje)) return false; }
    else {
      if (!noMes(r.vencimento, mes)) return false;
      if ((f.status === 'pendente' || f.status === 'recebido') && r.status !== f.status) return false;
    }
    if (q && !contem(r.titulo, q) && !contem(r.cliente_nome, q)) return false;
    if (f.categoria && String(r.categoria_id) !== String(f.categoria)) return false;
    return true;
  }).sort(ordenarVenc);
}

function filtrarPagar(E, mes, f, hoje) {
  f = f || {};
  var q = (f.q || '').trim().toLowerCase();
  return E.pagar.filter(function (p) {
    if (f.status === 'vencido') { if (!(p.status === 'pendente' && p.vencimento < hoje)) return false; }
    else {
      if (p.status === 'cancelado' || !noMes(p.vencimento, mes)) return false;
      if ((f.status === 'pendente' || f.status === 'pago') && p.status !== f.status) return false;
    }
    if (q && !contem(p.descricao, q) && !contem(p.pessoa_nome, q)) return false;
    if (f.categoria && String(p.categoria_id) !== String(f.categoria)) return false;
    return true;
  }).sort(ordenarVenc);
}

/** Partes da distribuição de um recebimento (contas a pagar ligadas a ele, não canceladas). */
function distribuicaoDe(E, receberId) {
  return E.pagar.filter(function (p) { return p.receber_id === receberId && p.status !== 'cancelado'; })
    .sort(function (a, b) { return a.id - b.id; });
}

// ------------------------------------------------------------ visão geral
function resumoMes(E, mes, hoje) {
  var rMes = E.receber.filter(function (r) { return noMes(r.vencimento, mes); });
  var pMes = E.pagar.filter(function (p) { return p.status !== 'cancelado' && noMes(p.vencimento, mes); });
  var pend = function (l) { return l.filter(function (x) { return x.status === 'pendente'; }); };
  var recebido = soma(E.receber.filter(function (r) { return r.status === 'recebido' && noMes(r.recebido_em, mes); }));
  var pago = soma(E.pagar.filter(function (p) { return p.status === 'pago' && noMes(p.pago_em, mes); }));
  return {
    receita: soma(rMes),
    receberPendente: soma(pend(rMes).filter(function (r) { return r.vencimento >= hoje; })),
    receberVencido: soma(pend(rMes).filter(function (r) { return r.vencimento < hoje; })),
    recebido: recebido,
    despesas: soma(pMes),
    pagarPendente: soma(pend(pMes).filter(function (p) { return p.vencimento >= hoje; })),
    pagarVencido: soma(pend(pMes).filter(function (p) { return p.vencimento < hoje; })),
    pago: pago,
    lucro: recebido - pago
  };
}

/** Despesas do mês por grupo (equipe, fixas, variáveis, impostos), maior primeiro. */
function despesasPorGrupo(E, mes) {
  var g = {};
  E.pagar.forEach(function (p) {
    if (p.status === 'cancelado' || !noMes(p.vencimento, mes)) return;
    var k = p.categoria_grupo || '';
    g[k] = g[k] || { grupo: p.categoria_grupo || null, total: 0, pago: 0 };
    g[k].total += p.valor;
    if (p.status === 'pago') g[k].pago += p.valor;
  });
  return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.total - a.total; });
}

function vencidos(lista, hoje) {
  return lista.filter(function (x) { return x.status === 'pendente' && x.vencimento < hoje; }).sort(ordenarVenc);
}

/** O que já entrou e saiu no mês, mais recente primeiro. tipo: '', 'entrada' ou 'saida'. */
function transacoes(E, mes, tipo) {
  var ent = E.receber.filter(function (r) { return r.status === 'recebido' && noMes(r.recebido_em, mes); })
    .map(function (r) { return { tipo: 'entrada', id: r.id, data: r.recebido_em, descricao: r.titulo, contraparte: r.cliente_nome, categoria_nome: r.categoria_nome, valor: r.valor }; });
  var sai = E.pagar.filter(function (p) { return p.status === 'pago' && noMes(p.pago_em, mes); })
    .map(function (p) { return { tipo: 'saida', id: p.id, data: p.pago_em, descricao: p.descricao, contraparte: p.pessoa_nome, categoria_nome: p.categoria_nome, valor: p.valor }; });
  var l = tipo === 'entrada' ? ent : tipo === 'saida' ? sai : ent.concat(sai);
  return l.sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : b.id - a.id; });
}

// ------------------------------------------------------------ cadastros
/** Em aberto de um cliente: vencidas e as que vencem neste mês (meses futuros não contam). */
function clientesResumo(E, mes, hoje, q) {
  var lim = somarMes(hoje.slice(0, 7), 1) + '-01';
  q = (q || '').trim().toLowerCase();
  return E.clientes.filter(function (c) { return !q || contem(c.nome, q); }).map(function (c) {
    var dele = E.receber.filter(function (r) { return r.cliente_id === c.id; });
    var abertas = dele.filter(function (r) { return r.status === 'pendente' && r.vencimento < lim; }).sort(ordenarVenc);
    return Object.assign({}, c, {
      em_aberto: soma(abertas), qtd_aberto: abertas.length, pendentes: abertas,
      recebido_mes: soma(dele.filter(function (r) { return r.status === 'recebido' && noMes(r.recebido_em, mes); })),
      recebido_total: soma(dele.filter(function (r) { return r.status === 'recebido'; }))
    });
  }).sort(function (a, b) { return b.em_aberto - a.em_aberto || a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }); });
}

function pessoasResumo(E, q, tipo) {
  q = (q || '').trim().toLowerCase();
  return E.pessoas.filter(function (p) { return (!q || contem(p.nome, q)) && (!tipo || p.tipo === tipo); }).map(function (p) {
    var dela = E.pagar.filter(function (x) { return x.pessoa_id === p.id; });
    return Object.assign({}, p, {
      total_pago: soma(dela.filter(function (x) { return x.status === 'pago'; })),
      em_aberto: soma(dela.filter(function (x) { return x.status === 'pendente'; }))
    });
  }).sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }); });
}

function receitasRecorrentesResumo(E) {
  var cli = porId(E.clientes), cat = porId(E.categorias);
  return E.receitasRec.map(function (rr) {
    var rec = E.receber.filter(function (r) { return r.recorrente_id === rr.id && r.status === 'recebido'; });
    return Object.assign({}, rr, {
      valor: Number(rr.valor),
      cliente_nome: rr.cliente_id && cli[rr.cliente_id] ? cli[rr.cliente_id].nome : null,
      categoria_nome: rr.categoria_id && cat[rr.categoria_id] ? cat[rr.categoria_id].nome : null,
      recebido_total: soma(rec), meses_recebidos: rec.length
    });
  }).sort(function (a, b) { return (b.ativo - a.ativo) || (b.valor - a.valor); });
}

function recorrentesResumo(E) {
  var pes = porId(E.pessoas), cat = porId(E.categorias);
  return E.recorrentes.map(function (rc) {
    return Object.assign({}, rc, {
      valor: Number(rc.valor),
      pessoa_nome: rc.pessoa_id && pes[rc.pessoa_id] ? pes[rc.pessoa_id].nome : null,
      categoria_nome: rc.categoria_id && cat[rc.categoria_id] ? cat[rc.categoria_id].nome : null
    });
  }).sort(function (a, b) { return (b.ativo - a.ativo) || (a.dia - b.dia) || a.descricao.localeCompare(b.descricao, 'pt-BR'); });
}

// ------------------------------------------------------------ relatórios
/** Um mês: realizado (recebido/pago no mês) e previsto (em aberto com vencimento no mês,
    mais recorrências ativas que ainda não viraram conta, para este mês e os seguintes). */
function pontoDoMes(E, mes, atual) {
  var ent = soma(E.receber.filter(function (r) { return r.status === 'recebido' && noMes(r.recebido_em, mes); }));
  var sai = soma(E.pagar.filter(function (p) { return p.status === 'pago' && noMes(p.pago_em, mes); }));
  var entPrev = soma(E.receber.filter(function (r) { return r.status === 'pendente' && noMes(r.vencimento, mes); }));
  var saiPrev = soma(E.pagar.filter(function (p) { return p.status === 'pendente' && noMes(p.vencimento, mes); }));
  if (mes >= atual) {
    E.recorrentes.forEach(function (rc) {
      if (!rc.ativo || rc.inicio > mes) return;
      if (!E.pagar.some(function (p) { return p.recorrente_id === rc.id && p.competencia === mes; })) saiPrev += Number(rc.valor);
    });
    E.receitasRec.forEach(function (rr) {
      if (!rr.ativo || rr.inicio > mes || (rr.fim && rr.fim < mes)) return;
      if (E.receber.some(function (r) { return r.recorrente_id === rr.id && r.competencia === mes; })) return;
      if ((E.puladas || []).some(function (p) { return p.recorrente_id === rr.id && p.competencia === mes; })) return;
      entPrev += Number(rr.valor);
    });
  }
  return { mes: mes, entradas: ent, saidas: sai, entradasPrev: entPrev, saidasPrev: saiPrev };
}

function serieDoAno(E, ano, atual) {
  var out = [];
  for (var i = 1; i <= 12; i++) out.push(pontoDoMes(E, ano + '-' + pad2(i), atual));
  return out;
}

function proximosMeses(E, n, atual) {
  var out = [];
  for (var i = 0; i < n; i++) out.push(pontoDoMes(E, somarMes(atual, i), atual));
  return out;
}

function anosComDados(E, atual) {
  var s = {};
  E.receber.forEach(function (r) { [r.vencimento, r.recebido_em].forEach(function (d) { if (d) s[d.slice(0, 4)] = 1; }); });
  E.pagar.forEach(function (p) { [p.vencimento, p.pago_em].forEach(function (d) { if (d) s[d.slice(0, 4)] = 1; }); });
  s[atual.slice(0, 4)] = 1;
  return Object.keys(s).map(Number).sort();
}

function totaisPorAno(E, atual) {
  return anosComDados(E, atual).map(function (ano) {
    var rec = E.receber.filter(function (r) { return r.status === 'recebido' && noAno(r.recebido_em, ano); });
    var pag = E.pagar.filter(function (p) { return p.status === 'pago' && noAno(p.pago_em, ano); });
    var meses = {};
    rec.forEach(function (r) { meses[r.recebido_em.slice(0, 7)] = 1; });
    pag.forEach(function (p) { meses[p.pago_em.slice(0, 7)] = 1; });
    var ent = soma(rec), sai = soma(pag);
    return { ano: ano, entradas: ent, saidas: sai, resultado: ent - sai, meses: Object.keys(meses).length };
  });
}

/** Despesas pagas no ano, por grupo e por categoria (maior primeiro). */
function despesasDoAno(E, ano) {
  var g = {}, c = {};
  E.pagar.forEach(function (p) {
    if (p.status !== 'pago' || !noAno(p.pago_em, ano)) return;
    var kg = p.categoria_grupo || '', kc = p.categoria_id || '';
    g[kg] = g[kg] || { grupo: p.categoria_grupo || null, total: 0 }; g[kg].total += p.valor;
    c[kc] = c[kc] || { nome: p.categoria_nome || null, total: 0 }; c[kc].total += p.valor;
  });
  var ord = function (o) { return Object.keys(o).map(function (k) { return o[k]; }).sort(function (a, b) { return b.total - a.total; }); };
  return { grupos: ord(g), categorias: ord(c) };
}

function receitaPorCliente(E, ano) {
  var c = {};
  E.receber.forEach(function (r) {
    if (r.status !== 'recebido' || !noAno(r.recebido_em, ano)) return;
    var k = r.cliente_id || '';
    c[k] = c[k] || { nome: r.cliente_nome || null, total: 0, qtd: 0 };
    c[k].total += r.valor; c[k].qtd++;
  });
  return Object.keys(c).map(function (k) { return c[k]; }).sort(function (a, b) { return b.total - a.total; });
}

/** Quanto faturar por mês para empatar: custo fixo (recorrentes ativas) + média das avulsas dos últimos 3 meses fechados. */
function pontoDeEquilibrio(E, atual) {
  var fixo = E.recorrentes.filter(function (r) { return r.ativo; }).reduce(function (s, r) { return s + Number(r.valor); }, 0);
  var ini = somarMes(atual, -3) + '-01', fim = atual + '-01';
  var dentro = function (d) { return !!d && d >= ini && d < fim; };
  var avulsas = E.pagar.filter(function (p) { return p.status === 'pago' && !p.recorrente_id && dentro(p.pago_em); });
  var pagas = E.pagar.filter(function (p) { return p.status === 'pago' && dentro(p.pago_em); });
  var rec = E.receber.filter(function (r) { return r.status === 'recebido' && dentro(r.recebido_em); });
  var meses = {};
  pagas.forEach(function (p) { meses[p.pago_em.slice(0, 7)] = 1; });
  rec.forEach(function (r) { meses[r.recebido_em.slice(0, 7)] = 1; });
  var n = Object.keys(meses).length, base = Math.max(n, 1);
  var variavelMedia = Math.round(soma(avulsas) / base), receitaMedia = Math.round(soma(rec) / base);
  return { fixo: fixo, variavelMedia: variavelMedia, necessario: fixo + variavelMedia, receitaMedia: receitaMedia, mesesBase: n };
}

// ------------------------------------------------------------ gráficos
function passoBonito(bruto) {
  var exp = Math.pow(10, Math.floor(Math.log10(bruto))), f = bruto / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

/** Escala "bonita" para o eixo: { ini, fim, ticks }. */
function escala(min, max, alvo) {
  if (max === min) max = min + 100000;
  var passo = passoBonito((max - min) / (alvo || 4));
  var ini = Math.floor(min / passo) * passo, fim = Math.ceil(max / passo) * passo, ticks = [];
  for (var t = ini; t <= fim + passo / 2; t += passo) ticks.push(Math.round(t));
  return { ini: ini, fim: fim, ticks: ticks };
}
