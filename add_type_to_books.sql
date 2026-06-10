-- Add type column to books table if it doesn't exist
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS type VARCHAR(100) NOT NULL DEFAULT 'Roman';

-- Update existing null values (if any)
UPDATE public.books SET type = 'Roman' WHERE type IS NULL;

-- Make the column NOT NULL (optional, already set in ADD COLUMN)
ALTER TABLE public.books ALTER COLUMN type SET NOT NULL;
