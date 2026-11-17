-- Synthetic database-only fixtures. All records and settings roll back.
begin;
update orbit_private.pilot_settings set registration_open=true where singleton;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','orbit_test_one@mynwu.ac.za',now(),'{"handle":"fixture_one"}'),
 ('10000000-0000-4000-8000-000000000002','orbit_test_two@mynwu.ac.za',now(),'{"handle":"fixture_two"}'),
 ('10000000-0000-4000-8000-000000000003','orbit_test_mod@mynwu.ac.za',now(),'{"handle":"fixture_mod"}');
insert into orbit_private.moderators(actor) values('10000000-0000-4000-8000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$begin
  begin
    perform public.orbit_api('/feed','GET','{}');
    raise exception 'Unenrolled account read the feed';
  exception when insufficient_privilege then null; end;
  perform public.orbit_api('/student/enrol','POST','{"adult":true,"student":true,"policy":"2026-11-17"}');
end;$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select public.orbit_api('/student/enrol','POST','{"adult":true,"student":true,"policy":"2026-11-17"}');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select public.orbit_api('/student/enrol','POST','{"adult":true,"student":true,"policy":"2026-11-17"}');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$declare p bigint;c bigint;begin
  p := (public.orbit_api('/posts','POST','{"title":"Fictional confession","text":"A synthetic experience.","anonymous":true,"category":"Confessions"}')->>'id')::bigint;
  c := (public.orbit_api('/posts/'||p||'/comments','POST','{"text":"An update from OP."}')->>'id')::bigint;
  perform set_config('orbit.test_post',p::text,true);
  perform set_config('orbit.test_comment',c::text,true);
end;$$;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$declare p bigint:=current_setting('orbit.test_post')::bigint;r jsonb;begin
  r := public.orbit_api('/posts/'||p,'GET','{}');
  if r->>'handle' is not null or r->>'author' is not null or r->>'displayName'<>'Anonymous OP'
    or r::text like '%fixture_one%' or r::text like '%10000000-0000-4000-8000-000000000001%' then
    raise exception 'Anonymous post or preview exposed its author';
  end if;
  r := public.orbit_api('/posts/'||p||'/comments','GET','{}');
  if r::text like '%fixture_one%' or r::text like '%10000000-0000-4000-8000-000000000001%' then raise exception 'OP comment exposed author'; end if;
  r := public.orbit_api('/feed','GET','{"author":"10000000-0000-4000-8000-000000000001"}');
  if jsonb_array_length(r->'items')<>0 then raise exception 'Anonymous post appeared on public profile'; end if;
  r := public.orbit_api('/feed','GET','{"category":"Academic questions"}');
  if jsonb_array_length(r->'items')<>0 then raise exception 'Category filter failed'; end if;
  begin perform * from public.orbit_posts; raise exception 'Raw post table was readable'; exception when insufficient_privilege then null;end;
  begin perform orbit_private.api_v115('/feed','GET','{}');raise exception 'Legacy gateway was callable';exception when insufficient_privilege then null;end;
  begin perform public.orbit_prepare_account_deletion('10000000-0000-4000-8000-000000000001');raise exception 'Client deleted another account';exception when insufficient_privilege then null;end;
  perform public.orbit_api('/posts/'||p||'/report','POST','{"reason":"Personal information","details":"Synthetic report"}');
  perform public.orbit_api('/reports','POST','{"target":"fixture_one","reason":"Threats","details":"Synthetic account report"}');
  begin perform public.orbit_api('/student/moderation','GET','{}');raise exception 'Member accessed moderator queue';exception when insufficient_privilege then null;end;
end;$$;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
do $$declare p bigint:=current_setting('orbit.test_post')::bigint;r jsonb;begin
  r:=public.orbit_api('/student/moderation','GET','{}');
  if jsonb_array_length(r->'reports')<>2 then raise exception 'Account/content report queue incomplete'; end if;
  perform public.orbit_api('/student/moderation','POST',jsonb_build_object('action','remove','kind','post','target',p,'reason','Synthetic review'));
end;$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$begin
  begin perform public.orbit_api('/posts/'||current_setting('orbit.test_post'),'GET','{}');raise exception 'Hidden post remained readable';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select public.orbit_api('/student/moderation','POST',jsonb_build_object('action','restore','kind','post','target',current_setting('orbit.test_post'),'reason','Synthetic restoration'));
select public.orbit_api('/student/moderation','POST','{"action":"restrict","target":"10000000-0000-4000-8000-000000000002","reason":"Synthetic restriction"}');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$begin
  begin perform public.orbit_api('/posts/'||current_setting('orbit.test_post')||'/comments','POST','{"text":"Restricted reply"}');raise exception 'Restricted account posted';exception when insufficient_privilege then null;end;
  perform public.orbit_api('/student/appeal','POST','{"text":"Please review this synthetic restriction."}');
end;$$;
reset role;
select public.orbit_prepare_account_deletion('10000000-0000-4000-8000-000000000001');
select public.orbit_prepare_account_deletion('10000000-0000-4000-8000-000000000001');
do $$begin
  if exists(select 1 from public.orbit_profiles where id='10000000-0000-4000-8000-000000000001') then raise exception 'Deletion retained profile'; end if;
  if not exists(select 1 from public.orbit_profiles where id='10000000-0000-4000-8000-000000000002') then raise exception 'Deletion affected another profile'; end if;
end;$$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$begin
  begin perform public.orbit_api('/feed','GET','{}');raise exception 'Guest read student feed';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
