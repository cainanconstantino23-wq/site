-- Espaço de Edição (23/11/2026): editores, conexão do Drive, tarefas, versões, comentários e linha do tempo.
-- Dono = public.donos (como o painel). Editor = public.editores. Escritas sensíveis por funções security definer.

create table if not exists public.editores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default 'Editor',
  criado_em timestamptz not null default now()
);
alter table public.editores enable row level security;

create or replace function public.papel()
returns text language sql stable security definer set search_path to '' as $$
  select case
    when exists (select 1 from public.donos d where d.user_id = (select auth.uid())) then 'dono'
    when exists (select 1 from public.editores e where e.user_id = (select auth.uid())) then 'editor'
    else null end;
$$;

create or replace function public.eh_editor_ou_dono()
returns boolean language sql stable security definer set search_path to '' as $$
  select public.papel() is not null;
$$;

create or replace function public.nome_atual()
returns text language sql stable security definer set search_path to '' as $$
  select coalesce(
    (select e.nome from public.editores e where e.user_id = (select auth.uid())),
    case when exists (select 1 from public.donos d where d.user_id = (select auth.uid())) then 'Cainan' end,
    'Sistema');
$$;

-- editores: cada um vê a própria linha; o dono vê todos
create policy editores_ver on public.editores for select
  using (user_id = (select auth.uid()) or (select public.eh_dono()));

-- Conexão do Google Drive (linha única). Sem políticas: só a chave de serviço (funções da Vercel) lê e grava.
create table if not exists public.drive_conexao (
  id int primary key default 1 check (id = 1),
  email text,
  refresh_token text not null,
  access_token text,
  expira_em timestamptz,
  raiz_id text,
  raiz_nome text,
  atualizada_em timestamptz not null default now()
);
alter table public.drive_conexao enable row level security;

create table if not exists public.tarefas (
  id bigint generated always as identity primary key,
  casa_pasta_id text not null check (casa_pasta_id ~ '^[A-Za-z0-9_-]{10,200}$'),
  casa_nome text not null,
  tipo text not null default 'Reels' check (tipo in ('Reels', 'Pílula', 'Tour', 'Carrossel', 'Outro')),
  prazo date,
  instrucoes text not null default '',
  status text not null default 'a_fazer' check (status in ('a_fazer', 'em_edicao', 'para_revisar', 'ajustes', 'aprovado')),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
alter table public.tarefas enable row level security;

create table if not exists public.versoes (
  id bigint generated always as identity primary key,
  tarefa_id bigint not null references public.tarefas(id) on delete cascade,
  numero int not null,
  drive_file_id text not null,
  nome text not null,
  tamanho bigint,
  nota text not null default '',
  enviada_por text not null,
  enviada_em timestamptz not null default now(),
  unique (tarefa_id, numero)
);
alter table public.versoes enable row level security;

create table if not exists public.comentarios (
  id bigint generated always as identity primary key,
  tarefa_id bigint not null references public.tarefas(id) on delete cascade,
  versao int,
  tempo_seg numeric,
  texto text not null check (length(texto) between 1 and 4000),
  autor text not null,
  enviado boolean not null default false, -- false = rascunho do dono, ainda não mandado no pedido de ajustes
  criado_em timestamptz not null default now()
);
alter table public.comentarios enable row level security;

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  tarefa_id bigint not null references public.tarefas(id) on delete cascade,
  tipo text not null check (tipo in ('criada', 'comecou', 'versao', 'ajustes', 'aprovada')),
  versao int,
  autor text not null,
  texto text not null default '',
  criado_em timestamptz not null default now()
);
alter table public.eventos enable row level security;

create index if not exists versoes_tarefa on public.versoes (tarefa_id);
create index if not exists comentarios_tarefa on public.comentarios (tarefa_id);
create index if not exists eventos_tarefa on public.eventos (tarefa_id);

-- Leitura: dono e editor. Escrita direta: só o dono (tarefas). O resto passa pelas funções abaixo.
create policy tarefas_ver on public.tarefas for select using ((select public.eh_editor_ou_dono()));
create policy tarefas_dono on public.tarefas for all using ((select public.eh_dono())) with check ((select public.eh_dono()));
create policy versoes_ver on public.versoes for select using ((select public.eh_editor_ou_dono()));
create policy comentarios_ver on public.comentarios for select using ((select public.eh_editor_ou_dono()));
create policy eventos_ver on public.eventos for select using ((select public.eh_editor_ou_dono()));

