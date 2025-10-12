# Neon + Vercel 本番環境移行ガイド

## 📌 概要

**現在の環境:**
- Devcontainer環境（Frontend:3000, Backend:3001, PostgreSQL:5432）

**移行先:**
- Vercel（Frontend + Backend）
- Neon（PostgreSQL サーバレス）

---

## ステップ1: Neonのセットアップ

### 1-1. Neonプロジェクト作成

1. https://neon.tech/ にアクセス
2. 新規プロジェクト作成
3. リージョン選択（日本なら AWS Tokyo推奨）
4. データベース名: `reservation_system`

### 1-2. 接続文字列の取得

Neonダッシュボードから3種類の接続文字列をコピー：

```bash
# Pooled connection (推奨)
postgresql://user:pass@ep-xxx.neon.tech/reservation_system?sslmode=require

# Direct connection (マイグレーション用)
postgresql://user:pass@ep-xxx.neon.tech/reservation_system?sslmode=require&connect_timeout=10

# Connection string (Vercel Postgres形式)
postgres://user:pass@ep-xxx.neon.tech/reservation_system?sslmode=require
```

---

## ステップ2: データベースマイグレーション

ローカルまたはNeon SQL Editorから実行：

### 方法1: ローカルから実行（推奨）

```bash
# Neonの接続文字列を環境変数に設定
export NEON_URL="postgresql://user:pass@ep-xxx.neon.tech/reservation_system?sslmode=require"

# スキーマとシード実行
psql $NEON_URL -f database/migrations/001_initial_schema.sql
psql $NEON_URL -f database/seeds/001_initial_data.sql
```

### 方法2: Neon SQL Editorで直接実行

1. Neonダッシュボードの SQL Editor を開く
2. `database/migrations/001_initial_schema.sql` の内容をコピー&ペースト
3. 実行
4. `database/seeds/001_initial_data.sql` の内容をコピー&ペースト
5. 実行

---

## ステップ3: コード変更

### 📄 `backend/src/lib/postgres.ts` の修正

**現在:**
```typescript
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: false, // devcontainer環境ではSSL無効
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**変更後:**
```typescript
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

または、Neonに特化した設定：
```typescript
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## ステップ4: Vercel設定ファイルの作成（オプション）

プロジェクトルートに `vercel.json` を作成：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/package.json",
      "use": "@vercel/next"
    }
  ]
}
```

**注意:** Next.jsプロジェクトの場合、通常は `vercel.json` なしでも自動検出されます。

---

## ステップ5: Vercelプロジェクトのセットアップ

### 5-1. Vercel CLIのインストールと認証

```bash
npm i -g vercel
vercel login
```

### 5-2. プロジェクトのリンク

**Backend用:**
```bash
cd backend
vercel link
# ✔ Link to existing project? … no
# ✔ What's your project's name? … reservation-system-backend
# ✔ In which directory is your code located? … ./
```

**Frontend用:**
```bash
cd ../frontend
vercel link
# ✔ Link to existing project? … no
# ✔ What's your project's name? … reservation-system-frontend
# ✔ In which directory is your code located? … ./
```

### 5-3. Backend環境変数の設定

```bash
cd backend

# データベース接続（Neonから取得）
vercel env add POSTGRES_URL production
# 入力: postgresql://user:pass@ep-xxx.neon.tech/reservation_system?sslmode=require

vercel env add POSTGRES_PRISMA_URL production
# 入力: postgresql://user:pass@ep-xxx.neon.tech/reservation_system?pgbouncer=true&connect_timeout=15&sslmode=require

vercel env add POSTGRES_URL_NON_POOLING production
# 入力: postgresql://user:pass@ep-xxx.neon.tech/reservation_system?sslmode=require&connect_timeout=10

# JWT認証
vercel env add JWT_SECRET production
# 入力: 本番用の秘密鍵（生成例: openssl rand -base64 32）

# メール設定（Resend）
vercel env add RESEND_API_KEY production
# 入力: Resendダッシュボードから取得したAPIキー

vercel env add EMAIL_FROM production
# 入力: noreply@yourdomain.com

vercel env add ADMIN_EMAIL production
# 入力: admin@yourdomain.com

vercel env add EMAIL_ENABLED production
# 入力: true

# 環境設定
vercel env add NODE_ENV production
# 入力: production
```

---

## ステップ6: デプロイ

### 6-1. Backend を先にデプロイ

```bash
cd backend
vercel --prod
```

デプロイ完了後、URLをメモ：
```
✅ Production: https://reservation-system-backend.vercel.app
```

