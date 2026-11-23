-- Excluir vídeo enviado (versão) e tarefa. Só no site: nada é apagado no Google Drive.

-- Editor: só a última versão e só enquanto está "para revisar". Dono: qualquer versão.
create or replace function public.excluir_versao(p_tarefa bigint, p_numero int)
returns void language plpgsql security definer set search_path to '' as $$
declare quem text := public.papel(); ultima int; st text; restantes int;
begin
  if quem is null then raise exception 'sem acesso'; end if;
  select status into st from public.tarefas where id = p_tarefa;
  if st is null then raise exception 'tarefa não encontrada'; end if;
  select max(numero) into ultima from public.versoes where tarefa_id = p_tarefa;
  if not exists (select 1 from public.versoes where tarefa_id = p_tarefa and numero = p_numero) then raise exception 'versão não encontrada'; end if;
  if quem = 'editor' and (p_numero <> ultima or st <> 'para_revisar') then raise exception 'o editor só exclui a última versão antes da revisão'; end if;
  delete from public.versoes where tarefa_id = p_tarefa and numero = p_numero;
  delete from public.comentarios where tarefa_id = p_tarefa and versao = p_numero;
  delete from public.eventos where tarefa_id = p_tarefa and tipo = 'versao' and versao = p_numero;
  if p_numero = ultima then
    select count(*) into restantes from public.versoes where tarefa_id = p_tarefa;
    update public.tarefas set status = case when restantes = 0 then 'em_edicao' else 'ajustes' end where id = p_tarefa;
  end if;
end; $$;

create or replace function public.excluir_tarefa(p_tarefa bigint)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if not public.eh_dono() then raise exception 'só o dono'; end if;
  delete from public.tarefas where id = p_tarefa; -- versões, comentários e eventos vão junto (cascade)
end; $$;

revoke all on function public.excluir_versao(bigint, int), public.excluir_tarefa(bigint) from public, anon;
grant execute on function public.excluir_versao(bigint, int), public.excluir_tarefa(bigint) to authenticated;
