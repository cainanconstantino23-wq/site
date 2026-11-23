/* Lógica pura do espaço de Edição (sem dados, sem rede). Carregado pelo edicao.html e testado em tests/. */
var ETAPAS = [
  { id: 'a_fazer', nome: 'A fazer', dica: 'Tarefa criada' },
  { id: 'em_edicao', nome: 'Em edição', dica: 'O editor está trabalhando' },
  { id: 'para_revisar', nome: 'Para revisar', dica: '1ª versão enviada' },
  { id: 'ajustes', nome: 'Ajustes pedidos', dica: 'Voltou para o editor' },
  { id: 'reenviado', nome: 'Reenviado', dica: 'V2, V3… com os ajustes' },
  { id: 'aprovado', nome: 'Aprovado', dica: 'Vídeo pronto' }
];

/** Etapa na tela: "para revisar" com mais de uma versão = reenviado. */
function etapaDe(status, nVersoes) {
  if (status === 'para_revisar' && nVersoes > 1) return 'reenviado';
  return status;
}

/** Caminho percorrido pela tarefa, a partir dos eventos em ordem. */
function caminhoTarefa(eventos) {
  var caminho = ['a_fazer'];
  (eventos || []).forEach(function (e) {
    if (e.tipo === 'comecou') caminho.push('em_edicao');
    else if (e.tipo === 'versao') caminho.push(e.versao > 1 ? 'reenviado' : 'para_revisar');
    else if (e.tipo === 'ajustes') caminho.push('ajustes');
    else if (e.tipo === 'aprovada') caminho.push('aprovado');
  });
  return caminho;
}

/** Segundos → "02:14" (ou "1:02:05" acima de uma hora). */
function timecode(seg) {
  if (seg === null || seg === undefined || isNaN(seg)) return '';
  var t = Math.floor(Number(seg));
  var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  var dois = function (n) { return (n < 10 ? '0' : '') + n; };
  return h ? h + ':' + dois(m) + ':' + dois(s) : dois(m) + ':' + dois(s);
}

function semAcento(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Pasta de entrega da casa: "06 Saída" (com ou sem acento, zero opcional). */
function ehPastaSaida(nome) {
  return /^0?6 saida$/.test(semAcento(nome));
}

function tamanhoLegivel(bytes) {
  if (bytes === null || bytes === undefined || bytes === '') return '';
  var n = Number(bytes), unidades = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
  while (n >= 1024 && i < unidades.length - 1) { n /= 1024; i++; }
  var texto = i === 0 ? String(n) : (n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace('.', ','));
  return texto + ' ' + unidades[i];
}

/** Prazo "AAAA-MM-DD" comparado com hoje ("AAAA-MM-DD"). */
function prazoInfo(prazo, hoje) {
  if (!prazo) return null;
  var dm = prazo.slice(8, 10) + '/' + prazo.slice(5, 7);
  if (prazo === hoje) return { texto: 'hoje', atrasado: false };
  return prazo < hoje ? { texto: 'venceu ' + dm, atrasado: true } : { texto: 'até ' + dm, atrasado: false };
}

/**
 * "Subir casa": a partir dos arquivos da pasta escolhida no computador (caminho relativo "CASA/01 Brutas/A001.MP4"),
 * devolve o nome da casa, as subpastas a criar (pais antes dos filhos) e os arquivos com a pasta de destino.
 * Ignora ocultos do Mac e de sistema (qualquer parte do caminho começando com ".").
 */
function planoDaCasa(entradas) {
  var casa = '', pastas = {}, arquivos = [], total = 0;
  (entradas || []).forEach(function (e) {
    var partes = String(e.caminho || '').split('/').filter(Boolean);
    if (partes.length < 2) return;
    if (!casa) casa = partes[0];
    if (partes.some(function (p) { return p.charAt(0) === '.'; })) return;
    var dirs = partes.slice(1, -1);
    for (var i = 1; i <= dirs.length; i++) pastas[dirs.slice(0, i).join('/')] = true;
    arquivos.push({ pasta: dirs.join('/'), nome: partes[partes.length - 1], tamanho: Number(e.tamanho) || 0, arquivo: e.arquivo });
    total += Number(e.tamanho) || 0;
  });
  if (!casa && entradas && entradas[0]) casa = String(entradas[0].caminho || '').split('/')[0];
  return { casa: casa, pastas: Object.keys(pastas).sort(), arquivos: arquivos, total: total };
}

/** O arquivo já está no Drive (mesmo nome e tamanho)? */
function jaNoDrive(arquivo, itens) {
  return (itens || []).some(function (i) { return i.tipo !== 'pasta' && i.nome === arquivo.nome && Number(i.tamanho) === Number(arquivo.tamanho); });
}

// ------------------------------------------------------------ transferências (envio e download)

/** Nome aceito pelo Windows: troca os proibidos por "_", tira ponto/espaço do fim, evita nomes reservados. */
function nomeWindows(nome) {
  var n = String(nome || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '');
  if (!n) return '_';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(n)) n = '_' + n;
  return n;
}

