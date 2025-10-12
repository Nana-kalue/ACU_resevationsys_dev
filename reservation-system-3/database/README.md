# 予約システム データベース管理

このドキュメントでは、devcontainer環境でのPostgreSQLデータベースの操作方法について説明します。

## 🐳 devcontainer環境での開発

### 1. 前提条件
- VSCode + Dev Containers拡張機能インストール済み
- Docker Desktop起動済み

### 2. devcontainer起動手順

```bash
# 1. VSCodeでプロジェクトルートを開く
code .

# 2. コマンドパレット (Cmd+Shift+P) で以下を実行
Dev Containers: Reopen in Container

# または、右下の「><」ボタンから「Reopen in Container」を選択
```

### 3. 自動設定されるサービス

devcontainer起動時に以下のサービスが自動で開始されます：

#### PostgreSQL データベース
- **Host**: postgres (container name)
- **Port**: 5432
- **Database**: `reservation_system`
- **Username**: `postgres`
- **Password**: `postgres`
- **接続URL**: `postgresql://postgres:postgres@postgres:5432/reservation_system`

#### アプリケーションサーバー
- **Frontend**: http://localhost:3000 (Next.js)
- **Backend API**: http://localhost:3001 (Next.js API)
- **PostgreSQL**: http://localhost:5432

### 4. 初期セットアップ（自動実行）

devcontainer起動時に以下が自動実行されます：

1. **依存関係のインストール**
   ```bash
   cd frontend && npm install
   cd backend && npm install
   ```

2. **データベースの初期化**
   ```bash
   cd backend && npm run db:setup
   ```

3. **開発サーバーの起動**
   - Frontend: 3000番ポート
   - Backend: 3001番ポート

### 4. PostgreSQL手動起動方法

devcontainer内でPostgreSQLサービスが起動していない場合：

```bash
# PostgreSQLサービス起動
docker-compose -f .devcontainer/docker-compose.yml up -d postgres

# コンテナ状態確認
docker ps

# PostgreSQL健全性チェック
docker-compose -f .devcontainer/docker-compose.yml exec postgres pg_isready -U postgres -d reservation_system
```

### 5. PostgreSQL接続方法

```bash
# PostgreSQL接続（コンテナ内から）
psql -h postgres -p 5432 -U postgres -d reservation_system
# パスワード: postgres

# 環境変数使用
psql $POSTGRES_URL

# 接続確認
pg_isready -h postgres -p 5432
```

### 6. PostgreSQL操作コマンド

psqlコマンド内で使用：

```sql
-- データベース一覧表示
\l

-- テーブル一覧表示
\dt

-- テーブル詳細情報
\d table_name

-- テーブル構造詳細
\d+ table_name

-- psql終了
\q
```

SQLクエリ例：

```sql
-- テーブル一覧
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- カラム情報
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'your_table_name';
```

## 🛠️ データベース管理コマンド

### devcontainer内でのコマンド実行

devcontainer内のVS Codeターミナルで以下のコマンドを実行してください：

```bash
# バックエンドディレクトリに移動
cd /workspace/backend

# 初期セットアップ（マイグレーション + サンプルデータ投入）
npm run db:init

# データベースのリセット（全削除 + 再初期化）
npm run db:reset

# マイグレーションスクリプトの実行
npm run db:migrate
```

### 利用可能なnpmスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run db:init` | スキーマとサンプルデータの初期化 |
| `npm run db:reset` | データベース完全リセット + 再初期化 |
| `npm run db:migrate` | 新しいマイグレーションの実行 |
| `npm run db:setup` | `db:init`と同じ（エイリアス） |

### ファイル構成

```
database/
├── migrations/           # データベーススキーマ
│   └── 001_initial_schema.sql
├── seeds/               # 初期データ
│   └── 001_initial_data.sql
├── scripts/             # 管理スクリプト
│   └── migrate.sh
└── README.md           # このファイル
```

## 🚨 トラブルシューティング

### 1. データベース接続エラー

**症状**: `ECONNREFUSED` または接続タイムアウト

**解決方法**:
```bash
# PostgreSQLコンテナの状態確認
docker ps | grep postgres

# PostgreSQLサービスの再起動
docker-compose -f .devcontainer/docker-compose.yml restart postgres

# データベース接続テスト
psql $POSTGRES_URL -c "SELECT 1;"
```

### 2. マイグレーションエラー

**症状**: テーブル作成エラーや重複エラー

**解決方法**:
```bash
# データベースの完全リセット
cd /workspace/backend
npm run db:reset

# 手動でのスキーマ確認
psql $POSTGRES_URL -c "\dt"
```

### 3. 開発サーバーが起動しない

**症状**: npm run dev でエラー

**解決方法**:
```bash
# 依存関係の再インストール
cd /workspace/frontend && rm -rf node_modules && npm install
cd /workspace/backend && rm -rf node_modules && npm install

# devcontainerの再ビルド
# VS Code: Cmd+Shift+P > Dev Containers: Rebuild Container
```

### 4. ポート競合エラー

**症状**: `Port already in use`

**解決方法**:
```bash
# 使用中のポート確認
lsof -i :3000 :3001 :5432

# 必要に応じてプロセスを終了
# または devcontainer を再起動
```

## 🔧 高度な操作

### データベースバックアップ

```bash
# データベースのダンプ
pg_dump $POSTGRES_URL > backup.sql

# データベースの復元
psql $POSTGRES_URL < backup.sql
```

### VS Code PostgreSQL拡張機能での接続

1. VS Code Extensions で「PostgreSQL」をインストール
2. 接続設定:
   - **Host**: localhost
   - **Port**: 5432
   - **Database**: reservation_system
   - **Username**: postgres
   - **Password**: postgres

## 📊 データベース構造

### 主要テーブル

| テーブル | 説明 |
|---------|------|
| `admins` | 管理者アカウント |
| `plans` | 予約プラン（料金プラン） |
| `customers` | 顧客情報 |
| `reservations` | 予約データ |
| `blocked_slots` | ブロック済み時間枠 |

### 環境変数

devcontainer環境では以下の環境変数が自動設定されます：

```bash
POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/reservation_system
POSTGRES_PRISMA_URL=postgresql://postgres:postgres@postgres:5432/reservation_system?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@postgres:5432/reservation_system
```

## 📝 開発フロー

1. **devcontainer起動**: データベースとアプリケーションが自動セットアップ
2. **データ確認**: VS Code PostgreSQL拡張機能で確認
3. **API テスト**: http://localhost:3001/api/public/plans でテスト
4. **フロントエンド確認**: http://localhost:3000 でUI確認
5. **データベース変更**: migrations/ フォルダでスキーマ管理