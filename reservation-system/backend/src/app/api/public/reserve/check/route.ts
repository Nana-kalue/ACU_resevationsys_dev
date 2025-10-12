import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { safeQuery } from '@/lib/db';
import { log, LogLevel, validateEmail } from '@/lib/utils';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationNumber = searchParams.get('reservationNumber');
    const email = searchParams.get('email');

    if (!reservationNumber?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '予約番号が必要です'
        },
        { status: 400 }
      );
    }

    if (!email?.trim() || !validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '有効なメールアドレスが必要です'
        },
        { status: 400 }
      );
    }

    // 予約情報を取得
    const result = await safeQuery(() => sql`
      SELECT
        r.id,
        r.reservation_number,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status,
        r.notes,
        r.created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        p.display_name as plan_name,
        p.description as plan_description,
        p.price as plan_price
      FROM reservations r
      JOIN customers c ON r.customer_id = c.id
      JOIN plans p ON r.plan_id = p.id
      WHERE r.reservation_number = ${reservationNumber}
      AND c.email = ${email}
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'RESERVATION_NOT_FOUND',
          message: '予約が見つかりません。予約番号とメールアドレスをご確認ください。'
        },
        { status: 404 }
      );
    }

    const reservation = result.rows[0];

    log(LogLevel.INFO, '予約確認成功', {
      reservationNumber,
      email: email.substring(0, 3) + '***'
    });

    const response: ApiResponse = {
      success: true,
      data: {
        reservationNumber: reservation.reservation_number,
        status: reservation.status,
        planName: reservation.plan_name,
        planDescription: reservation.plan_description,
        planPrice: reservation.plan_price,
        date: reservation.reservation_date,
        time: reservation.start_time,
        endTime: reservation.end_time,
        customerName: reservation.customer_name,
        phone: reservation.customer_phone,
        email: reservation.customer_email,
        notes: reservation.notes,
        createdAt: reservation.created_at
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    log(LogLevel.ERROR, '予約確認エラー', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: '予約確認に失敗しました'
      },
      { status: 500 }
    );
  }
}