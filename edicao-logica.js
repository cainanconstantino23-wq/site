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
