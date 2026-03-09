alter table public.people
  add column if not exists nickname           text,
  add column if not exists instagram          text,
  add column if not exists occupation         text,
  add column if not exists employer           text,
  add column if not exists hometown           text,
  add column if not exists education          text,
  add column if not exists religion           text,
  add column if not exists political_affiliation text,
  add column if not exists languages          text;
