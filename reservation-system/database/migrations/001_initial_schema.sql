-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for reservation system
-- Created: 2025-09-25

-- 管理者テーブル
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- プランテーブル
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) UNIQUE NOT NULL,
    display_name VARCHAR(300) NOT NULL,
    description TEXT,
    price INTEGER, -- 価格（円）
    duration INTEGER DEFAULT 60, -- 時間（分）
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 顧客テーブル
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 予約テーブル
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- 同じ日時の重複予約を防ぐ
    UNIQUE(reservation_date, start_time)
);

-- 予約受付停止設定テーブル
CREATE TABLE IF NOT EXISTS blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- 同じ日時の重複ブロックを防ぐ
    UNIQUE(block_date, start_time, end_time)
);

-- メール送信キューテーブル
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(reservation_date, start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_plan ON reservations(plan_id);
CREATE INDEX IF NOT EXISTS idx_reservations_number ON reservations(reservation_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(block_date);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active, sort_order);

-- 複合インデックス
CREATE INDEX IF NOT EXISTS idx_reservations_lookup ON reservations(reservation_date, start_time, status);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_lookup ON blocked_slots(block_date, start_time, end_time);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 予約番号を自動生成する関数（一意性保証版）
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    sequence_num INTEGER;
    new_reservation_number TEXT;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    -- 今日の日付部分を取得（YYYYMMDD形式）
    date_part := to_char(CURRENT_DATE, 'YYYYMMDD');

    LOOP
        attempt := attempt + 1;

        -- 現在時刻のマイクロ秒 + ランダム要素で一意性を確保
        sequence_num := EXTRACT(MICROSECONDS FROM CLOCK_TIMESTAMP())::INTEGER % 1000 + attempt;

        -- 予約番号を生成（R + YYYYMMDD + 3桁連番）
        new_reservation_number := 'R' || date_part || '-' || LPAD(sequence_num::TEXT, 3, '0');

        -- 重複チェック（変数名を変更して曖昧性を解消）
        IF NOT EXISTS (SELECT 1 FROM reservations WHERE reservations.reservation_number = new_reservation_number) THEN
            RETURN new_reservation_number;
        END IF;

        -- 最大試行回数に達した場合
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique reservation number after % attempts', max_attempts;
        END IF;

        -- 短時間待機してから再試行
        PERFORM pg_sleep(0.001);
    END LOOP;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_slots_updated_at BEFORE UPDATE ON blocked_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();