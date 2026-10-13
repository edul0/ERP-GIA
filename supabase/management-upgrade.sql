-- Applied to ERP GIA on 2026-10-13. Private tables are only accessed by gia-api.
create policy "Backend only" on public.gia_users for all to anon, authenticated using(false) with check(false);
create policy "Backend only" on public.gia_sessions for all to anon, authenticated using(false) with check(false);
create policy "Backend only" on public.gia_workspaces for all to anon, authenticated using(false) with check(false);
create policy "Backend only" on public.gia_login_limits for all to anon, authenticated using(false) with check(false);
create index gia_sessions_user_id_idx on public.gia_sessions(user_id);
create table public.gia_workspace_history (
 workspace_id text not null references public.gia_workspaces(id),
 revision integer not null, data jsonb not null,
 saved_at timestamptz not null default now(), primary key(workspace_id,revision)
);
alter table public.gia_workspace_history enable row level security;
revoke all on public.gia_workspace_history from anon,authenticated;
grant all on public.gia_workspace_history to service_role;
create policy "Backend only" on public.gia_workspace_history for all to anon,authenticated using(false) with check(false);
create function public.gia_preserve_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.revision <> old.revision+1 then raise exception 'Invalid workspace revision'; end if;
 insert into public.gia_workspace_history(workspace_id,revision,data) values(old.id,old.revision,old.data) on conflict do nothing;
 return new;
end $$;
revoke execute on function public.gia_preserve_version() from public,anon,authenticated;
grant execute on function public.gia_preserve_version() to service_role;
create trigger gia_preserve_version before update on public.gia_workspaces for each row execute function public.gia_preserve_version();
alter table public.gia_workspaces add constraint gia_revision_positive check(revision>=1);
