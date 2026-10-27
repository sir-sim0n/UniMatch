-- Dashboard automatic-RLS event helper is not a client endpoint.
-- Conditional for CLI-created projects without this dashboard helper.
do $$begin if to_regprocedure('public.rls_auto_enable()') is not null then
 revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
end if;end;$$;

create index orbit_circles_owner on public.orbit_circles(owner);
