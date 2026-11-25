-- Revisão no estilo Krock: responder e resolver comentários, mudar a etapa à mão e link de revisão para o cliente.
-- Rodar uma vez no SQL Editor do Supabase.

-- 1. Comentários: respostas, resolvido e comentários do cliente (link sem login)
alter table public.comentarios
  add column if not exists resposta_a bigint references public.comentarios(id) on delete cascade,
  add column if not exists resolvido boolean not null default false,
  add column if not exists resolvido_por text,
  add column if not exists convidado boolean not null default false;
create index if not exists comentarios_resposta on public.comentarios (resposta_a);

-- Resposta herda versão e minuto do comentário original.
-- Resposta do editor já vai; resposta do dono segue o original (rascunho se o original for rascunho).
create or replace function public.responder(p_comentario bigint, p_texto text)
returns bigint language plpgsql security definer set search_path to '' as $$
declare novo bigint; quem text := public.papel(); pai public.comentarios;
begin
  if quem is null then raise exception 'sem acesso'; end if;
  select * into pai from public.comentarios where id = p_comentario;
  if pai.id is null then raise exception 'comentário não encontrado'; end if;
  insert into public.comentarios (tarefa_id, versao, tempo_seg, texto, autor, enviado, resposta_a)
    values (pai.tarefa_id, pai.versao, pai.tempo_seg, trim(p_texto), public.nome_atual(), quem = 'editor' or pai.enviado, pai.id)
    returning id into novo;
  return novo;
end; $$;

create or replace function public.resolver_comentario(p_comentario bigint, p_resolvido boolean)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if public.papel() is null then raise exception 'sem acesso'; end if;
  update public.comentarios set resolvido = p_resolvido, resolvido_por = case when p_resolvido then public.nome_atual() end
    where id = p_comentario;
end; $$;

-- 2. Etapa à mão (só o dono). "Aprovado" continua pelo aprovar_tarefa (a limpeza do R2 conta da aprovação).
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check check (tipo in ('criada', 'comecou', 'versao', 'ajustes', 'aprovada', 'status'));

create or replace function public.mudar_status(p_tarefa bigint, p_status text)
returns void language plpgsql security definer set search_path to '' as $$
declare v int;
begin
  if not public.eh_dono() then raise exception 'só o dono'; end if;
  if p_status not in ('a_fazer', 'em_edicao', 'para_revisar', 'ajustes') then raise exception 'etapa inválida'; end if;
  select max(numero) into v from public.versoes where tarefa_id = p_tarefa;
  if v is null and p_status in ('para_revisar', 'ajustes') then raise exception 'ainda não há versão'; end if;
  update public.tarefas set status = p_status where id = p_tarefa;
  insert into public.eventos (tarefa_id, tipo, versao, autor, texto) values (p_tarefa, 'status', v, public.nome_atual(), p_status);
end; $$;

revoke all on function public.responder(bigint, text), public.resolver_comentario(bigint, boolean), public.mudar_status(bigint, text) from public, anon;
grant execute on function public.responder(bigint, text), public.resolver_comentario(bigint, boolean), public.mudar_status(bigint, text) to authenticated;

-- 3. Links de revisão para o cliente (sem login, com validade). O servidor lê com a chave de serviço.
create table if not exists public.links_revisao (
  token text primary key default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  tarefa_id bigint not null references public.tarefas(id) on delete cascade,
  expira_em timestamptz not null,
  criado_por text not null default 'Cainan',
  criado_em timestamptz not null default now()
);
alter table public.links_revisao enable row level security;
drop policy if exists links_dono on public.links_revisao;
create policy links_dono on public.links_revisao for all using ((select public.eh_dono())) with check ((select public.eh_dono()));
create index if not exists links_tarefa on public.links_revisao (tarefa_id);
