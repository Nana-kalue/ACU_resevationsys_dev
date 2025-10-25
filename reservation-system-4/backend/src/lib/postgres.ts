import { Pool } from 'pg';

// PostgreSQL接続プール
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: false, // devcontainer環境ではSSL無効
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { pool };

// クエリ実行のヘルパー関数
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// プール接続のテスト
export async function testConnection() {
  try {
    const result = await query('SELECT version()');
    console.log('PostgreSQL接続成功:', result.rows[0].version);
    return true;
  } catch (error) {
    console.error('PostgreSQL接続エラー:', error);
    return false;
  }
}