/** Nomes do Windows sem repetição na mesma pasta (o Windows não diferencia maiúsculas): "a (2).mp4". */
function nomesUnicos(nomes) {
  var vistos = {};
  return nomes.map(function (original) {
    var n = nomeWindows(original), chave = n.toLowerCase();
    if (!vistos[chave]) { vistos[chave] = 1; return n; }
    var ponto = n.lastIndexOf('.'), base = ponto > 0 ? n.slice(0, ponto) : n, ext = ponto > 0 ? n.slice(ponto) : '';
    var k = vistos[chave], candidato;
    do { k++; candidato = base + ' (' + k + ')' + ext; } while (vistos[candidato.toLowerCase()]);
    vistos[chave] = k; vistos[candidato.toLowerCase()] = 1;
    return candidato;
  });
}

/** O que fazer com um arquivo que talvez já exista no disco (tamanhoLocal null = não existe).
 *  Mesmo tamanho = já baixado. Qualquer outro caso baixa do zero: um arquivo menor no disco pode ser outro
 *  arquivo com o mesmo nome, e completar ele corromperia o vídeo. (Se a internet cair no meio, o download
 *  continua do byte em que parou dentro da mesma sessão, em gravar().) */
function planoRetomada(tamanhoLocal, tamanhoDrive) {
  if (tamanhoDrive != null && tamanhoLocal === tamanhoDrive) return { acao: 'pular', inicio: tamanhoDrive };
  return { acao: 'do_zero', inicio: 0 };
}

/** Vale tentar de novo depois deste erro? Conta Google desconectada e erros finais não insistem. */
function deveRepetir(err, tentativas) {
  if (err && (err.final || err.codigo === 'google_editor')) return false;
  return tentativas <= 5;
}

/** Cabeçalho Range do Google ("bytes=0-999") → próximo byte a enviar. */
function inicioDoRange(cabecalho) {
  var m = /bytes=\d+-(\d+)/.exec(cabecalho || '');
  return m ? Number(m[1]) + 1 : 0;
}

/** Token guardado ainda vale por mais de 5 minutos? */
function tokenValido(guardado, agora) {
  return Boolean(guardado && guardado.token && Date.parse(guardado.expira_em) - agora > 5 * 60000);
}

/** Espera antes da tentativa n (1..5): 1 s, 2 s, 4 s, 8 s, 16 s. */
function esperaTentativa(n) { return 1000 * Math.pow(2, n - 1); }

/** Docs, Planilhas etc. (não são arquivos para baixar). Pasta não conta. */
function ehNativoGoogle(mime) {
  return /^application\/vnd\.google-apps\./.test(mime || '') && mime !== 'application/vnd.google-apps.folder';
}

/** Mesmo critério de excluir_versao no Supabase: editor só a última antes da revisão; dono qualquer uma. */
function podeExcluirVersao(papel, status, numero, ultima) {
  if (papel === 'dono') return true;
  return papel === 'editor' && status === 'para_revisar' && numero === ultima;
}

/** Lista do que foi para o Drive em "Subir casa": caminho dentro da casa, em ordem, com o estado
 *  ('subiu' | 'pulado' = já estava lá | 'falhou'). */
function linhasSubida(arquivos) {
  return (arquivos || []).map(function (a) {
    return { rotulo: (a.pasta ? a.pasta + '/' : '') + a.nome, tamanho: a.tamanho, estado: a.estado || 'subiu' };
  }).sort(function (x, y) { return x.rotulo.localeCompare(y.rotulo, 'pt', { numeric: true }); });
}

// ------------------------------------------------------------ painel de transferências (velocidade, tempo restante)

/** Guarda {t, b} (ms, bytes) dos últimos 5 s, no máximo uma a cada 250 ms. Se o progresso voltar, recomeça. */
function amostrar(amostras, t, b) {
  var a = amostras || [], ultima = a[a.length - 1];
  if (ultima && b < ultima.b) return [{ t: t, b: b }];
  if (ultima && t - ultima.t < 250) return a;
  return a.concat([{ t: t, b: b }]).filter(function (x) { return x.t >= t - 5000; });
}

/** Bytes por segundo entre a primeira e a última amostra. */
function velocidade(amostras) {
  if (!amostras || amostras.length < 2) return 0;
  var i = amostras[0], f = amostras[amostras.length - 1];
  return f.t > i.t ? (f.b - i.b) / (f.t - i.t) * 1000 : 0;
}

/** Segundos → "8 s", "2 min 5 s", "1 h 3 min". */
function tempoLegivel(seg) {
  var s = Math.max(1, Math.ceil(seg));
  if (s < 60) return s + ' s';
  if (s < 3600) return Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '');
  return Math.floor(s / 3600) + ' h' + (Math.floor(s % 3600 / 60) ? ' ' + Math.floor(s % 3600 / 60) + ' min' : '');
}

/** "17,3 MB de 67,3 MB (25%, 6,4 MB/s, 8 s restantes)" */
function textoProgresso(feito, total, bps) {
  var pct = total > 0 ? Math.floor(feito / total * 100) : 100;
  var extra = bps > 0 && total > feito ? ', ' + tamanhoLegivel(bps) + '/s, ' + tempoLegivel((total - feito) / bps) + ' restantes' : '';
  return tamanhoLegivel(feito) + ' de ' + tamanhoLegivel(total) + ' (' + pct + '%' + extra + ')';
}
