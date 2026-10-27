begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','orbit-qa-naledi@example.invalid',now(),'{"handle":"qa_naledi","displayName":"QA Naledi"}'),
('22222222-2222-4222-8222-222222222222','orbit-qa-sipho@example.invalid',now(),'{"handle":"qa_sipho","displayName":"QA Sipho"}'),
('33333333-3333-4333-8333-333333333333','orbit-qa-ayesha@example.invalid',now(),'{"handle":"qa_ayesha","displayName":"QA Ayesha"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","user_metadata":{"admin":true}}',true);
do $$declare r jsonb;begin
 r:=public.orbit_api('/posts','POST','{"title":"QA shared post","text":"Transactional fixture","actor":"22222222-2222-4222-8222-222222222222"}');perform set_config('orbit.qa_post',r->>'id',true);
 if not exists(select 1 from public.orbit_posts where id=(r->>'id')::bigint and author=auth.uid()) then raise exception 'Actor spoofing accepted';end if;
 begin perform public.orbit_api('/reports');raise exception 'Metadata gave moderator privileges';exception when insufficient_privilege then null;end;
 begin insert into public.orbit_games(low_actor,high_actor,game,status)values('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','{}','active');raise exception 'Direct game write allowed';exception when insufficient_privilege then null;end;
 r:=public.orbit_api('/circles','POST','{"title":"QA private circle","description":"Private fixture","private":true}');perform set_config('orbit.qa_circle',r->>'id',true);
 perform public.orbit_api('/posts','POST',jsonb_build_object('title','QA private post','text','Private fixture','circle',(r->>'id')::bigint));
 perform public.orbit_api('/people/qa_sipho/connection','POST','{"action":"request"}');
end;$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$declare r jsonb;begin
 begin perform public.orbit_api('/posts/'||current_setting('orbit.qa_post'),'POST','{"title":"Stolen","text":"No"}');raise exception 'Ownership bypass';exception when insufficient_privilege then null;end;
 if jsonb_array_length(public.orbit_api('/feed')->'items')<>1 then raise exception 'Private post leaked';end if;
 begin perform public.orbit_api('/feed','GET',jsonb_build_object('circle',current_setting('orbit.qa_circle')));raise exception 'Private circle leaked';exception when insufficient_privilege then null;end;
 perform public.orbit_api('/circles/'||current_setting('orbit.qa_circle')||'/join','POST','{}');
 perform public.orbit_api('/people/qa_naledi/connection','POST','{"action":"accept"}');
 perform public.orbit_api('/messages/qa_naledi','POST','{"text":"Private fixture message"}');
 perform public.orbit_api('/posts/'||current_setting('orbit.qa_post')||'/vote','POST','{}');
 r:=public.orbit_api('/posts/'||current_setting('orbit.qa_post')||'/comments','POST','{"text":"QA comment"}');perform set_config('orbit.qa_comment',r->>'id',true);
end;$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$begin
 perform public.orbit_api('/circles/'||current_setting('orbit.qa_circle')||'/review','POST','{"user":"qa_sipho","accept":true}');
 if jsonb_array_length(public.orbit_api('/messages/qa_sipho')->'items')<>1 then raise exception 'Message delivery failed';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$begin
 if jsonb_array_length(public.orbit_api('/messages/qa_naledi')->'items')<>0 then raise exception 'Third-party message leak';end if;
 if exists(select 1 from public.orbit_messages) then raise exception 'RLS message leak';end if;
 begin perform public.orbit_api('/comments/'||current_setting('orbit.qa_comment'),'POST','{"text":"Stolen"}');raise exception 'Comment ownership bypass';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$begin
 if jsonb_array_length(public.orbit_api('/feed','GET',jsonb_build_object('circle',current_setting('orbit.qa_circle')))->'items')<>1 then raise exception 'Approved member cannot read';end if;
 perform public.orbit_api('/people/qa_naledi/block','POST','{"block":true}');
 begin perform public.orbit_api('/messages/qa_naledi');raise exception 'Blocked conversation leaked';exception when insufficient_privilege then null;end;
end;$$;
reset role;
delete from public.orbit_blocks where actor='22222222-2222-4222-8222-222222222222' and target='11111111-1111-4111-8111-111111111111';
update public.orbit_connections set status='accepted' where low_actor='11111111-1111-4111-8111-111111111111' and high_actor='22222222-2222-4222-8222-222222222222';
set local role service_role;
do $$declare r jsonb; payload jsonb:='{"players":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"],"state":{"status":"active"}}';begin
 r:=public.orbit_commit_game('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',null,null,payload,'active');
 perform set_config('orbit.qa_game',r->>'id',true);
 perform public.orbit_commit_game('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',(r->>'id')::bigint,(r->>'version')::int,payload,'active');
 begin perform public.orbit_commit_game('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',(r->>'id')::bigint,(r->>'version')::int,payload,'active');raise exception 'Stale game version accepted';exception when serialization_failure then null;end;
end;$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$begin
 if exists(select 1 from public.orbit_games) then raise exception 'Third-party game leaked';end if;
 begin perform public.orbit_commit_game('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',null,null,'{}','active');raise exception 'Client game commit allowed';exception when insufficient_privilege then null;end;
end;$$;
reset role;
update auth.users set email_confirmed_at=null where id='33333333-3333-4333-8333-333333333333';
set local role authenticated;
do $$begin
 begin perform public.orbit_api('/posts','POST','{"title":"Unverified","text":"Denied"}');raise exception 'Unverified email write allowed';exception when insufficient_privilege then null;end;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform public.orbit_api('/posts','POST','{"title":"Anonymous","text":"No"}');raise exception 'Anonymous write allowed';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.orbit_posts where circle is not null) then raise exception 'Anonymous private post leak';end if;
end;$$;
rollback;
select 'PASS: profiles, actor spoofing, author ownership, private circles, messaging, RLS, blocks, moderator isolation anonymous restrictions, game commit permissions, version conflicts, game privacy and unverified email restrictions. Fixtures rolled back.' as validation;
