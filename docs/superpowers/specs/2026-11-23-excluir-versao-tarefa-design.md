# Excluir vídeo enviado e tarefa (Edição) — design curto

Data: 23/11/2026 · Aprovado na conversa.

- **Por quê:** o editor às vezes manda o vídeo errado, e o dono precisa tirar tarefas criadas por engano.
- **Abordagens:** a única sensata é usar funções `security definer` no Supabase, iguais a `aprovar_tarefa`/`pedir_ajustes`, com botões na página. Passar pela API da Vercel não ajudaria, porque não há Drive envolvido.
- **Regra do Drive mantida:** nada é apagado no Drive. A versão e a tarefa somem só do site.
- **`excluir_versao(p_tarefa, p_numero)`**
  - O editor só exclui a **última** versão, e só com a tarefa em `para_revisar`. O dono exclui qualquer versão.
  - Apaga a versão, os comentários dela e o evento `versao` daquele número.
  - Se era a última versão: sem versões restantes, a tarefa vai para `em_edicao`; com versões restantes, vai para `ajustes`.
  - O próximo envio reaproveita o número.
- **`excluir_tarefa(p_tarefa)`:** só o dono. Apaga a tarefa, e as versões, comentários e eventos vão junto (cascade).
- **Interface:** "Excluir V{n}" na aba Vídeo, para a versão aberta, só quando `podeExcluirVersao` permite. "Excluir tarefa" no topo, só para o dono. As duas ações pedem `confirm()`.
- **Fica a critério de quem construir:** textos dos avisos.
