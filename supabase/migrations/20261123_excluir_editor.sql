-- O editor também pode excluir qualquer versão, a qualquer momento (igual ao dono). Excluir tarefa continua só do dono.
create or replace function public.excluir_versao(p_tarefa bigint, p_numero int)
returns void language plpgsql security definer set search_path to '' as $$
declare ultima int; st text; restantes int;
begin
  if public.papel() is null then raise exception 'sem acesso'; end if;
  select status into st from public.tarefas where id = p_tarefa;
  if st is null then raise exception 'tarefa não encontrada'; end if;
  select max(numero) into ultima from public.versoes where tarefa_id = p_tarefa;
  if not exists (select 1 from public.versoes where tarefa_id = p_tarefa and numero = p_numero) then raise exception 'versão não encontrada'; end if;
  delete from public.versoes where tarefa_id = p_tarefa and numero = p_numero;
  delete from public.comentarios where tarefa_id = p_tarefa and versao = p_numero;
  delete from public.eventos where tarefa_id = p_tarefa and tipo = 'versao' and versao = p_numero;
  if p_numero = ultima then
    select count(*) into restantes from public.versoes where tarefa_id = p_tarefa;
    update public.tarefas set status = case when restantes = 0 then 'em_edicao' else 'ajustes' end where id = p_tarefa;
  end if;
end; $$;
