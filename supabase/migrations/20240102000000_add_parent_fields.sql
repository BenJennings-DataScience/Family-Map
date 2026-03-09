alter table public.people
  add column if not exists parent1_id uuid references public.people(id) on delete set null,
  add column if not exists parent2_id uuid references public.people(id) on delete set null;
