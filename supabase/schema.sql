create extension if not exists pgcrypto with schema extensions;
create table public.gia_users (id text primary key, username text not null, password_hash text not null, role text not null check(role in ('admin','user','finance','viewer','mechanic')), disabled boolean not null default false);
create unique index gia_users_username on public.gia_users(lower(username));
create table public.gia_sessions (token_hash text primary key, user_id text not null references public.gia_users(id), expires_at timestamptz not null);
create index gia_sessions_expiry on public.gia_sessions(expires_at);
create table public.gia_workspaces (id text primary key, data jsonb not null, revision integer not null default 0, updated_at timestamptz not null default now());
create table public.gia_login_limits (key text primary key, attempts integer not null default 1, window_start timestamptz not null default now());
alter table public.gia_users enable row level security;
alter table public.gia_sessions enable row level security;
alter table public.gia_workspaces enable row level security;
alter table public.gia_login_limits enable row level security;
revoke all on public.gia_users, public.gia_sessions, public.gia_workspaces, public.gia_login_limits from anon, authenticated;
grant all on public.gia_users, public.gia_sessions, public.gia_workspaces, public.gia_login_limits to service_role;
create function public.gia_check_password(p_username text,p_password text) returns table(id text,username text,role text)
language sql security invoker set search_path='' as $$
select u.id,u.username,u.role from public.gia_users u where lower(u.username)=lower(p_username) and not u.disabled and u.password_hash=extensions.crypt(p_password,u.password_hash);
$$;
revoke all on function public.gia_check_password(text,text) from public,anon,authenticated;
grant execute on function public.gia_check_password(text,text) to service_role;
create function public.gia_rate_limit(p_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.gia_login_limits(key) values(p_key) on conflict(key) do update set attempts=case when gia_login_limits.window_start < now()-interval '15 minutes' then 1 else gia_login_limits.attempts+1 end, window_start=case when gia_login_limits.window_start < now()-interval '15 minutes' then now() else gia_login_limits.window_start end returning attempts into n;
 return n<=15;
end $$;
revoke all on function public.gia_rate_limit(text) from public,anon,authenticated;
grant execute on function public.gia_rate_limit(text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('gia-attachments','gia-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
