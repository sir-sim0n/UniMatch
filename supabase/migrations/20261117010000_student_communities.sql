begin;

alter table public.orbit_posts add column anonymous boolean not null default false;
alter table public.orbit_posts add column category text not null default 'Everyday experiences'
  check (category in ('Confessions','Relationships and friendships','Academic questions',
    'Residence life','Money and student survival','Rants and advice','Everyday experiences'));
alter table public.orbit_posts add column moderation_hidden boolean not null default false;
alter table public.orbit_comments add column moderation_hidden boolean not null default false;
alter table public.orbit_profiles add column avatar text not null default 'moon'
  check (avatar in ('sun','moon','leaf','star'));
update public.orbit_profiles set display_name=handle;
alter table public.orbit_circles alter column owner drop not null;
insert into public.orbit_circles(title,description,owner,rules)
select title,description,null,'Use pseudonyms. Do not expose personal information, harass, threaten or impersonate others.'
from (values
  ('NWU Vanderbijlpark Confessions','Campus experiences and the things you need to get off your chest.'),
  ('NWU Vanderbijlpark Questions','Ask questions and share advice about student life.'),
  ('Across campuses','Student experiences and conversations across campuses.')
) as communities(title,description)
where not exists(select 1 from public.orbit_circles c where c.title=communities.title);

create table orbit_private.pilot_settings (
  singleton boolean primary key default true check(singleton),
  registration_open boolean not null default false
);
insert into orbit_private.pilot_settings(singleton) values(true);
alter table orbit_private.pilot_settings enable row level security;
revoke all on orbit_private.pilot_settings from public,anon,authenticated;

create table orbit_private.student_memberships (
  actor uuid primary key references public.orbit_profiles(id) on delete cascade,
  policy_version text not null,
  enrolled_at timestamptz not null default now(),
  suspended_until timestamptz,
  deleted_at timestamptz
);
create table orbit_private.moderation_actions (
  id bigint generated always as identity primary key,
  moderator uuid not null,
  action text not null,
  target text not null,
  reason text not null check(length(trim(reason)) between 1 and 1000),
  created timestamptz not null default now()
);
create table orbit_private.student_appeals (
  id bigint generated always as identity primary key,
  actor uuid not null references public.orbit_profiles(id) on delete cascade,
  text text not null check(length(trim(text)) between 1 and 1000),
  status text not null default 'open' check(status in ('open','resolved')),
  created timestamptz not null default now()
);
create unique index orbit_one_open_appeal on orbit_private.student_appeals(actor) where status='open';
create table orbit_private.deletion_jobs (
  actor uuid primary key,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table orbit_private.student_memberships enable row level security;
alter table orbit_private.moderation_actions enable row level security;
alter table orbit_private.student_appeals enable row level security;
alter table orbit_private.deletion_jobs enable row level security;
revoke all on orbit_private.student_memberships,orbit_private.moderation_actions,
  orbit_private.student_appeals,orbit_private.deletion_jobs from public,anon,authenticated;

alter table public.orbit_reports drop constraint orbit_reports_reason_check;
alter table public.orbit_reports add constraint orbit_reports_reason_check
  check(reason in ('Personal information','Harassment','Threats','Impersonation','Spam','Other'));
alter table public.orbit_content_reports drop constraint orbit_content_reports_reason_check;
alter table public.orbit_content_reports add constraint orbit_content_reports_reason_check
  check(reason in ('Personal information','Harassment','Threats','Impersonation','Spam','Other'));

create function orbit_private.student_member() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from orbit_private.student_memberships m join auth.users a on a.id=m.actor
    where m.actor=auth.uid() and m.deleted_at is null and a.email_confirmed_at is not null
      and lower(split_part(a.email,'@',2))='mynwu.ac.za');
$$;

-- All content audiences now require a privately verified student membership.
create or replace function orbit_private.can_read(p bigint) returns boolean
language sql stable security definer set search_path='' as $$
  select orbit_private.student_member() and exists(
    select 1 from public.orbit_posts post left join public.orbit_circles c on c.id=post.circle
    where post.id=p and not post.deleted and not post.moderation_hidden
      and not orbit_private.blocked(auth.uid(),post.author)
      and (post.circle is null or (not orbit_private.blocked(auth.uid(),c.owner)
        and (not c.private or orbit_private.member(c.id)))));
$$;

-- Preserve the checked legacy operations. Only the new gateway can call them.
alter function orbit_private.api(text,text,jsonb) rename to api_v115;
revoke all on function orbit_private.api_v115(text,text,jsonb) from public,anon,authenticated;

