# 予約システム - 開発環境セットアップ

## 🚀 Devcontainer での開発環境起動

### 前提条件
- Docker Desktop がインストールされている
- VS Code + Dev Containers 拡張機能がインストールされている

### セットアップ手順

1. **プロジェクトをVS Codeで開く**
```bash
code reservation-system
```

2. **Dev Container で開く**
- VS Code で `Ctrl/Cmd + Shift + P`
- `Dev Containers: Reopen in Container` を選択
- 初回は数分かかります（Dockerイメージのビルド）

3. **データベースの確認**
```bash
# PostgreSQL接続確認
psql $POSTGRES_URL -c "SELECT version();"

# テーブル確認
psql $POSTGRES_URL -c "\dt"
```

4. **Next.js アプリケーションの起動**
```bash
npm run dev
```

5. **ブラウザでアクセス**
- http://localhost:3000

## 📋 利用可能なコマンド

### データベース操作
```bash
# スキーマの初期化
npm run db:init

# マイグレーション実行
npm run db:migrate

# データベースリセット（全データ削除）
npm run db:reset
```

### アプリケーション
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションサーバー起動
npm run start

# リント実行
npm run lint
```

## 🗄️ データベース情報

**接続情報:**
- **Host:** localhost
- **Port:** 5432
- **Database:** reservation_db
- **Username:** reservation_user
- **Password:** reservation_pass

**接続URL:**
```
postgresql://reservation_user:reservation_pass@localhost:5432/reservation_db
```

## 🔧 環境変数

開発環境では以下の環境変数が自動設定されます：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `POSTGRES_URL` | postgresql://reservation_user:... | DB接続URL |
| `JWT_SECRET` | dev-jwt-secret-key-for-local-testing-only | JWT秘密鍵（開発用） |
| `NODE_ENV` | development | 実行環境 |
| `EMAIL_ENABLED` | false | メール機能無効 |

## 📡 API エンドポイント

### 公開API（認証不要）
- `GET /api/public/plans` - プラン一覧
- `GET /api/public/availability` - 空き状況確認
- `POST /api/public/reserve` - 予約作成
- `GET /api/public/reserve/check` - 予約確認
- `POST /api/public/reserve/cancel` - 予約キャンセル

### 管理者API（JWT認証必要）
- `POST /api/admin/auth/login` - ログイン
- `GET /api/admin/dashboard` - ダッシュボード
- `GET /api/admin/reservations` - 予約一覧
- `GET /api/admin/reservations/export` - CSV エクスポート

## 🔐 管理者アカウント

**デフォルト管理者:**
- **ログインID:** admin
- **パスワード:** SerenaAdmin2025!

## 🐛 トラブルシューティング

### Dockerコンテナが起動しない
```bash
# Dockerを再起動
docker-compose -f .devcontainer/docker-compose.yml down
docker-compose -f .devcontainer/docker-compose.yml up --build
```

### データベース接続エラー
```bash
# PostgreSQLコンテナの状態確認
docker ps

# ログ確認
docker-compose -f .devcontainer/docker-compose.yml logs db
```

### ポート競合エラー
```bash
# ポート使用状況確認
lsof -i :3000
lsof -i :5432
```

## 📝 開発メモ

- データベースはDockerボリュームで永続化されています
- 開発用のJWT秘密鍵は安全ではないため、本番では変更してください
- メール機能は開発環境では無効化されています