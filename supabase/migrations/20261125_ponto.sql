-- Comentário marcado num ponto da imagem (clicar no vídeo, como no Krock). Rodar uma vez no SQL Editor do Supabase.
alter table public.comentarios
  add column if not exists pos_x numeric check (pos_x between 0 and 1),
  add column if not exists pos_y numeric check (pos_y between 0 and 1);

drop function if exists public.comentar(bigint, int, numeric, text);
create or replace function public.comentar(p_tarefa bigint, p_versao int, p_tempo numeric, p_texto text, p_x numeric default null, p_y numeric default null)
returns bigint language plpgsql security definer set search_path to '' as $$
declare novo bigint; quem text := public.papel(); ok boolean := p_x between 0 and 1 and p_y between 0 and 1;
begin
  if quem is null then raise exception 'sem acesso'; end if;
  insert into public.comentarios (tarefa_id, versao, tempo_seg, texto, autor, enviado, pos_x, pos_y)
    values (p_tarefa, p_versao, p_tempo, trim(p_texto), public.nome_atual(), quem = 'editor',
            case when ok then p_x end, case when ok then p_y end)
    returning id into novo;
  return novo;
end; $$;
revoke all on function public.comentar(bigint, int, numeric, text, numeric, numeric) from public, anon;
grant execute on function public.comentar(bigint, int, numeric, text, numeric, numeric) to authenticated;
