-- Update category images to use Unsplash URLs
-- Run this in Supabase SQL Editor

UPDATE categories 
SET image_url = CASE slug
  WHEN 'electronics' THEN 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80'
  WHEN 'fashion' THEN 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80'
  WHEN 'home-garden' THEN 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'
  WHEN 'sports-outdoors' THEN 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80'
  WHEN 'beauty-health' THEN 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'
  WHEN 'toys-games' THEN 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80'
  WHEN 'books-media' THEN 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80'
  WHEN 'automotive' THEN 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80'
  ELSE image_url
END
WHERE parent_id IS NULL;