create or replace function public.tarefa_tocar() returns trigger language plpgsql set search_path to '' as $$
begin new.atualizada_em := now(); return new; end; $$;
drop trigger if exists tarefa_tocar on public.tarefas;
create trigger tarefa_tocar before update on public.tarefas for each row execute function public.tarefa_tocar();

create or replace function public.tarefa_criada() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  insert into public.eventos (tarefa_id, tipo, autor, texto) values (new.id, 'criada', public.nome_atual(), new.instrucoes);
  return new;
end; $$;
drop trigger if exists tarefa_criada on public.tarefas;
create trigger tarefa_criada after insert on public.tarefas for each row execute function public.tarefa_criada();

-- Editor (ou dono) começa a editar
create or replace function public.comecar_edicao(p_tarefa bigint)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if public.papel() is null then raise exception 'sem acesso'; end if;
  update public.tarefas set status = 'em_edicao' where id = p_tarefa and status = 'a_fazer';
  if found then
    insert into public.eventos (tarefa_id, tipo, autor) values (p_tarefa, 'comecou', public.nome_atual());
  end if;
end; $$;

-- Dono comenta a versão (rascunho até pedir ajustes); editor pode responder (já enviado)
create or replace function public.comentar(p_tarefa bigint, p_versao int, p_tempo numeric, p_texto text)
returns bigint language plpgsql security definer set search_path to '' as $$
declare novo bigint; quem text := public.papel();
begin
  if quem is null then raise exception 'sem acesso'; end if;
  insert into public.comentarios (tarefa_id, versao, tempo_seg, texto, autor, enviado)
    values (p_tarefa, p_versao, p_tempo, trim(p_texto), public.nome_atual(), quem = 'editor')
    returning id into novo;
  return novo;
end; $$;

create or replace function public.apagar_rascunho(p_comentario bigint)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if not public.eh_dono() then raise exception 'só o dono'; end if;
  delete from public.comentarios where id = p_comentario and enviado = false;
end; $$;

-- Dono pede ajustes: manda os rascunhos da versão atual + texto geral
create or replace function public.pedir_ajustes(p_tarefa bigint, p_texto text)
returns void language plpgsql security definer set search_path to '' as $$
declare v int; n int;
begin
  if not public.eh_dono() then raise exception 'só o dono'; end if;
  select max(numero) into v from public.versoes where tarefa_id = p_tarefa;
  update public.comentarios set enviado = true where tarefa_id = p_tarefa and enviado = false;
  get diagnostics n = row_count;
  if n = 0 and coalesce(trim(p_texto), '') = '' then raise exception 'escreva o que precisa mudar'; end if;
  update public.tarefas set status = 'ajustes' where id = p_tarefa;
  insert into public.eventos (tarefa_id, tipo, versao, autor, texto) values (p_tarefa, 'ajustes', v, public.nome_atual(), coalesce(trim(p_texto), ''));
end; $$;

create or replace function public.aprovar_tarefa(p_tarefa bigint)
returns void language plpgsql security definer set search_path to '' as $$
declare v int;
begin
  if not public.eh_dono() then raise exception 'só o dono'; end if;
  select max(numero) into v from public.versoes where tarefa_id = p_tarefa;
  if v is null then raise exception 'ainda não há versão'; end if;
  update public.tarefas set status = 'aprovado' where id = p_tarefa;
  insert into public.eventos (tarefa_id, tipo, versao, autor) values (p_tarefa, 'aprovada', v, public.nome_atual());
end; $$;

revoke all on function public.comecar_edicao(bigint), public.comentar(bigint, int, numeric, text), public.apagar_rascunho(bigint),
  public.pedir_ajustes(bigint, text), public.aprovar_tarefa(bigint) from public, anon;
grant execute on function public.comecar_edicao(bigint), public.comentar(bigint, int, numeric, text), public.apagar_rascunho(bigint),
  public.pedir_ajustes(bigint, text), public.aprovar_tarefa(bigint), public.papel() to authenticated;
