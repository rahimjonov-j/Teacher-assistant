-- Migration: Remove Telegram integration and update plan prices
-- New prices from design: Basic 49,000 | Pro 119,000 | Premium 249,000

-- 1. Update plan prices to match new design
UPDATE plans SET price_monthly_uzs = 49000  WHERE key = 'basic';
UPDATE plans SET price_monthly_uzs = 119000 WHERE key = 'pro';
UPDATE plans SET price_monthly_uzs = 249000 WHERE key = 'premium';

-- 2. Drop Telegram-related tables
DROP TABLE IF EXISTS telegram_links CASCADE;

-- 3. Remove telegram_handle column from profiles (if present)
ALTER TABLE profiles DROP COLUMN IF EXISTS telegram_handle;
