begin;

-- Reject new non-student registrations at the database boundary as well as in the form.
create or replace function orbit_private.new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare h text := lower(new.raw_user_meta_data->>'handle');
begin
  if not (select registration_open from orbit_private.pilot_settings where singleton) then
    raise exception 'Pilot registration is not open yet.' using errcode='42501';
  end if;
  if lower(split_part(new.email,'@',2)) is distinct from 'mynwu.ac.za' then
    raise exception 'Use your NWU student mailbox for this pilot.' using errcode='42501';
  end if;
  if h is null or h !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Choose a private username.'; end if;
  insert into public.orbit_profiles(id,handle,display_name) values(new.id,h,h);
  return new;
end;
$$;

create function public.orbit_prepare_account_deletion(p_actor uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('delete-account:'||p_actor::text,0));
  if not exists(select 1 from auth.users where id=p_actor) then return '{"ok":true}'; end if;
  insert into orbit_private.deletion_jobs(actor) values(p_actor) on conflict do nothing;
  update orbit_private.student_memberships set deleted_at=coalesce(deleted_at,now()) where actor=p_actor;
  -- Remove parent pointers before deleting an author's replies or complete discussions.
  update public.orbit_comments set parent=null where parent in (
    select c.id from public.orbit_comments c where c.author=p_actor or c.post in (
      select p.id from public.orbit_posts p where p.author=p_actor));
  delete from public.orbit_comments where author=p_actor or post in (
    select id from public.orbit_posts where author=p_actor);
  delete from public.orbit_posts where author=p_actor;
  -- Keep other students' circle posts available in their campus feed.
  update public.orbit_posts set circle=null where circle in(select id from public.orbit_circles where owner=p_actor);
  delete from public.orbit_circles where owner=p_actor;
  delete from public.orbit_connections where sender=p_actor or recipient=p_actor;
  delete from public.orbit_messages where sender=p_actor or recipient=p_actor;
  delete from public.orbit_games where low_actor=p_actor or high_actor=p_actor;
  delete from public.orbit_notifications where actor=p_actor or sender=p_actor;
  delete from public.orbit_reports where reporter=p_actor or target=p_actor;
  delete from public.orbit_profiles where id=p_actor;
  update public.orbit_posts p set reply_count=(select count(*) from public.orbit_comments c where c.post=p.id and not c.deleted);
  update public.orbit_posts p set upvotes=(select count(*) from public.orbit_votes v where v.post=p.id);
  update public.orbit_comments c set upvotes=(select count(*) from public.orbit_comment_votes v where v.comment=c.id and v.value=1);
  return '{"ok":true}';
end;
$$;

create function public.orbit_complete_account_deletion(p_actor uuid) returns void
language sql security definer set search_path='' as $$
  update orbit_private.deletion_jobs set completed_at=now() where actor=p_actor;
$$;
revoke all on function public.orbit_prepare_account_deletion(uuid),public.orbit_complete_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.orbit_prepare_account_deletion(uuid),public.orbit_complete_account_deletion(uuid) to service_role;

commit;
