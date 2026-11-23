-- Conta Google do editor (somente leitura), para baixar direto do Google no navegador dele.
-- Só o servidor lê (chave de serviço): RLS ligado e sem políticas, igual a drive_conexao.
create table if not exists public.drive_editor (
  user_id uuid primary key references auth.users on delete cascade,
  email text,
  refresh_token text not null,
  access_token text,
  expira_em timestamptz,
  atualizada_em timestamptz not null default now()
);
alter table public.drive_editor enable row level security;
