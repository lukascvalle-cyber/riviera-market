-- ===================== profiles =====================
alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins read all profiles"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
  );

-- ===================== vendors =====================
alter table vendors enable row level security;

create policy "Public reads approved active vendors"
  on vendors for select using (is_approved = true);

create policy "Vendedor manages own vendor row"
  on vendors for all using (profile_id = auth.uid());

create policy "Admin manages all vendors"
  on vendors for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
  );

-- ===================== products =====================
alter table products enable row level security;

create policy "Public reads products of approved vendors"
  on products for select using (
    exists (select 1 from vendors v where v.id = vendor_id and v.is_approved = true)
  );

create policy "Vendedor manages own products"
  on products for all using (
    exists (select 1 from vendors v where v.id = vendor_id and v.profile_id = auth.uid())
  );

create policy "Admin manages all products"
  on products for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
  );

-- ===================== orders =====================
alter table orders enable row level security;

create policy "Frequentador reads own orders"
  on orders for select using (frequentador_id = auth.uid());

create policy "Frequentador inserts own orders"
  on orders for insert with check (frequentador_id = auth.uid());

create policy "Vendedor reads orders for their vendor"
  on orders for select using (
    exists (select 1 from vendors v where v.id = vendor_id and v.profile_id = auth.uid())
  );

create policy "Vendedor updates order status"
  on orders for update using (
    exists (select 1 from vendors v where v.id = vendor_id and v.profile_id = auth.uid())
  );

create policy "Admin reads all orders"
  on orders for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
  );

-- ===================== order_items =====================
alter table order_items enable row level security;

create policy "Order items visible to participants"
  on order_items for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (
          o.frequentador_id = auth.uid()
          or exists (select 1 from vendors v where v.id = o.vendor_id and v.profile_id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
        )
    )
  );

create policy "Frequentador inserts order items"
  on order_items for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.frequentador_id = auth.uid())
  );

-- ===================== vendor_locations =====================
alter table vendor_locations enable row level security;

create policy "Public reads all vendor locations"
  on vendor_locations for select using (true);

create policy "Vendedor upserts own location"
  on vendor_locations for insert with check (
    exists (select 1 from vendors v where v.id = vendor_id and v.profile_id = auth.uid())
  );

create policy "Vendedor updates own location"
  on vendor_locations for update using (
    exists (select 1 from vendors v where v.id = vendor_id and v.profile_id = auth.uid())
  );
