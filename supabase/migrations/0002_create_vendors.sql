create type vendor_category as enum (
  'bebidas', 'comidas', 'sorvete', 'artesanato', 'equipamentos', 'outros'
);

create table vendors (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null unique references profiles(id) on delete cascade,
  display_name  text not null,
  category      vendor_category not null default 'outros',
  description   text,
  logo_url      text,
  is_active     boolean not null default false,
  is_approved   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger vendors_updated_at
  before update on vendors
  for each row execute procedure set_updated_at();
