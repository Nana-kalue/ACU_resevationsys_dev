import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { safeQuery } from '@/lib/db';
import { log, LogLevel } from '@/lib/utils';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (request: NextRequest, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // 動的にクエリを構築
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      whereConditions.push(`r.reservation_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`r.reservation_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        r.reservation_number,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status,
        r.notes,
        r.admin_notes,
        r.created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        p.display_name as plan_name,
        p.price as plan_price
      FROM reservations r
      JOIN customers c ON r.customer_id = c.id
      JOIN plans p ON r.plan_id = p.id
      ${whereClause}
      ORDER BY r.reservation_date DESC, r.start_time DESC
    `;

    const result = await sql.query(query, queryParams);

    // CSV形式に変換
    const csvData = convertToCSV(result.rows);

    // ファイル名を生成
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `reservations_${today}.csv`;

    log(LogLevel.INFO, 'CSV エクスポート実行', {
      adminId: admin.id,
      recordCount: result.rows.length,
      filters: { startDate, endDate, status }
    });

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    log(LogLevel.ERROR, 'CSV エクスポートエラー', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'CSVエクスポートに失敗しました'
      },
      { status: 500 }
    );
  }
});

function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return 'データがありません';
  }

  // BOM付きUTF-8でエクセルで正しく表示されるようにする
  const BOM = '\uFEFF';

  // ヘッダー行
  const headers = [
    '予約番号',
    '予約日',
    '開始時間',
    '終了時間',
    'ステータス',
    'プラン名',
    '料金',
    'お客様名',
    '電話番号',
    'メールアドレス',
    'お客様備考',
    '管理者メモ',
    '予約作成日時'
  ];

  // データ行
  const rows = data.map(row => [
    row.reservation_number,
    formatDate(row.reservation_date),
    row.start_time,
    row.end_time,
    formatStatus(row.status),
    row.plan_name,
    row.plan_price ? `¥${row.plan_price.toLocaleString()}` : '',
    row.customer_name,
    row.customer_phone,
    row.customer_email,
    row.notes || '',
    row.admin_notes || '',
    formatDateTime(row.created_at)
  ]);

  // CSV文字列を構築
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return BOM + csvContent;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatDateTime(dateTimeStr: string): string {
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatStatus(status: string): string {
  switch (status) {
    case 'confirmed':
      return '確定';
    case 'cancelled':
      return 'キャンセル';
    default:
      return status;
  }
}