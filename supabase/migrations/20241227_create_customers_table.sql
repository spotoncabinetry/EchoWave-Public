create table customers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  agent_greeting text,
  agent_store_hours text,
  agent_daily_specials text,
  order_id uuid references orders(id)
);
