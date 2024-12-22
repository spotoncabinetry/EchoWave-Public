-- Function to create a new order
CREATE OR REPLACE FUNCTION create_order(
    p_profile_id UUID,
    p_customer_phone VARCHAR,
    p_customer_name VARCHAR,
    p_items JSONB,
    p_special_instructions TEXT DEFAULT NULL,
    p_order_type VARCHAR DEFAULT 'dine-in'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_amount NUMERIC(10,2);
    v_order_id UUID;
BEGIN
    -- Calculate total amount from items
    SELECT SUM((item->>'quantity')::integer * (item->>'price')::numeric)
    INTO v_total_amount
    FROM jsonb_array_elements(p_items) AS item;

    -- Insert the order
    INSERT INTO public.orders (
        profile_id,
        customer_phone,
        customer_name,
        items,
        total_amount,
        special_instructions,
        order_type,
        status,
        payment_status
    )
    VALUES (
        p_profile_id,
        p_customer_phone,
        p_customer_name,
        p_items,
        v_total_amount,
        p_special_instructions,
        p_order_type,
        'pending',
        'pending'
    )
    RETURNING id INTO v_order_id;

    RETURN v_order_id;
END;
$$;

-- Function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_status VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify the user owns this order
    IF NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = p_order_id
        AND o.profile_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized to update this order';
    END IF;

    UPDATE public.orders
    SET status = p_status
    WHERE id = p_order_id;
END;
$$;
