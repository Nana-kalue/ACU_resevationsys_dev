import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { log, LogLevel } from '@/lib/utils';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerName = searchParams.get('customerName');

    const offset = (page - 1) * limit;

    // 動的にクエリを構築
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

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

    if (customerName) {
      whereConditions.push(`c.name ILIKE $${paramIndex}`);
      queryParams.push(`%${customerName}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 総件数取得
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reservations r
      JOIN customers c ON r.customer_id = c.id
      ${whereClause}
    `;

    // データ取得
    const dataQuery = `
      SELECT
        r.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        p.display_name as plan_name,
        p.description as plan_description
      FROM reservations r
      JOIN customers c ON r.customer_id = c.id
      JOIN plans p ON r.plan_id = p.id
      ${whereClause}
      ORDER BY r.reservation_date DESC, r.start_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const [totalResult, reservationsResult] = await Promise.all([
      query(countQuery, queryParams.slice(0, -2)), // limitとoffsetを除く
      query(dataQuery, queryParams)
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        reservations: reservationsResult.rows,
        total: parseInt(totalResult.rows[0].total),
        page,
        totalPages: Math.ceil(totalResult.rows[0].total / limit)
      }
    };

    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;

  } catch (error: any) {
    log(LogLevel.ERROR, '管理者予約一覧取得エラー', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: '予約の取得に失敗しました'
      },
      { status: 500 }
    );
  }
}

// CORS対応のOPTIONSメソッド
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}