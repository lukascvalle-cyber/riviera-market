create table products (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references vendors(id) on delete cascade,
  name          text not null,
  description   text,
  price_brl     numeric(8,2) not null check (price_brl >= 0),
  photo_url     text,
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index products_vendor_id_idx on products(vendor_id);

create trigger products_updated_at
  before update on products
  for each row execute procedure set_updated_at();
