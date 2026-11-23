// Trava da pasta raiz: só arquivos e pastas dentro da pasta de trabalho escolhida pelo dono.

/** Sobe pelos "parents" (até `limite` níveis) procurando a raiz. `getParents(id)` devolve a lista de pais. */
export async function dentroDaRaiz(id, raizId, getParents, limite = 20) {
  if (!raizId || !id) return false;
  if (id === raizId) return true;
  const vistos = new Set([id]);
  let nivel = [id];
  for (let i = 0; i < limite && nivel.length; i++) {
    const pais = (await Promise.all(nivel.map((x) => getParents(x)))).flat();
    if (pais.includes(raizId)) return true;
    nivel = pais.filter((p) => !vistos.has(p) && vistos.add(p));
  }
  return false;
}
