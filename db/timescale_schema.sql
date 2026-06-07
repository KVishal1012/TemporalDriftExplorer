create extension if not exists timescaledb;
create schema if not exists temporal;

create table if not exists temporal.cities (
  id text primary key,
  name text not null,
  country text not null check (country in ('Canada', 'India')),
  country_code text not null,
  created_at timestamptz not null default now()
);

create table if not exists temporal.corridors (
  id text primary key,
  city_id text not null references temporal.cities(id),
  name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  geometry_geojson jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists temporal.sources (
  id text primary key,
  city_id text references temporal.cities(id),
  provider text not null,
  name text not null,
  provenance text not null,
  status text not null,
  source_url text,
  year_range text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists temporal.snapshots (
  city_id text not null references temporal.cities(id),
  corridor_id text not null references temporal.corridors(id),
  observed_at timestamptz not null,
  year integer not null,
  vacancy numeric,
  foot_traffic numeric,
  turnover numeric,
  business_intensity numeric,
  provenance text not null,
  source_id text references temporal.sources(id),
  primary key (city_id, corridor_id, observed_at)
);
select create_hypertable('temporal.snapshots', 'observed_at', if_not_exists => true);

create table if not exists temporal.layer_observations (
  id text not null,
  city_id text not null references temporal.cities(id),
  corridor_id text not null references temporal.corridors(id),
  layer text not null,
  label text,
  year_range text,
  observed_at timestamptz not null,
  source_id text references temporal.sources(id),
  dataset_id text,
  provenance text not null,
  value text not null,
  geometry_geojson jsonb not null,
  properties jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (id, observed_at)
);
select create_hypertable('temporal.layer_observations', 'observed_at', if_not_exists => true);

alter table temporal.layer_observations add column if not exists label text;
alter table temporal.layer_observations add column if not exists year_range text;
alter table temporal.layer_observations add column if not exists dataset_id text;
alter table temporal.layer_observations add column if not exists properties jsonb not null default '{}'::jsonb;
alter table temporal.layer_observations add column if not exists updated_at timestamptz not null default now();

create index if not exists layer_observations_city_layer_time_idx
  on temporal.layer_observations (city_id, layer, observed_at desc);

create index if not exists layer_observations_dataset_idx
  on temporal.layer_observations (dataset_id);

create table if not exists temporal.alphaearth_embeddings (
  city_id text not null references temporal.cities(id),
  corridor_id text not null references temporal.corridors(id),
  observed_at timestamptz not null,
  year integer not null,
  dataset_id text not null,
  resolution_meters integer not null,
  channel_count integer not null,
  embedding_summary jsonb not null,
  attribution text not null,
  primary key (city_id, corridor_id, observed_at)
);
select create_hypertable('temporal.alphaearth_embeddings', 'observed_at', if_not_exists => true);

create table if not exists temporal.spatial_findings (
  id text primary key,
  city_id text not null references temporal.cities(id),
  corridor_id text not null references temporal.corridors(id),
  comparison_start_year integer not null,
  comparison_end_year integer not null,
  title text not null,
  body text not null,
  anchor_lat double precision not null,
  anchor_lng double precision not null,
  source_ids text[] not null,
  provenance text not null,
  created_at timestamptz not null default now()
);
