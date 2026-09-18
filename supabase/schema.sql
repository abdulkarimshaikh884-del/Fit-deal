-- Fit Deal database. Run once in Supabase → SQL editor (or as a migration).
-- Row Level Security is ON with no policies, so the public anon key can read
-- or write nothing. Only the server, with the service key, can use these.
-- Uploaded photos are never stored anywhere.

create table if not exists searches (
  id text primary key,
  created_at timestamptz not null default now(),
  kind text not null,
  item jsonb,
  query text,
  link jsonb,
  exact jsonb,
  similar jsonb,
  best_exact text,
  sources jsonb,
  store_links jsonb,
  searched_at timestamptz
);

create table if not exists votes (
  id text primary key,
  created_at timestamptz not null default now(),
  search_id text references searches(id) on delete cascade,
  asker text,
  question text,
  options jsonb not null,
  closes_at timestamptz not null
);

create table if not exists ballots (
  id text primary key,
  created_at timestamptz not null default now(),
  vote_id text not null references votes(id) on delete cascade,
  option text not null,
  voter text not null,
  net text,
  unique (vote_id, voter)
);
create index if not exists ballots_vote_idx on ballots (vote_id);

create table if not exists clicks (
  id text primary key,
  created_at timestamptz not null default now(),
  search_id text,
  product_key text,
  store text,
  match text,
  price numeric,
  placement text,
  subid text,
  affiliated boolean,
  visitor text,
  device text
);
create index if not exists clicks_created_idx on clicks (created_at);

create table if not exists events (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  path text,
  props jsonb,
  visitor text,
  device text
);
create index if not exists events_created_idx on events (created_at);
create index if not exists events_name_idx on events (name, created_at);

create table if not exists reports (
  id text primary key,
  created_at timestamptz not null default now(),
  search_id text,
  product_key text,
  match text,
  store text,
  reason text,
  note text,
  query text,
  category text
);

create table if not exists messages (
  id text primary key,
  created_at timestamptz not null default now(),
  name text,
  email text,
  topic text,
  message text,
  status text default 'new'
);

create table if not exists commissions (
  id text primary key,
  created_at timestamptz not null default now(),
  network text,
  order_date date,
  store text,
  amount numeric,
  status text check (status in ('pending', 'approved', 'paid', 'cancelled')),
  ref text
);

alter table searches enable row level security;
alter table votes enable row level security;
alter table ballots enable row level security;
alter table clicks enable row level security;
alter table events enable row level security;
alter table reports enable row level security;
alter table messages enable row level security;
alter table commissions enable row level security;
