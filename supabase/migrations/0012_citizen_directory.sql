-- ============================================================
-- Migration 0012: Citizen area-officer directory
-- Run AFTER 0011_citizen_role.sql has been run (separate transaction).
--
-- Citizens need to see the contact numbers of the revenue officers who
-- serve their area (Talathi, Circle Officer, Nayab Tahsildar, DCO). The
-- profiles RLS deliberately hides one user's profile from another, so we
-- expose ONLY these public-facing fields through a SECURITY DEFINER
-- function scoped to a district (optionally a taluka). No RLS change to
-- profiles is needed, and no private data (Government ID, status, etc.)
-- is returned.
-- ============================================================

create or replace function area_officers(p_district uuid, p_taluka uuid default null)
returns table (
  full_name       text,
  role            user_role,
  mobile          text,
  taluka_name_mr  text,
  taluka_name_en  text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.full_name,
    p.role,
    p.mobile,
    t.name_mr,
    t.name_en
  from profiles p
  left join talukas t on t.id = p.taluka_id
  where p.status = 'active'
    and p.role in ('talathi', 'circle_officer', 'nayab_tahsildar', 'dco')
    and p.district_id = p_district
    and (p_taluka is null or p.taluka_id = p_taluka)
  order by
    case p.role
      when 'talathi'         then 1
      when 'circle_officer'  then 2
      when 'nayab_tahsildar' then 3
      when 'dco'             then 4
      else 5
    end,
    p.full_name;
$$;

-- Any signed-in user (including citizens) may look up their area's officers.
grant execute on function area_officers(uuid, uuid) to authenticated;
