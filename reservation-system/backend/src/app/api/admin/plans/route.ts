import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { safeQuery } from '@/lib/db';
import { log, LogLevel, sanitizeString } from '@/lib/utils';
import { clearCache } from '@/lib/cache';
import { withAuth } from '@/lib/middleware';
import { ApiResponse } from '@/types';

export const GET = withAuth(async (request: NextRequest, admin: any) => {
  try {
    const result = await safeQuery(() => sql`
      SELECT * FROM plans
      ORDER BY sort_order ASC, created_at DESC
    `);

    const response: ApiResponse = {
      success: true,
      data: result.rows
    };

    return NextResponse.json(response);

  } catch (error: any) {
    log(LogLevel.ERROR, '管理者プラン一覧取得エラー', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'プラン一覧の取得に失敗しました'
      },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, admin: any) => {
  try {
    const data = await request.json();

    if (!data.name?.trim() || !data.displayName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'プラン名と表示名が必要です'
        },
        { status: 400 }
      );
    }

    if (data.price && (isNaN(data.price) || data.price < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '有効な価格を入力してください'
        },
        { status: 400 }
      );
    }

    // プラン作成
    const result = await safeQuery(() => sql`
      INSERT INTO plans (name, display_name, description, price, duration, sort_order, is_active)
      VALUES (
        ${sanitizeString(data.name)},
        ${sanitizeString(data.displayName)},
        ${data.description ? sanitizeString(data.description) : null},
        ${data.price || null},
        ${data.duration || 60},
        ${data.sortOrder || 0},
        ${data.isActive !== false}
      )
      RETURNING *
    `);

    // キャッシュクリア
    clearCache('plans');

    log(LogLevel.INFO, 'プラン作成成功', { planId: result.rows[0].id, adminId: admin.id });

    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      message: 'プランが正常に作成されました'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    log(LogLevel.ERROR, 'プラン作成エラー', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'プランの作成に失敗しました'
      },
      { status: 500 }
    );
  }
});