// Supabase do painel (projeto daime-prospeccao). Chave de serviço só aqui no servidor.
const URL_SB = process.env.SUPABASE_URL || 'https://prrqshhnhvehvyafitax.supabase.co';
const PUBLICA = process.env.SUPABASE_ANON_KEY || 'sb_publishable_25ymkT18mK9bmAnEo-t5gw_mzYqdUiT';

const servico = () => {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurado');
  return chave;
};

/** Chamada REST com a chave de serviço. `path` começa em /rest/v1/... */
export async function sb(path, init = {}) {
  const chave = servico();
  const resposta = await fetch(`${URL_SB}${path}`, {
    ...init,
    headers: { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
  });
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) throw new Error(`Supabase ${resposta.status}: ${texto.slice(0, 300)}`);
  return dados;
}

/** Quem está chamando: { id, email, papel: 'dono'|'editor' } ou null. */
export async function usuarioDaRequisicao(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const cab = { apikey: PUBLICA, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const usuario = await fetch(`${URL_SB}/auth/v1/user`, { headers: cab });
  if (!usuario.ok) return null;
  const { id, email } = await usuario.json();
  const papel = await fetch(`${URL_SB}/rest/v1/rpc/papel`, { method: 'POST', headers: cab, body: '{}' });
  const valor = papel.ok ? await papel.json() : null;
  if (valor !== 'dono' && valor !== 'editor') return null;
  let nome = valor === 'dono' ? 'Cainan' : 'Editor';
  if (valor === 'editor') {
    const linhas = await sb(`/rest/v1/editores?user_id=eq.${id}&select=nome`).catch(() => []);
    nome = linhas?.[0]?.nome || nome;
  }
  return { id, email, papel: valor, nome };
}
