create table agents (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  agent_greeting text,
  agent_store_hours text,
  agent_daily_specials text,
  -- Add foreign keys to menu_items, menu_categories, and menu_item_notes
  -- For now, I'll leave these as text fields, but we can refine this later
  menu_items_knowledge text,
  menu_categories_knowledge text,
  menu_item_notes_knowledge text
);
