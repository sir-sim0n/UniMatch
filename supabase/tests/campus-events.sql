begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','orbit-event-naledi@example.invalid',now(),'{"handle":"qa_naledi","displayName":"QA Naledi"}'),
('22222222-2222-4222-8222-222222222222','orbit-event-sipho@example.invalid',now(),'{"handle":"qa_sipho","displayName":"QA Sipho"}');
update public.orbit_profiles set university='North-West University',campus='Mahikeng' where handle in ('qa_naledi','qa_sipho');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$declare p jsonb;c jsonb;begin
 p:=public.orbit_api('/posts','POST',jsonb_build_object('title','QA campus event','text','Study together','flair','Campus news','eventAt',now()+interval '1 day','eventPlace','Campus library'));perform set_config('events.qa_post',p->>'id',true);
 c:=public.orbit_api('/circles','POST','{"title":"QA private events","description":"Rollback fixture","private":true}');
 perform public.orbit_api('/posts','POST',jsonb_build_object('title','QA private event','text','Private fixture','circle',(c->>'id')::bigint,'eventAt',now()+interval '12 hours','eventPlace','Private fixture venue'));
 if jsonb_array_length(public.orbit_api('/events')->'items')<>1 then raise exception 'Upcoming events include private-circle events';end if;
 if jsonb_array_length(public.orbit_api('/events','GET','{"campus":"Potchefstroom"}')->'items')<>0 then raise exception 'Event campus filter failed';end if;
 if jsonb_array_length(public.orbit_api('/events','GET','{"campus":"Mahikeng"}')->'items')<>1 then raise exception 'Matching event campus missing';end if;
 begin perform public.orbit_api('/posts','POST','{"title":"Bad event","text":"Bad date","eventAt":"infinity"}');raise exception 'Infinite event allowed';exception when check_violation then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$begin
 begin perform public.orbit_api('/posts/'||current_setting('events.qa_post'),'POST','{"title":"Stolen event","text":"No","eventAt":null}');raise exception 'Event ownership bypass';exception when insufficient_privilege then null;end;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$declare r jsonb;begin
 r:=public.orbit_api('/events');if jsonb_array_length(r->'items')<>1 or r->'items'->0->>'event_place'<>'Campus library' then raise exception 'Public event discovery failed';end if;
end;$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$begin
 perform public.orbit_api('/posts/'||current_setting('events.qa_post'),'POST',jsonb_build_object('title','Past event','text','Past fixture','eventAt',now()-interval '1 day','eventPlace','Library'));
 if jsonb_array_length(public.orbit_api('/events')->'items')<>0 then raise exception 'Past event displayed as upcoming';end if;
 perform public.orbit_api('/posts/'||current_setting('events.qa_post'),'POST','{"title":"Event date removed","text":"Normal post","eventAt":null,"eventPlace":""}');
 if public.orbit_api('/posts/'||current_setting('events.qa_post'))->>'event_at' is not null then raise exception 'Event clearing failed';end if;
end;$$;
rollback;
select 'PASS: public future events, private-circle exclusion, campus filters, event ownership, date constraints, past-event expiry and event removal. Fixtures rolled back.' as validation;
