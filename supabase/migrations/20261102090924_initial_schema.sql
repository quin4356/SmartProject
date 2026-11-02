-- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Enums
create type public.item_type as enum ('BOOK', 'DOCUMENTARY');
create type public.item_status as enum ('TO_DO', 'IN_PROGRESS', 'DONE');

-- Shared trigger function
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- categories and topics
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);

create unique index categories_user_id_name_key
  on public.categories (user_id, lower(name));

create unique index topics_user_id_name_key
  on public.topics (user_id, lower(name));

alter table public.categories enable row level security;
alter table public.topics enable row level security;

create policy "categories_own_rows"
  on public.categories
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "topics_own_rows"
  on public.topics
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- library_items
create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.item_type not null,
  status public.item_status not null default 'TO_DO',
  title text not null check (char_length(trim(title)) between 1 and 300),
  creator_name text not null check (char_length(trim(creator_name)) between 1 and 200),
  description text check (char_length(description) <= 5000),
  cover_url text check (char_length(cover_url) <= 2000),
  language text check (char_length(language) <= 50),
  publication_year int check (publication_year between 0 and 2100),
  isbn text check (char_length(isbn) <= 20),
  publisher text check (char_length(publisher) <= 200),
  page_count int check (page_count > 0),
  release_date date,
  runtime_minutes int check (runtime_minutes > 0),
  country text check (char_length(country) <= 100),
  external_source text check (external_source in ('GOOGLE_BOOKS', 'TMDB')),
  external_id text check (char_length(external_id) <= 100),
  rating smallint check (rating between 1 and 5),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index library_items_user_id_idx
  on public.library_items (user_id, type, status);

create unique index library_items_id_user_id_key
  on public.library_items (id, user_id);

alter table public.library_items enable row level security;

create policy "library_items_own_rows"
  on public.library_items
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger library_items_set_updated_at
  before update on public.library_items
  for each row execute function public.set_updated_at();

-- item_categories and item_topics
create table public.item_categories (
  item_id uuid not null references public.library_items (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (item_id, category_id)
);

create table public.item_topics (
  item_id uuid not null references public.library_items (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (item_id, topic_id)
);

create index item_categories_category_id_idx on public.item_categories (category_id);
create index item_topics_topic_id_idx on public.item_topics (topic_id);

alter table public.item_categories enable row level security;
alter table public.item_topics enable row level security;

create policy "item_categories_own_rows"
  on public.item_categories
  for all
  to authenticated
  using (
    exists (
      select 1 from public.library_items i
      where i.id = item_id and i.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.library_items i
      where i.id = item_id and i.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    )
  );

create policy "item_topics_own_rows"
  on public.item_topics
  for all
  to authenticated
  using (
    exists (
      select 1 from public.library_items i
      where i.id = item_id and i.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.library_items i
      where i.id = item_id and i.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.topics t
      where t.id = topic_id and t.user_id = (select auth.uid())
    )
  );

-- notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  content text not null default '' check (char_length(content) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id),
  foreign key (item_id, user_id)
    references public.library_items (id, user_id) on delete cascade
);

create index notes_user_id_idx on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

create policy "notes_own_rows"
  on public.notes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- attachments
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null,
  storage_path text not null unique check (char_length(storage_path) <= 500),
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text not null check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  created_at timestamptz not null default now(),
  unique (item_id),
  foreign key (item_id, user_id)
    references public.library_items (id, user_id) on delete cascade
);

create index attachments_user_id_idx on public.attachments (user_id);

alter table public.attachments enable row level security;

create policy "attachments_own_rows"
  on public.attachments
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- activity_history
create table public.activity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null,
  old_status public.item_status,
  new_status public.item_status not null,
  occurred_at timestamptz not null default now(),
  foreign key (item_id, user_id)
    references public.library_items (id, user_id) on delete cascade
);

create index activity_history_user_id_idx
  on public.activity_history (user_id, occurred_at desc);

alter table public.activity_history enable row level security;

create policy "activity_history_select_own_rows"
  on public.activity_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.log_item_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_history (user_id, item_id, old_status, new_status)
    values (new.user_id, new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.activity_history (user_id, item_id, old_status, new_status)
    values (new.user_id, new.id, old.status, new.status);
  end if;
  return new;
end;
$$;

create trigger library_items_log_status_change
  after insert or update of status on public.library_items
  for each row execute function public.log_item_status_change();

-- Storage bucket and policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 52428800, array['application/pdf']);

create policy "attachments_storage_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_storage_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_storage_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_storage_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );