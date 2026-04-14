create table vendor_locations (
  vendor_id   uuid primary key references vendors(id) on delete cascade,
  latitude    double precision not null,
  longitude   double precision not null,
  accuracy    real,
  heading     real,
  updated_at  timestamptz not null default now()
);

-- Enable Realtime for this table:
-- In Supabase Dashboard → Database → Replication → Tables → enable for vendor_locations
-- Or via CLI: supabase db replication enable public.vendor_locations