-- Anonymous posts must not enter author-filtered feeds or follow-based ranking.
do $migration$
declare definition text;
begin
  select pg_get_functiondef('orbit_private.api_v115(text,text,jsonb)'::regprocedure) into definition;
  definition := replace(definition,
    'and (body->>''author'' is null or post.author=',
    'and (body->>''author'' is null or not post.anonymous) and (body->>''author'' is null or post.author=');
  definition := replace(definition,
    'and (body->>''following'' is distinct from ''true'' or exists',
    'and (body->>''following'' is distinct from ''true'' or not post.anonymous) and (body->>''following'' is distinct from ''true'' or exists');
  definition := replace(definition,
    'and not orbit_private.blocked(u,c.author)',
    'and not c.moderation_hidden and not orbit_private.blocked(u,c.author)');
  definition := replace(definition,
    'and not orbit_private.blocked(u,author)',
    'and not moderation_hidden and not orbit_private.blocked(u,author)');
  definition := replace(definition,
    'where f.actor=u and f.target=post.author',
    'where not post.anonymous and f.actor=u and f.target=post.author');
  definition := replace(definition,
    'from public.orbit_profiles where (coalesce',
    'from public.orbit_profiles where exists(select 1 from orbit_private.student_memberships sm where sm.actor=orbit_profiles.id and sm.deleted_at is null) and (coalesce');
  definition := replace(definition,
    'display_name as "displayName",bio,university,campus',
    'display_name as "displayName",bio,university,campus,avatar');
  definition := replace(definition,'circle_row.owner<>u','circle_row.owner is distinct from u');
  execute definition;
end;
$migration$;

