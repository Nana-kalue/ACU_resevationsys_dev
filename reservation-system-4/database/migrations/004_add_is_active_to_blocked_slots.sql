-- 004_add_is_active_to_blocked_slots.sql
-- blocked_slotsテーブルにis_activeカラムを追加

-- is_activeカラムを追加（デフォルトはtrue）
ALTER TABLE blocked_slots
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- 既存のデータは全てアクティブとして設定
UPDATE blocked_slots SET is_active = true WHERE is_active IS NULL;

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_blocked_slots_is_active ON blocked_slots(is_active);

COMMENT ON COLUMN blocked_slots.is_active IS 'ブロックがアクティブかどうか（論理削除用）';
