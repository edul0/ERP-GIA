alter table public.gia_workspaces add column if not exists updated_by text;
create table public.gia_audit (
 id bigint generated always as identity primary key,
 workspace_id text not null, revision integer not null,
 actor_id text, actor_name text not null, entity text not null, entity_id text not null,
 action text not null, label text not null, occurred_at timestamptz not null default now()
);
create index gia_audit_workspace_time on public.gia_audit(workspace_id,occurred_at desc);
alter table public.gia_audit enable row level security;
revoke all on public.gia_audit from anon,authenticated;
grant all on public.gia_audit to service_role;
grant usage,select on sequence public.gia_audit_id_seq to service_role;
create table public.gia_editing (
 workspace_id text not null, record_id text not null, user_id text not null references public.gia_users(id),
 expires_at timestamptz not null, primary key(workspace_id,record_id)
);
alter table public.gia_editing enable row level security;
revoke all on public.gia_editing from anon,authenticated;
grant all on public.gia_editing to service_role;
create or replace function public.gia_claim_edit(p_workspace text,p_record text,p_user text) returns boolean
language plpgsql set search_path='' as $$
declare claimed text;
begin
 insert into public.gia_editing(workspace_id,record_id,user_id,expires_at)
 values(p_workspace,p_record,p_user,now()+interval '2 minutes')
 on conflict(workspace_id,record_id) do update set user_id=excluded.user_id,expires_at=excluded.expires_at
 where public.gia_editing.expires_at<now() or public.gia_editing.user_id=p_user
 returning user_id into claimed;
 return claimed is not null;
end $$;
revoke all on function public.gia_claim_edit(text,text,text) from public,anon,authenticated;
grant execute on function public.gia_claim_edit(text,text,text) to service_role;
create or replace function public.gia_preserve_version() returns trigger language plpgsql security invoker set search_path='' as $$
declare category text; before_record jsonb; after_record jsonb; record_key text; actor text;
begin
 if new.revision <> old.revision+1 then raise exception 'Invalid workspace revision'; end if;
 select username into actor from public.gia_users where id=new.updated_by;
 foreach category in array array['expenses','drivers','trucks','maintenance','trackingData'] loop
  for record_key in select distinct value->>'id' from (
   select value from jsonb_array_elements(coalesce(old.data->category,'[]'::jsonb))
   union all select value from jsonb_array_elements(coalesce(new.data->category,'[]'::jsonb))
  ) records where value->>'id' is not null loop
   select value into before_record from jsonb_array_elements(coalesce(old.data->category,'[]'::jsonb)) where value->>'id'=record_key;
   select value into after_record from jsonb_array_elements(coalesce(new.data->category,'[]'::jsonb)) where value->>'id'=record_key;
   if before_record is distinct from after_record then
    if category='expenses' and exists(select 1 from public.gia_editing where workspace_id=old.id and record_id=record_key and user_id<>new.updated_by and expires_at>now()) then raise exception 'Record being edited' using errcode='P0002'; end if;
    insert into public.gia_audit(workspace_id,revision,actor_id,actor_name,entity,entity_id,action,label)
    values(old.id,new.revision,new.updated_by,coalesce(actor,'Sistema'),category,record_key,
      case when before_record is null then 'created' when after_record is null then 'deleted' else 'updated' end,
      left(coalesce(after_record->>'invoice',before_record->>'invoice',after_record->>'plate',before_record->>'plate',after_record->>'name',before_record->>'name',after_record->>'description',before_record->>'description',record_key),160));
   end if;
  end loop;
 end loop;
 insert into public.gia_workspace_history(workspace_id,revision,data) values(old.id,old.revision,old.data) on conflict do nothing;
 return new;
end $$;
create policy "Backend only" on public.gia_audit for all to anon,authenticated using(false) with check(false);
create policy "Backend only" on public.gia_editing for all to anon,authenticated using(false) with check(false);
