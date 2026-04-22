insert into storage.buckets (id, name, public)
values ('generated-pdfs', 'generated-pdfs', true)
on conflict (id) do nothing;

create policy "authenticated users can upload own pdfs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'generated-pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "authenticated users can view own pdfs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'generated-pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "admins can view all generated pdfs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'generated-pdfs'
  and exists (
    select 1 from public.admin_roles where admin_roles.user_id = auth.uid()
  )
);
