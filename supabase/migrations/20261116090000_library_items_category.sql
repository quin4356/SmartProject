-- Volledig categoriepad uit Google Books, bv. "Psychology / Cognitive Psychology"
alter table public.library_items
  add column category text check (char_length(category) <= 200);
