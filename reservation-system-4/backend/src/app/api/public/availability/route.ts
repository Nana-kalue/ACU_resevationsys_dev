import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { generateTimeSlots, log, LogLevel } from '@/lib/utils';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const planId = searchParams.get('planId');

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '日付が必要です'
        },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'プランIDが必要です'
        },
        { status: 400 }
      );
    }

    // 実際のデータベースから空き状況を計算
    const availability = await calculateAvailabilityFromDB(date, planId);

    const response: ApiResponse = {
      success: true,
      data: {
        [date]: availability
      }
    };

    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;

  } catch (error: any) {
    log(LogLevel.ERROR, '公開空き状況取得エラー', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: '空き状況の取得に失敗しました'
      },
      { status: 500 }
    );
  }
}



// PostgreSQLから実際の空き状況を取得
async function calculateAvailabilityFromDB(date: string, planId: string) {
  const timeSlots = generateTimeSlots();
  const availability: Record<string, { available: boolean; reason?: string }> = {};

  for (const time of timeSlots) {
    let isAvailable = true;
    let reason = undefined;

    // 予約済みかチェック
    const reservations = await query(`
      SELECT id FROM reservations
      WHERE reservation_date = $1
      AND start_time = $2
      AND status = 'confirmed'
    `, [date, time]);

    // ブロック済み時間枠かチェック
    const blockedSlots = await query(`
      SELECT id, reason as block_reason FROM blocked_slots
      WHERE block_date = $1
      AND start_time <= $2
      AND end_time > $2
    `, [date, time]);

    if (reservations.rows.length > 0) {
      isAvailable = false;
      reason = '予約済み';
    } else if (blockedSlots.rows.length > 0) {
      isAvailable = false;
      reason = blockedSlots.rows[0].block_reason || '受付停止';
    }

    availability[time] = {
      available: isAvailable,
      ...(reason && { reason })
    };
  }

  return availability;
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