# SERENA予約システム API仕様書

## 概要
SERENA予約システムのバックエンドAPI仕様書です。  
フロントエンド開発との連携に必要な情報をまとめています。

---

## 基本情報

### ベースURL
```
開発環境: http://localhost:3000/api
```

### 共通レスポンス形式
**成功時:**
```json
{
  "success": true,
  "data": { },
  "message": "処理完了メッセージ（オプション）"
}
```

**エラー時:**
```json
{
  "success": false,
  "error": "エラーコード",
  "message": "ユーザー向けエラーメッセージ"
}
```

### HTTPステータスコード
- 200: 成功
- 201: 作成成功
- 400: バリデーションエラー
- 401: 認証エラー
- 409: 競合（重複予約等）
- 500: サーバーエラー

---

## 予約者向けAPI（認証不要）

### 1. プラン一覧取得
```
GET /public/plans
```

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "displayName": "【ご新規様限定】2回券 29,800円（税込）",
      "description": "初回限定の特別プラン"
    }
  ]
}
```

### 2. 予約可能枠確認
```
GET /public/availability?date=2025-01-20&planId=1
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "2025-01-20": {
      "11:00": { "available": true },
      "12:00": { "available": false },
      "13:00": { "available": true },
      // ... 21:00まで
    }
  }
}
```

### 3. 予約作成
```
POST /public/reserve
```

**リクエスト:**
```json
{
  "planId": 1,
  "date": "2025-01-25",
  "time": "14:00",
  "name": "山田太郎",
  "phone": "090-1234-5678",
  "email": "yamada@example.com",
  "notes": "ご要望・備考"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "reservationNumber": "R20250125-001"
  }
}
```

### 4. 予約確認
```
GET /public/reserve/check?reservationNumber=R20250125-001&email=yamada@example.com
```

### 5. 予約変更
```
PUT /public/reserve/modify
```

**リクエスト:**
```json
{
  "reservationNumber": "R20250125-001",
  "email": "yamada@example.com",
  "date": "2025-01-26",
  "time": "15:00"
}
```

### 6. 予約キャンセル
```
POST /public/reserve/cancel
```

**リクエスト:**
```json
{
  "reservationNumber": "R20250125-001",
  "email": "yamada@example.com",
  "reason": "キャンセル理由"
}
```

---

## 管理者向けAPI（認証必要）

### 認証方式
```
Authorization: Bearer {token}
```

### 7. 管理者ログイン
```
POST /admin/auth/login
```

**リクエスト:**
```json
{
  "loginId": "admin",
  "password": "password"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "8h"
  }
}
```

### 8. ダッシュボード情報取得
```
GET /admin/dashboard
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "todayReservations": [],
    "monthlyStats": {},
    "recentActivities": []
  }
}
```

### 9. 予約一覧取得（検索・フィルタリング）
```
GET /admin/reservations?startDate=2025-01-01&endDate=2025-01-31&status=confirmed
```

**パラメータ:**
- startDate: 開始日
- endDate: 終了日
- status: confirmed/cancelled
- customerName: 顧客名（部分一致）
- page: ページ番号
- limit: 件数

### 10. 予約詳細取得・編集
```
GET /admin/reservations/{id}
PUT /admin/reservations/{id}
```

### 11. 予約CSVエクスポート
```
GET /admin/reservations/export?startDate=2025-01-01&endDate=2025-01-31
```

**レスポンス:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="reservations.csv"
```

### 12. 予約受付停止設定
```
POST /admin/blocked-slots
```

**リクエスト:**
```json
{
  "date": "2025-01-25",
  "timeSlots": ["11:00", "12:00", "13:00"],
  "reason": "メンテナンス"
}
```

### 13. 予約受付停止一括設定
```
POST /admin/blocked-slots/bulk
```

**リクエスト:**
```json
{
  "startDate": "2025-01-25",
  "endDate": "2025-01-31",
  "timeSlots": ["11:00", "12:00"],
  "reason": "連休"
}
```

### 14. プラン管理
```
GET /admin/plans
POST /admin/plans
PUT /admin/plans/{id}
DELETE /admin/plans/{id}
```

**プラン更新リクエスト例:**
```json
{
  "displayName": "【ご新規様限定】2回券 29,800円（税込）",
  "description": "プラン説明文",
  "isActive": true
}
```

### 15. 管理者管理
```
GET /admin/users
POST /admin/users
PUT /admin/users/{id}
```

### 16. 顧客管理
```
GET /admin/customers
GET /admin/customers/{id}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "山田太郎",
    "email": "yamada@example.com",
    "phone": "090-1234-5678",
    "totalVisits": 3,
    "reservationHistory": []
  }
}
```

---

## フロントエンド実装用サンプルコード

### APIクライアント基本実装
```javascript
class SerenaAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('adminToken') || null;
  }

  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'APIエラー');
    }
    
    return data;
  }

  // 予約作成
  async createReservation(data) {
    return this.request('/public/reserve', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 管理者ログイン
  async adminLogin(loginId, password) {
    const response = await this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password })
    });
    
    if (response.success) {
      this.token = response.data.token;
      localStorage.setItem('adminToken', this.token);
    }
    
    return response;
  }
}
```

---

## エラーコード一覧

| コード | 説明 | 対処法 |
|--------|------|--------|
| VALIDATION_ERROR | 入力値エラー | 入力内容を確認 |
| SLOT_NOT_AVAILABLE | 予約枠なし | 別の時間を選択 |
| RESERVATION_NOT_FOUND | 予約が見つからない | 予約番号を確認 |
| UNAUTHORIZED | 認証必要 | ログインしてください |
| TOKEN_EXPIRED | トークン期限切れ | 再ログイン |

---

## 開発環境情報

### CORS設定
開発環境では `http://localhost:3001` からのアクセスを許可

### テストアカウント
```
ログインID: admin
パスワード: SerenaAdmin2025!
```

### 日時の扱い
- 営業時間: 11:00〜21:00
- 予約単位: 1時間
- タイムゾーン: JST（日本時間）

---

**バージョン**: 1.0.0  
**更新日**: 2025年1月