-- Photos are compressed in the browser (max 1600px, WebP or JPEG, usually
-- 150-400 KB). Enforce that on the server too, so uploads that skip the app's
-- compression can't store full-size originals.
update storage.buckets
set file_size_limit = 1572864, -- 1.5 MB
    allowed_mime_types = array['image/webp', 'image/jpeg']
where id = 'listing-photos';
