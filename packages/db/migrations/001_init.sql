create table if not exists sync_runs (
  id bigserial primary key,
  source text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null,
  error_message text,
  meta_json jsonb
);

create table if not exists price_snapshots (
  id bigserial primary key,
  source text not null check (source in ('bazaar', 'auction')),
  fetched_at timestamptz not null,
  hypixel_last_updated timestamptz,
  is_current boolean not null default false
);

create table if not exists bazaar_item_prices (
  snapshot_id bigint not null references price_snapshots(id) on delete cascade,
  product_id text not null,
  item_name text not null,
  buy_order_price double precision,
  sell_offer_price double precision,
  last_updated timestamptz
);

create table if not exists auction_item_prices (
  snapshot_id bigint not null references price_snapshots(id) on delete cascade,
  normalized_name text not null,
  display_name text not null,
  lowest_bin double precision not null,
  last_updated timestamptz
);

create table if not exists item_aliases (
  normalized_name text primary key,
  product_id text,
  auction_match_name text not null,
  source_priority integer not null default 100
);

create index if not exists bazaar_item_prices_product_snapshot_idx
  on bazaar_item_prices (product_id, snapshot_id);

create index if not exists auction_item_prices_name_snapshot_idx
  on auction_item_prices (normalized_name, snapshot_id);

create index if not exists price_snapshots_source_current_idx
  on price_snapshots (source, is_current);
