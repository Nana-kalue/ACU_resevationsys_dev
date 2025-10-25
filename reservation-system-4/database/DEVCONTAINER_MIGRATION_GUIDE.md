# devcontainer環境でのマイグレーション実行ガイド

devcontainer環境でデータベースマイグレーションを実行する方法を説明します。

## 前提条件

- devcontainerが起動していること
- PostgreSQLコンテナ（`postgres`サービス）が起動していること

## 方法1: 自動マイグレーションスクリプトを使用（推奨）

devcontainer内のターミナルで以下を実行します：

```bash
cd /workspace/database
chmod +x migrate.sh
./migrate.sh
```

スクリプトが自動的にdevcontainer環境を検出し、適切な接続設定を使用します。

### 特定のマイグレーションのみ実行する場合

```bash
./migrate.sh 002
```

## 方法2: psqlコマンドで直接実行

devcontainer内から直接psqlコマンドを使用してマイグレーションを実行できます：

```bash
# データベースに接続
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system

# マイグレーションファイルを実行
\i /workspace/database/migrations/001_initial_schema.sql
\i /workspace/database/migrations/002_add_customer_fields.sql
\i /workspace/database/migrations/003_add_questionnaire_table.sql

# 終了
\q
```

## 方法3: ワンライナーで実行

```bash
cd /workspace/database
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -f migrations/001_initial_schema.sql
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -f migrations/002_add_customer_fields.sql
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -f migrations/003_add_questionnaire_table.sql
```

## 接続情報

devcontainer環境では以下の接続情報を使用します：

- **ホスト**: `postgres` (docker-composeのサービス名)
- **ポート**: `5432`
- **データベース名**: `reservation_system`
- **ユーザー名**: `postgres`
- **パスワード**: `postgres`

> **注意**: ホスト環境（devcontainerの外）から接続する場合は、ホストを `localhost` に変更してください。

## トラブルシューティング

### 1. データベースに接続できない

PostgreSQLコンテナが起動しているか確認：

```bash
docker ps | grep postgres
```

起動していない場合は、devcontainerを再起動してください。

### 2. データベースが存在しない

データベース一覧を確認：

```bash
PGPASSWORD=postgres psql -h postgres -U postgres -l
```

`reservation_system` データベースが存在しない場合は作成：

```bash
PGPASSWORD=postgres psql -h postgres -U postgres -c "CREATE DATABASE reservation_system;"
```

### 3. パスワードが要求される

環境変数 `PGPASSWORD` を設定してください：

```bash
export PGPASSWORD=postgres
```

または、各コマンドの前に `PGPASSWORD=postgres` を付けてください。

### 4. マイグレーションが既に実行済みか確認

```bash
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -c "\dt"
```

テーブル一覧が表示されます：
- `customers` テーブルに `furigana`, `gender`, `birthdate`, `age`, `address` カラムがあれば 002 は実行済み
- `questionnaires` テーブルが存在すれば 003 は実行済み

### 5. カラムの存在を確認

```bash
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -c "\d customers"
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -c "\d questionnaires"
```

## 注意事項

- マイグレーションファイルは `IF NOT EXISTS` や `IF EXISTS` を使用しているため、複数回実行しても安全です
- 既存のデータは削除されません（新しいカラムや制約の追加のみ）
- 本番環境では必ずバックアップを取ってから実行してください

## マイグレーション後の確認

すべてのマイグレーションが正常に実行されたか確認：

```bash
# テーブル構造を確認
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -c "\d+ customers"
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -c "\d+ questionnaires"

# リレーションを確認
PGPASSWORD=postgres psql -h postgres -U postgres -d reservation_system -c "\d"
```

期待される結果：
- `customers` テーブルに全ての新しいカラムが追加されている
- `questionnaires` テーブルが存在し、`reservation_id` の外部キー制約がある
- インデックスが作成されている（`idx_customers_phone`, `idx_customers_name`）
