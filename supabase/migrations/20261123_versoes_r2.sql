-- Vídeos de aprovação no Cloudflare R2 (não vão mais para o Drive). Somem 1 mês depois da aprovação.
alter table public.versoes alter column drive_file_id drop not null;
alter table public.versoes add column if not exists r2_key text;
alter table public.versoes add column if not exists video_removido_em timestamptz;
alter table public.versoes drop constraint if exists versoes_tem_video;
alter table public.versoes add constraint versoes_tem_video check (drive_file_id is not null or r2_key is not null);
