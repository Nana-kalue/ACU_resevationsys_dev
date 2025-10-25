-- Migration: 003_add_questionnaire_table.sql
-- Description: Add questionnaire table for storing pre-consultation data
-- Created: 2025-10-13

-- 事前問診テーブル
CREATE TABLE IF NOT EXISTS questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    symptoms TEXT NOT NULL,
    medical_history TEXT,
    current_medication TEXT,
    allergies TEXT,
    pregnancy VARCHAR(50),
    other_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- 1つの予約に対して1つの問診票
    UNIQUE(reservation_id)
);

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_questionnaires_reservation ON questionnaires(reservation_id);

-- 更新日時を自動更新するトリガーを設定
CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
