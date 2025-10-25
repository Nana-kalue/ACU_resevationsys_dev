# データベースマイグレーション手順

## 前提条件

- PostgreSQLがインストールされていること
- データベースが作成されていること
- `backend/.env`ファイルに正しい接続情報が設定されていること

## マイグレーション方法

### 方法1: シェルスクリプトを使用（推奨）

#### すべてのマイグレーションを実行

```bash
cd database
./migrate.sh
```

#### 特定のマイグレーションのみ実行

```bash
cd database
./migrate.sh 002  # 002_add_customer_fields.sqlを実行
./migrate.sh 003  # 003_add_questionnaire_table.sqlを実行
```

### 方法2: psqlコマンドを直接使用

#### 環境変数を設定

```bash
# backend/.envファイルから接続情報を取得
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=reservation_db
export DB_USER=postgres
```

#### マイグレーションを実行

```bash
# データベースに接続
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# PostgreSQLのプロンプトで各マイグレーションファイルを実行
\i migrations/001_initial_schema.sql
\i migrations/002_add_customer_fields.sql
\i migrations/003_add_questionnaire_table.sql
```

または、ワンライナーで：

```bash
psql -h localhost -p 5432 -U postgres -d reservation_db -f migrations/002_add_customer_fields.sql
psql -h localhost -p 5432 -U postgres -d reservation_db -f migrations/003_add_questionnaire_table.sql
```

### 方法3: Docker環境の場合

```bash
# Dockerコンテナ内でマイグレーションを実行
docker exec -i postgres_container psql -U postgres -d reservation_db < migrations/002_add_customer_fields.sql
docker exec -i postgres_container psql -U postgres -d reservation_db < migrations/003_add_questionnaire_table.sql
```

## マイグレーションファイル一覧

### 001_initial_schema.sql
- 初期データベーススキーマ
- テーブル: admins, plans, customers, reservations, blocked_slots, email_queue

### 002_add_customer_fields.sql
- customersテーブルに新しいカラムを追加
  - furigana: フリガナ
  - gender: 性別
  - birthdate: 生年月日
  - age: 年齢
  - address: 住所
- emailをNULL可能に変更
- emailのUNIQUE制約を削除

### 003_add_questionnaire_table.sql
- 事前問診テーブル（questionnaires）を作成
  - symptoms: 現在の症状（必須）
  - medical_history: 既往歴
  - current_medication: 服用中の薬
  - allergies: アレルギー
  - pregnancy: 妊娠の有無
  - other_notes: その他ご要望

## マイグレーション確認

マイグレーションが正しく実行されたか確認：

```bash
psql -h localhost -p 5432 -U postgres -d reservation_db

# テーブル一覧を確認
\dt

# customersテーブルの構造を確認
\d customers

# questionnairesテーブルの構造を確認
\d questionnaires
```

## トラブルシューティング

### エラー: "relation already exists"

既にテーブルが存在する場合のエラーです。マイグレーションファイルでは `IF NOT EXISTS` を使用しているため、通常は問題ありません。

### エラー: "permission denied"

データベースユーザーに必要な権限がない場合のエラーです。スーパーユーザー（postgres）で実行するか、適切な権限を付与してください。

```sql
GRANT ALL PRIVILEGES ON DATABASE reservation_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### エラー: "connection refused"

PostgreSQLサーバーが起動していないか、接続情報が間違っている可能性があります。

```bash
# PostgreSQLの状態を確認
pg_isready -h localhost -p 5432

# PostgreSQLを起動（macOS Homebrewの場合）
brew services start postgresql@14

# PostgreSQLを起動（Dockerの場合）
docker start postgres_container
```

## ロールバック

マイグレーションをロールバックする必要がある場合：

### 002のロールバック

```sql
ALTER TABLE customers DROP COLUMN IF EXISTS furigana;
ALTER TABLE customers DROP COLUMN IF EXISTS gender;
ALTER TABLE customers DROP COLUMN IF EXISTS birthdate;
ALTER TABLE customers DROP COLUMN IF EXISTS age;
ALTER TABLE customers DROP COLUMN IF EXISTS address;
ALTER TABLE customers ALTER COLUMN email SET NOT NULL;
ALTER TABLE customers ADD CONSTRAINT customers_email_key UNIQUE (email);
DROP INDEX IF EXISTS idx_customers_phone;
DROP INDEX IF EXISTS idx_customers_name;
```

### 003のロールバック

```sql
DROP TABLE IF EXISTS questionnaires;
```
