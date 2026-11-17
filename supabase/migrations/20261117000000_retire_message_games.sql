-- Disable the previous Edge Function's write path when upgrading an existing pilot.
revoke execute on function public.orbit_commit_game(uuid,uuid,bigint,integer,jsonb,text) from service_role;
delete from public.orbit_notifications where kind = 'game';
