-- Atomic order creation: inserts orders + order_items in a single transaction
create or replace function create_order(
  p_vendor_id       uuid,
  p_delivery_location text,
  p_total_brl       numeric,
  p_notes           text,
  p_items           jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  -- Insert the order
  insert into orders (vendor_id, frequentador_id, delivery_location, total_brl, notes)
  values (p_vendor_id, auth.uid(), p_delivery_location, p_total_brl, p_notes)
  returning id into v_order_id;

  -- Insert each item
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items (order_id, product_id, quantity, unit_price, product_name)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      v_item->>'product_name'
    );
  end loop;

  return v_order_id;
end;
$$;
