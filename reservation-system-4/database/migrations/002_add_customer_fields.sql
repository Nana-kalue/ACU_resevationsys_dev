-- Migration: 002_add_customer_fields.sql
-- Description: Add new customer fields (furigana, gender, birthdate, age, address)
-- Created: 2025-10-13

-- customersテーブルに新しいカラムを追加
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS furigana VARCHAR(100),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS address TEXT;

-- emailをNULL可能に変更（メールアドレスが任意のため）
ALTER TABLE customers
ALTER COLUMN email DROP NOT NULL;

-- emailのUNIQUE制約を削除（複数の人が同じメールアドレスを使わない場合もあるため）
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_email_key;

-- 電話番号のUNIQUE制約を追加（主キーとして使用）
-- ALTER TABLE customers
-- ADD CONSTRAINT customers_phone_key UNIQUE (phone);

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