-- Recursively remove author identifiers in posts, previews, replies and saved comments.
create function orbit_private.student_projection(value jsonb, context_post bigint default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  result jsonb := value;
  entry record;
  pid bigint := context_post;
  owner uuid;
  author_id uuid;
  is_anonymous boolean := false;
begin
  if value is null then return null; end if;
  if jsonb_typeof(value)='array' then
    select coalesce(jsonb_agg(orbit_private.student_projection(v,pid) order by n),'[]') into result
      from jsonb_array_elements(value) with ordinality as items(v,n);
    return result;
  end if;
  if jsonb_typeof(value)<>'object' then return value; end if;
  if value ? 'title' and value ? 'author' and value ? 'id' then pid := (value->>'id')::bigint;
  elsif value ? 'post' and value ? 'author' then pid := (value->>'post')::bigint; end if;
  if pid is not null then
    select p.author,p.anonymous into owner,is_anonymous from public.orbit_posts p where p.id=pid;
  end if;
  if value ? 'author' then
    author_id := nullif(value->>'author','')::uuid;
    result := result || jsonb_build_object('own',author_id=auth.uid());
    if is_anonymous and owner=author_id then
      result := (result - 'author' - 'rawAuthor' - 'handle' - 'displayName' - 'bio' - 'avatar' - 'university' - 'campus')
        || jsonb_build_object('author',null,'handle',null,'displayName','Anonymous OP','anonymousAuthor',true);
    end if;
  end if;
  if is_anonymous and result ? 'interactions' then
    result := jsonb_set(result,'{interactions,following}','false');
  end if;
  for entry in select key,val from jsonb_each(result) as fields(key,val) loop
    if jsonb_typeof(entry.val) in ('array','object') then
      result := jsonb_set(result,array[entry.key],orbit_private.student_projection(entry.val,pid));
    end if;
  end loop;
  return result;
end;
$$;

create function orbit_private.api(path text,method text,body jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  u uuid := auth.uid();
  result jsonb;
  item record;
  target_id bigint;
  target_actor uuid;
  operation text;
  reason text;
  mailbox text;
  notice jsonb;
begin
  if jsonb_typeof(body)<>'object' or method not in ('GET','POST') then raise exception 'Invalid request.'; end if;
  if path='/student/status' and method='GET' then
    return jsonb_build_object('version','1.16.0','member',orbit_private.student_member(),
      'pilotCampus','NWU Vanderbijlpark','capacity',50,
      'registrationOpen',(select registration_open from orbit_private.pilot_settings where singleton));
  end if;
  if path='/me' and method='GET' then
    result := orbit_private.api_v115(path,method,body);
    if result->'user' <> 'null'::jsonb then
      result := jsonb_set(result,'{user,studentMember}',to_jsonb(orbit_private.student_member()));
      result := jsonb_set(result,'{user,avatar}',to_jsonb((select avatar from public.orbit_profiles where id=u)));
      result := jsonb_set(result,'{user,deletionRequested}',to_jsonb(exists(select 1 from orbit_private.deletion_jobs where actor=u)));
    end if;
    return result;
  end if;
  if path='/student/enrol' and method='POST' then
    u := orbit_private.actor();
    if not (select registration_open from orbit_private.pilot_settings where singleton) then raise exception 'Pilot registration opens after email delivery and moderation setup.'; end if;
    select lower(email) into mailbox from auth.users where id=u;
    if split_part(mailbox,'@',2)<>'mynwu.ac.za' then raise exception 'Verify your NWU student mailbox to join.' using errcode='42501'; end if;
    if body->>'adult' is distinct from 'true' or body->>'student' is distinct from 'true'
      or body->>'policy' is distinct from '2026-11-17' then raise exception 'Confirm eligibility and the community rules.'; end if;
    perform pg_advisory_xact_lock(hashtextextended('orbit-student-pilot',0));
    if exists(select 1 from orbit_private.deletion_jobs where actor=u) then raise exception 'Account deletion has been requested.'; end if;
    if not exists(select 1 from orbit_private.student_memberships where actor=u) then
      if (select count(*) from orbit_private.student_memberships where deleted_at is null)>=50 then raise exception 'The pilot is full. Please try a later intake.'; end if;
      insert into orbit_private.student_memberships(actor,policy_version) values(u,'2026-11-17');
    end if;
    update public.orbit_profiles set university='North-West University',campus='Vanderbijlpark',display_name=handle where id=u;
    -- Campus communities are created once by the first enrolled moderator.
    if orbit_private.platform_mod() and not exists(select 1 from public.orbit_circles where title='NWU Vanderbijlpark Confessions') then
      for item in select title,description from (values
        ('NWU Vanderbijlpark Confessions','Campus experiences and the things you need to get off your chest.'),
        ('NWU Vanderbijlpark Questions','Ask questions and share advice about student life.'),
        ('Across campuses','Student experiences and conversations across campuses.')) as groups(title,description)
      loop
        insert into public.orbit_circles(title,description,owner,rules) values(item.title,item.description,u,
          'Use pseudonyms. Do not expose personal information, harass, threaten or impersonate others. Report concerns.') returning id into target_id;
        insert into public.orbit_members(circle,actor,role) values(target_id,u,'owner');
      end loop;
    end if;
    insert into public.orbit_members(circle,actor,role)
      select id,u,'member' from public.orbit_circles where title in ('NWU Vanderbijlpark Confessions','NWU Vanderbijlpark Questions','Across campuses')
      on conflict do nothing;
    return orbit_private.api('/me','GET','{}');
  end if;
  if not orbit_private.student_member() and not (orbit_private.platform_mod() and path='/student/moderation') then
    raise exception 'Join the verified student community to continue.' using errcode='42501';
  end if;
  if method='POST' then
    perform orbit_private.rate_actor(u);
    if exists(select 1 from orbit_private.student_memberships where actor=u and suspended_until>now())
      and path not in ('/student/appeal') then raise exception 'Participation is temporarily restricted. You can submit an appeal.' using errcode='42501'; end if;
  end if;
  if path='/student/appeal' and method='POST' then
    insert into orbit_private.student_appeals(actor,text) values(u,trim(body->>'text'));
    return '{"ok":true}';
  end if;
  if path='/student/moderation' then
    if not orbit_private.platform_mod() then raise exception 'Moderator required.' using errcode='42501'; end if;
    if method='GET' then
      return jsonb_build_object('reports',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from(
        select cr.id,cr.reporter as actor,case when cr.comment is null then 'post' else 'comment' end as kind,
          coalesce(cr.comment,cr.post)::text as target,cr.reason,cr.details,cr.status,
          coalesce(c.text,p.text) as text,coalesce(c.author,p.author) as author
        from public.orbit_content_reports cr join public.orbit_posts p on p.id=cr.post
        left join public.orbit_comments c on c.id=cr.comment
        union all select ar.id,ar.reporter,'account',ar.target::text,ar.reason,ar.details,ar.status,
          'Account report',ar.target from public.orbit_reports ar
        order by id desc limit 50) r),
        'appeals',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from(
          select actor,text,status from orbit_private.student_appeals where status='open' order by id limit 50)a),
        'actions',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from(
          select audit.action,audit.reason,(extract(epoch from audit.created)*1000)::bigint as at
          from orbit_private.moderation_actions audit order by audit.id desc limit 50)a));
    end if;
    operation := body->>'action'; reason := trim(body->>'reason');
    if reason is null or length(reason) not between 1 and 1000 then raise exception 'Add a moderation reason.'; end if;
    if operation='restrict' then
      target_actor := (body->>'target')::uuid;
      if target_actor=u or exists(select 1 from orbit_private.moderators where actor=target_actor) then raise exception 'Choose a student account.'; end if;
      update orbit_private.student_memberships set suspended_until=now()+interval '24 hours' where actor=target_actor;
      if not found then raise exception 'Student unavailable.'; end if;
    elsif operation='appeal-resolve' then
      update orbit_private.student_appeals set status='resolved' where actor=(body->>'target')::uuid and status='open';
      if not found then raise exception 'Appeal unavailable.'; end if;
    elsif operation in ('remove','restore','resolve') then
      if operation='resolve' and body->>'kind'='account' then
        update public.orbit_reports set status='resolved' where reporter=(body->>'reporter')::uuid and target=(body->>'target')::uuid;
        if not found then raise exception 'Report unavailable.'; end if;
      else
      target_id := (body->>'target')::bigint;
      if operation='resolve' then
        update public.orbit_content_reports set status='resolved'
          where reporter=(body->>'reporter')::uuid and coalesce(comment,post)=target_id
            and (comment is null)=(body->>'kind'='post');
        if not found then raise exception 'Report unavailable.'; end if;
      elsif body->>'kind'='post' then
        update public.orbit_posts set moderation_hidden=(operation='remove') where id=target_id;
        if not found then raise exception 'Post unavailable.'; end if;
      elsif body->>'kind'='comment' then
        update public.orbit_comments set moderation_hidden=(operation='remove') where id=target_id;
        if not found then raise exception 'Comment unavailable.'; end if;
      else raise exception 'Choose a post or comment.'; end if;
      end if;
    else raise exception 'Unknown moderation action.'; end if;
    insert into orbit_private.moderation_actions(moderator,action,target,reason) values(u,operation,body->>'target',reason);
    return '{"ok":true}';
  end if;
  if path='/profile' and method='POST' then
    if body->>'displayName' !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception 'Choose a private username.'; end if;
    if exists(select 1 from public.orbit_profiles where handle=body->>'displayName' and id<>u) then raise exception 'Username already used.'; end if;
    update public.orbit_profiles set handle=body->>'displayName',display_name=body->>'displayName',
      bio=coalesce(body->>'bio',''),avatar=coalesce(body->>'avatar',avatar) where id=u;
    return orbit_private.api('/me','GET','{}')->'user';
  end if;
  if path='/posts' and method='POST' then
    perform pg_advisory_xact_lock(hashtextextended('student-post:'||u::text,0));
    if (select count(*) from public.orbit_posts where author=u and created>now()-interval '1 hour')>=10 then raise exception 'Hourly posting limit reached.'; end if;
    if body ? 'anonymous' and jsonb_typeof(body->'anonymous') is distinct from 'boolean' then raise exception 'Choose a post identity.'; end if;
    result := orbit_private.api_v115(path,method,body);
    update public.orbit_posts set anonymous=coalesce((body->>'anonymous')::boolean,false),
      category=coalesce(body->>'category','Everyday experiences') where id=(result->>'id')::bigint;
    return result;
  end if;
  if path ~ '^/posts/[0-9]+/comments$' and method='POST' then
    perform pg_advisory_xact_lock(hashtextextended('student-comment:'||u::text,0));
    if (select count(*) from public.orbit_comments where author=u and created>now()-interval '1 hour')>=10 then raise exception 'Hourly reply limit reached.'; end if;
  end if;
  if path='/feed' and coalesce(body->>'category','')<>'' then
    -- Apply category filtering inside the query, before its limit/offset.
    body := body || jsonb_build_object('studentCategory',body->>'category');
  end if;
  result := orbit_private.api_v115(path,method,body);
  if path='/notifications' and method='GET' then
    for notice in select value from jsonb_array_elements(result->'items') loop
      if exists(select 1 from public.orbit_posts p where p.id=(notice->>'ref')::bigint and p.anonymous and p.author=(notice->>'sender')::uuid) then
        result := jsonb_set(result,'{items}',(select coalesce(jsonb_agg(n),'[]') from jsonb_array_elements(result->'items')n where n->>'id'<>notice->>'id'));
      end if;
    end loop;
  end if;
  return orbit_private.student_projection(result);
end;
$$;

do $migration$
declare definition text;
begin
  select pg_get_functiondef('orbit_private.api_v115(text,text,jsonb)'::regprocedure) into definition;
  definition := replace(definition,
    'and (coalesce(body->>''topic'','''')='''' or post.topic=body->>''topic'')',
    'and (coalesce(body->>''studentCategory'','''')='''' or post.category=body->>''studentCategory'') and (coalesce(body->>''topic'','''')='''' or post.topic=body->>''topic'')');
  execute definition;
end;
$migration$;

-- Raw identity-bearing tables are available only through the checked projections.
do $permissions$
declare item record;
begin
  for item in select tablename from pg_tables where schemaname='public' and tablename like 'orbit_%' loop
    execute format('revoke all on public.%I from public, anon, authenticated',item.tablename);
  end loop;
end;
$permissions$;
revoke all on all functions in schema orbit_private from public,anon,authenticated;
grant execute on function orbit_private.api(text,text,jsonb) to anon,authenticated,service_role;

commit;
