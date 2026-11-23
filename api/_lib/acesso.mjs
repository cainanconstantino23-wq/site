// Quem chamou e se pode: atalho para as rotas.
import { usuarioDaRequisicao } from './supabase.mjs';
import { json } from './http.mjs';
import { DriveDesconectado, GoogleEditorDesconectado } from './google.mjs';

/** Devolve o usuário ou uma Response de erro (401/403). */
export async function exigir(request, papel) {
  const usuario = await usuarioDaRequisicao(request).catch(() => null);
  if (!usuario) return { erro: json({ erro: 'login' }, 401) };
  if (papel && usuario.papel !== papel) return { erro: json({ erro: 'sem_permissao' }, 403) };
  return { usuario };
}

/** Erros comuns do Drive viram respostas claras. */
export function falha(erro, contexto) {
  if (erro instanceof DriveDesconectado) return json({ erro: 'drive_desconectado' }, 409);
  if (erro instanceof GoogleEditorDesconectado) return json({ erro: 'google_editor' }, 409);
  console.error(contexto, erro);
  return json({ erro: 'falhou' }, 502);
}
