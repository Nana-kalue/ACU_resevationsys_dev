-- Seeds: 001_initial_data.sql
-- Description: Initial data for reservation system
-- Created: 2025-09-25

-- 初期管理者データの挿入
INSERT INTO admins (login_id, password_hash) VALUES
('hari.shinjuku@gmail.com', '$2b$10$JTrF/3JE25963JI6r4CtmuMyiy8kDtXiJUcG5B3dJh1pxlFul1Ydi') -- パスワード: hari0801
ON CONFLICT (login_id) DO NOTHING;

-- 初期プランデータの挿入（固定IDを使用）
INSERT INTO plans (id, name, display_name, description, price, duration, sort_order, is_active) VALUES
('be5bc2b2-d8d7-59fe-9722-3b7e1fd67f4f', 'new_customer_2', '【ご新規様限定】2回券 29,800円（税込）', 'ご新規のお客様向けの特別プラン。2回分のサービスをお得にご利用いただけます。', 29800, 60, 0, true)
ON CONFLICT (id) DO NOTHING;