### 6-2. Frontend 環境変数の設定

```bash
cd ../frontend

vercel env add NEXT_PUBLIC_API_URL production
# 入力: https://reservation-system-backend.vercel.app/api
```

### 6-3. Frontend をデプロイ

```bash
vercel --prod
```

デプロイ完了後、URLをメモ：
```
✅ Production: https://reservation-system-frontend.vercel.app
```

---

## ステップ7: デプロイ後の確認

### 7-1. ヘルスチェック

```bash
# Backend APIの動作確認
curl https://reservation-system-backend.vercel.app/api/health

# 期待される応答:
# {"status":"ok","database":"connected"}
```

### 7-2. データベース接続確認

Neon ダッシュボードの **Monitoring** タブで接続状態を確認

### 7-3. Frontend動作確認

ブラウザで https://reservation-system-frontend.vercel.app にアクセス

---

## 📋 環境変数一覧

### Backend (reservation-system-backend)

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `POSTGRES_URL` | Neon Pooled connection | `postgresql://user:pass@ep-xxx.neon.tech/...` |
| `POSTGRES_PRISMA_URL` | Neon Pooled + pgbouncer | 上記 + `?pgbouncer=true&connect_timeout=15` |
| `POSTGRES_URL_NON_POOLING` | Neon Direct connection | `postgresql://user:pass@ep-xxx.neon.tech/...` |
| `JWT_SECRET` | JWT署名用秘密鍵 | 32文字以上のランダム文字列 |
| `RESEND_API_KEY` | Resend APIキー | `re_xxxxxxxxxxxxx` |
| `EMAIL_FROM` | 送信元メールアドレス | `noreply@yourdomain.com` |
| `ADMIN_EMAIL` | 管理者メールアドレス | `admin@yourdomain.com` |
| `EMAIL_ENABLED` | メール送信有効化 | `true` |
| `NODE_ENV` | 環境識別子 | `production` |

### Frontend (reservation-system-frontend)

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://reservation-system-backend.vercel.app/api` |

---

## ⚠️ 注意事項

### Neonの制限（Free Tier）

- データベースサイズ: 0.5GB
- 月間アクティブ時間: 100時間
- 同時接続数: 100
- 非アクティブ時は自動スリープ（5分で復帰）

### Vercelの制限（Hobby Plan）

- 関数実行時間: 10秒
- デプロイメント: 無制限
- 帯域幅: 100GB/月
- Edge Functions: 100,000リクエスト/日

### セキュリティ

- `.env` ファイルは絶対にコミットしない（.gitignoreに含まれています）
- `JWT_SECRET` は本番環境用に新規生成すること
- 本番環境のパスワードは開発環境と別のものを使用

---

## 🔄 ローカル開発との共存

開発環境では引き続きDevcontainerを使用できます。

### ローカル開発用の設定

`backend/.env.local` を作成（Gitignore済み）:

```env
# ローカル開発用（Devcontainer）
POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/reservation_system
POSTGRES_PRISMA_URL=postgresql://postgres:postgres@postgres:5432/reservation_system?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@postgres:5432/reservation_system
JWT_SECRET=your-super-secret-jwt-key-for-development-only
RESEND_API_KEY=
EMAIL_FROM=noreply@localhost
ADMIN_EMAIL=admin@localhost
EMAIL_ENABLED=false
NODE_ENV=development
```

Vercelの環境変数は本番環境のみに適用され、ローカルには影響しません。

---

## 🚀 継続的デプロイ（CI/CD）

### Gitリポジトリと連携する場合

1. Vercelダッシュボードで各プロジェクトを開く
2. Settings > Git から GitHub/GitLab/Bitbucket リポジトリを連携
3. Root Directory を設定:
   - Frontend: `frontend`
   - Backend: `backend`
4. 以降、`main` ブランチへのプッシュで自動デプロイ

---

## 📚 参考リンク

- [Neon Documentation](https://neon.tech/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ❓ トラブルシューティング

### データベース接続エラー

```
Error: connect ETIMEDOUT
```

**解決策:**
- Neonの接続文字列に `?sslmode=require` が含まれているか確認
- `backend/src/lib/postgres.ts` の SSL設定を確認

### ビルドエラー

```
Error: Cannot find module 'pg'
```

**解決策:**
```bash
cd backend
npm install
vercel --prod
```

### 環境変数が反映されない

**解決策:**
- Vercelダッシュボードで環境変数を確認
- 環境が `Production` に設定されているか確認
- 再デプロイ: `vercel --prod --force`

---

以上で本番環境への移行は完了です！
