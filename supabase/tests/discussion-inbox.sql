-- Fixture-only integration checks. The entire transaction is rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','orbit-discussion-naledi@example.invalid',now(),'{"handle":"qa_naledi","displayName":"QA Naledi"}'),
('22222222-2222-4222-8222-222222222222','orbit-discussion-sipho@example.invalid',now(),'{"handle":"qa_sipho","displayName":"QA Sipho"}'),
('33333333-3333-4333-8333-333333333333','orbit-discussion-ayesha@example.invalid',now(),'{"handle":"qa_ayesha","displayName":"QA Ayesha"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$declare p jsonb;c jsonb;begin
 p:=public.orbit_api('/posts','POST','{"title":"QA discussion layout","text":"Rollback-only discussion","flair":"Question"}');perform set_config('discussion.post',p->>'id',true);
 c:=public.orbit_api('/circles','POST','{"title":"QA discussion circle","description":"Private rollback-only circle","private":true}');perform set_config('discussion.circle',c->>'id',true);
 p:=public.orbit_api('/posts','POST',jsonb_build_object('title','QA private discussion','text','Private fixture','circle',(c->>'id')::bigint));perform set_config('discussion.private',p->>'id',true);
 begin perform public.orbit_api('/posts/'||(p->>'id')||'/repost','POST','{}');raise exception 'Private repost permitted';exception when insufficient_privilege then null;end;
 perform public.orbit_api('/people/qa_sipho/connection','POST','{"action":"request"}');
 if public.orbit_api('/circles/'||current_setting('discussion.circle'))->>'title'<>'QA discussion circle' then raise exception 'Dedicated circle endpoint failed';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$declare c jsonb;m jsonb;begin
 perform public.orbit_api('/people/qa_naledi/connection','POST','{"action":"accept"}');
 perform public.orbit_api('/messages/qa_naledi','POST','{"text":"QA inbox preview"}');
 c:=public.orbit_api('/posts/'||current_setting('discussion.post')||'/comments','POST','{"text":"QA helpful reply"}');perform set_config('discussion.comment',c->>'id',true);
 perform public.orbit_api('/posts/'||current_setting('discussion.post')||'/repost','POST','{}');
 perform public.orbit_api('/posts/'||current_setting('discussion.post')||'/award','POST','{"kind":"Helpful"}');
 if public.orbit_api('/posts/'||current_setting('discussion.post'))->'interactions'->>'myAward'<>'Helpful' then raise exception 'Award missing';end if;
 if not exists(select 1 from jsonb_array_elements(public.orbit_api('/feed','GET',jsonb_build_object('author',auth.uid()))->'items')p where p->>'id'=current_setting('discussion.post')) then raise exception 'Repost absent from profile';end if;
 perform public.orbit_api('/circles/'||current_setting('discussion.circle')||'/join','POST','{}');
 if public.orbit_api('/circles/'||current_setting('discussion.circle'))->>'requested'<>'true' then raise exception 'Join request not reflected';end if;
 begin perform public.orbit_api('/posts/'||current_setting('discussion.private'));raise exception 'Private post leaked';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$declare c jsonb;r jsonb;begin
 perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/react','POST','{"value":1}');
 perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/react','POST','{"value":-1}');
 c:=public.orbit_api('/posts/'||current_setting('discussion.post')||'/comment/'||current_setting('discussion.comment'));
 if c->'interactions'->>'likes'<>'0' or c->'interactions'->>'disliked'<>'true' or (c->'interactions')?'dislikes' then raise exception 'Reaction switch or hidden count failed';end if;
 perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/save','POST','{}');
 if jsonb_array_length(public.orbit_api('/saved-comments')->'items')<>1 then raise exception 'Saved comment missing';end if;
 perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/report','POST','{"reason":"Spam","details":"QA fixture"}');
 perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/report','POST','{"reason":"Other","details":"QA updated fixture"}');
 perform public.orbit_api('/posts/'||current_setting('discussion.post')||'/report','POST','{"reason":"Other","details":"QA post report"}');
 begin perform public.orbit_api('/content-reports');raise exception 'Non-moderator read reports';exception when insufficient_privilege then null;end;
 r:=public.orbit_api('/inbox');if jsonb_array_length(r->'items')<>1 or r->'items'->0->>'text'<>'QA inbox preview' or r->'items'->0->>'unread'<>'1' then raise exception 'Inbox preview/unread failed';end if;
 perform public.orbit_api('/messages/qa_sipho/read','POST','{}');
 if public.orbit_api('/inbox')->'items'->0->>'unread'<>'0' then raise exception 'Read marker failed';end if;
 if jsonb_array_length(public.orbit_api('/contacts','GET','{"q":"Sipho"}')->'items')<>1 or jsonb_array_length(public.orbit_api('/contacts','GET','{"q":"Nobody"}')->'items')<>0 then raise exception 'Contact filter failed';end if;
 begin insert into public.orbit_saved_comments(actor,comment) values(auth.uid(),current_setting('discussion.comment')::bigint);raise exception 'Direct writes permitted';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$begin
 if jsonb_array_length(public.orbit_api('/inbox')->'items')<>0 or exists(select 1 from public.orbit_messages) then raise exception 'Private messages leaked';end if;
 if exists(select 1 from public.orbit_saved_comments) or jsonb_array_length(public.orbit_api('/saved-comments')->'items')<>0 then raise exception 'Saved comments leaked';end if;
 if exists(select 1 from public.orbit_content_reports) then raise exception 'Reports leaked';end if;
 perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/react','POST','{"value":1}');
 if (orbit_private.comment_meta(current_setting('discussion.comment')::bigint)->>'controversy')::numeric<=0 then raise exception 'Controversial ranking failed';end if;
end;$$;
reset role;
insert into orbit_private.moderators(actor) values('33333333-3333-4333-8333-333333333333');
set local role authenticated;
do $$declare r jsonb;begin
 r:=public.orbit_api('/content-reports');if jsonb_array_length(r->'items')<>2 then raise exception 'Report deduplication/moderation failed';end if;
 perform public.orbit_api('/content-reports/'||(r->'items'->0->>'id'),'POST','{"status":"resolved"}');
end;$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$begin
 perform public.orbit_api('/people/qa_sipho/block','POST','{"block":true}');
 if jsonb_array_length(public.orbit_api('/inbox')->'items')<>0 or jsonb_array_length(public.orbit_api('/saved-comments')->'items')<>0 then raise exception 'Blocked content leaked';end if;
 begin perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/react','POST','{"value":1}');raise exception 'Blocked reaction allowed';exception when insufficient_privilege then null;end;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform public.orbit_api('/inbox');raise exception 'Anonymous inbox access';exception when insufficient_privilege then null;end;
 begin perform public.orbit_api('/saved-comments');raise exception 'Anonymous saved access';exception when insufficient_privilege then null;end;
 begin perform public.orbit_api('/comments/'||current_setting('discussion.comment')||'/react','POST','{"value":1}');raise exception 'Anonymous reaction';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: reaction switching, ranking, saved-comment isolation, reports and moderation, private-circle repost restriction, profile reposts, awards, focused links, contact search, inbox previews/read markers, block gates and anonymous restrictions. All fixtures rolled back.' as validation;
