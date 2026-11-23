// Atalho do Cyberduck (.duck) para abrir uma pasta do Drive direto nele.
// O Cyberduck mostra o Drive com três pastas de topo: "My Drive", "Shared with me" e "Shared Drives".

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Sobe pelos pais até a raiz do Meu Drive (raizId) ou até onde a conta perde o acesso (compartilhado).
 *  get(id) → { name, parents } ou null. Devolve { raiz: 'meu'|'compartilhado', nomes: [topo…pasta] } ou null. */
export async function cadeiaDePastas(id, get, raizId) {
  const nomes = [];
  let atual = await get(id);
  if (!atual) return null;
  for (let i = 0; i < 40; i++) {
    nomes.unshift(atual.name);
    const pai = atual.parents?.[0];
    if (!pai) return { raiz: 'compartilhado', nomes };
    if (pai === raizId) return { raiz: 'meu', nomes };
    const acima = await get(pai);
    if (!acima) return { raiz: 'compartilhado', nomes };
    atual = acima;
  }
  return { raiz: 'compartilhado', nomes };
}

export function caminhoCyberduck({ raiz, nomes }) {
  return '/' + [raiz === 'meu' ? 'My Drive' : 'Shared with me', ...nomes].join('/');
}

export function duckPlist({ apelido, email, caminho, uuid }) {
  const par = (k, v) => `\t<key>${k}</key>\n\t<string>${esc(v)}</string>\n`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n'
    + par('Protocol', 'googledrive') + par('Provider', 'iterate GmbH') + par('Nickname', apelido) + par('UUID', uuid)
    + par('Hostname', 'www.googleapis.com') + par('Port', '443') + (email ? par('Username', email) : '') + par('Path', caminho)
    + '</dict>\n</plist>\n';
}
