create type order_status as enum (
  'pending',
  'confirmed',
  'delivering',
  'delivered',
  'cancelled'
);

create table orders (
  id                  uuid primary key default gen_random_uuid(),
  vendor_id           uuid not null references vendors(id),
  frequentador_id     uuid not null references profiles(id),
  status              order_status not null default 'pending',
  delivery_location   text,
  total_brl           numeric(8,2) not null default 0,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid not null references products(id),
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(8,2) not null,
  product_name  text not null
);

create index orders_vendor_id_idx on orders(vendor_id);
create index orders_frequentador_id_idx on orders(frequentador_id);
create index orders_status_idx on orders(status);

create trigger orders_updated_at
  before update on orders
  for each row execute procedure set_updated_at();
