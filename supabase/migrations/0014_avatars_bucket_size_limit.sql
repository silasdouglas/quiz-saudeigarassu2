-- Increase avatars bucket object size limit to 5 MB.
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'avatars';
