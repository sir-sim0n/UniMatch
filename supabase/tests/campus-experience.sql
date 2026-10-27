begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','orbit-campus-naledi@example.invalid',now(),'{"handle":"qa_naledi","displayName":"QA Naledi"}'),
('22222222-2222-4222-8222-222222222222','orbit-campus-sipho@example.invalid',now(),'{"handle":"qa_sipho","displayName":"QA Sipho"}'),
('33333333-3333-4333-8333-333333333333','orbit-campus-ayesha@example.invalid',now(),'{"handle":"qa_ayesha","displayName":"QA Ayesha"}');
update public.orbit_profiles set university='North-West University',campus=case when handle='qa_naledi' then 'Mahikeng' else 'Potchefstroom' end where handle in ('qa_naledi','qa_sipho','qa_ayesha');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$declare p jsonb;c jsonb;begin
 p:=public.orbit_api('/posts','POST','{"title":"QA question","text":"Explain a concept","flair":"Question","topic":"Study life"}');perform set_config('campus.qa_post',p->>'id',true);
 perform public.orbit_api('/posts/'||(p->>'id')||'/save','POST','{}');
 c:=public.orbit_api('/circles','POST','{"title":"QA private community","description":"Rollback only","private":true}');perform set_config('campus.qa_circle',c->>'id',true);
 p:=public.orbit_api('/posts','POST',jsonb_build_object('title','QA private post','text','Private fixture','circle',(c->>'id')::bigint));perform set_config('campus.qa_private',p->>'id',true);
 perform public.orbit_api('/circles/'||(c->>'id')||'/settings','POST','{"introduction":"Welcome to our coding community","cover":"sky","rules":"Be kind","private":true}');
 perform public.orbit_api('/circles/'||(c->>'id')||'/pin','POST',jsonb_build_object('post',(p->>'id')::bigint));
 if jsonb_array_length(public.orbit_api('/feed','GET','{"saved":true}')->'items')<>1 then raise exception 'Saved feed failed';end if;
 if jsonb_array_length(public.orbit_api('/feed','GET','{"campus":"Mahikeng"}')->'items')<>2 then raise exception 'Campus filter failed';end if;
 if jsonb_array_length(public.orbit_api('/feed','GET','{"purpose":"Question"}')->'items')<>1 then raise exception 'Purpose filter failed';end if;
 if jsonb_array_length(public.orbit_api('/feed','GET','{"following":true}')->'items')<>0 then raise exception 'Following filter failed';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$declare r jsonb;p jsonb;begin
 r:=public.orbit_api('/posts/'||current_setting('campus.qa_post')||'/comments','POST','{"text":"A helpful explanation"}');perform set_config('campus.qa_reply',r->>'id',true);
 perform public.orbit_api('/posts/'||current_setting('campus.qa_post')||'/comments','POST',jsonb_build_object('text','Nested reply','parent',(r->>'id')::bigint));
 perform public.orbit_api('/comments/'||(r->>'id')||'/vote','POST','{}');
 begin perform public.orbit_api('/posts/'||current_setting('campus.qa_post')||'/best','POST',jsonb_build_object('reply',(r->>'id')::bigint));raise exception 'Other student accepted answer';exception when insufficient_privilege then null;end;
 begin perform public.orbit_api('/circles/'||current_setting('campus.qa_circle')||'/pin','POST','{}');raise exception 'Non-member pinned private circle';exception when insufficient_privilege then null;end;
 p:=public.orbit_api('/posts','POST','{"title":"QA campus news","text":"Different campus","flair":"Campus news"}');perform set_config('campus.qa_other',p->>'id',true);
 perform public.orbit_api('/posts/'||(p->>'id')||'/save','POST','{}');
 if exists(select 1 from public.orbit_saved_posts where actor<>auth.uid()) then raise exception 'Saved records leaked';end if;
 if (public.orbit_api('/feed','GET','{"saved":true}')->'items'->0->>'id') is distinct from p->>'id' then raise exception 'Saved feed crosses accounts';end if;
 if jsonb_array_length(public.orbit_api('/feed','GET','{"purpose":"Campus news","campus":"Potchefstroom"}')->'items')<>1 then raise exception 'Combined campus/purpose failed';end if;
 begin insert into public.orbit_saved_posts values(auth.uid(),(p->>'id')::bigint,now());raise exception 'Direct saved writes allowed';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$declare p jsonb;r jsonb;begin
 perform public.orbit_api('/posts/'||current_setting('campus.qa_post')||'/best','POST',jsonb_build_object('reply',current_setting('campus.qa_reply')::bigint));
 p:=public.orbit_api('/posts/'||current_setting('campus.qa_post'));
 if public.orbit_api('/posts/'||current_setting('campus.qa_post')||'/accepted')->>'id' is distinct from current_setting('campus.qa_reply') then raise exception 'Accepted answer lookup failed';end if;
 if p->>'best_answer' is distinct from current_setting('campus.qa_reply') then raise exception 'Accepted answer missing';end if;
 if jsonb_array_length(p->'preview')<>1 or p->'preview'->0->>'handle'<>'qa_sipho' then raise exception 'Reply preview failed';end if;
 r:=public.orbit_api('/posts/'||current_setting('campus.qa_post')||'/comments');
 if jsonb_array_length(r->'items')<>2 then raise exception 'Thread replies missing';end if;
 perform public.orbit_api('/people/qa_sipho/follow','POST','{}');
 if jsonb_array_length(public.orbit_api('/feed','GET','{"following":true}')->'items')<>1 then raise exception 'Follow graph feed failed';end if;
 if not exists(select 1 from public.orbit_circles where id=current_setting('campus.qa_circle')::bigint and introduction='Welcome to our coding community' and cover='sky' and pinned_post=current_setting('campus.qa_private')::bigint) then raise exception 'Circle identity/pin failed';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$begin
 if exists(select 1 from public.orbit_saved_posts) then raise exception 'Third-party saved leak';end if;
 if exists(select 1 from public.orbit_comment_votes) then raise exception 'Third-party vote identity leak';end if;
 begin perform public.orbit_api('/posts/'||current_setting('campus.qa_private'));raise exception 'Private direct post leaked';exception when insufficient_privilege then null;end;
 begin perform public.orbit_api('/circles/'||current_setting('campus.qa_circle')||'/settings','POST','{"cover":"garden"}');raise exception 'Circle identity ownership bypass';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$begin perform public.orbit_api('/comments/'||current_setting('campus.qa_reply'),'POST','{"delete":true}');end;$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$begin
 if public.orbit_api('/posts/'||current_setting('campus.qa_post'))->>'best_answer' is not null then raise exception 'Deleted accepted answer still marked';end if;
 if jsonb_array_length(public.orbit_api('/feed','GET','{"public":true,"sort":"Hot"}')->'items')<>2 then raise exception 'Popular feed includes private circle post';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform public.orbit_api('/posts/'||current_setting('campus.qa_post')||'/save','POST','{}');raise exception 'Anonymous save allowed';exception when insufficient_privilege then null;end;
 if jsonb_array_length(public.orbit_api('/feed','GET','{"saved":true}')->'items')<>0 then raise exception 'Anonymous saved leak';end if;
end;$$;
rollback;
select 'PASS: campus/purpose/following filters, scoped saved posts, threaded replies, votes, accepted answers, private pins, circle identity and anonymous restrictions. Fixtures rolled back.' as validation;

