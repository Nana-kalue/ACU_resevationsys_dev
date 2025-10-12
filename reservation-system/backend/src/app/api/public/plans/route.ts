import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { log, LogLevel } from '@/lib/utils';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT id, name, display_name, description, price, duration, is_active
      FROM plans
      WHERE is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `);

    const response: ApiResponse = {
      success: true,
      data: result.rows
    };

    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;

  } catch (error: any) {
    log(LogLevel.ERROR, '公開プラン一覧取得エラー', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'プラン一覧の取得に失敗しました'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}