import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { safeQuery } from '@/lib/db';
import { log, LogLevel, validateEmail, sanitizeString } from '@/lib/utils';
import { clearCache } from '@/lib/cache';
import { ApiResponse, ReservationCancelData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: ReservationCancelData = await request.json();

    if (!data.reservationNumber?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '予約番号が必要です'
        },
        { status: 400 }
      );
    }

    if (!data.email?.trim() || !validateEmail(data.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '有効なメールアドレスが必要です'
        },
        { status: 400 }
      );
    }

    // 予約の存在確認と更新
    await sql`BEGIN`;

    try {
      // 予約情報を取得
      const reservation = await safeQuery(() => sql`
        SELECT
          r.id,
          r.reservation_number,
          r.status,
          r.reservation_date,
          r.start_time,
          c.email as customer_email
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.reservation_number = ${data.reservationNumber}
        AND c.email = ${data.email}
        FOR UPDATE
      `);

      if (reservation.rows.length === 0) {
        await sql`ROLLBACK`;
        return NextResponse.json(
          {
            success: false,
            error: 'RESERVATION_NOT_FOUND',
            message: '予約が見つかりません。予約番号とメールアドレスをご確認ください。'
          },
          { status: 404 }
        );
      }

      const reservationData = reservation.rows[0];

      if (reservationData.status === 'cancelled') {
        await sql`ROLLBACK`;
        return NextResponse.json(
          {
            success: false,
            error: 'ALREADY_CANCELLED',
            message: 'この予約は既にキャンセルされています'
          },
          { status: 400 }
        );
      }

      // 予約日が過去の場合はキャンセル不可
      const reservationDate = new Date(reservationData.reservation_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reservationDate < today) {
        await sql`ROLLBACK`;
        return NextResponse.json(
          {
            success: false,
            error: 'PAST_RESERVATION',
            message: '過去の予約はキャンセルできません'
          },
          { status: 400 }
        );
      }

      // 予約をキャンセル状態に更新
      await safeQuery(() => sql`
        UPDATE reservations
        SET
          status = 'cancelled',
          admin_notes = COALESCE(admin_notes, '') ||
            CASE
              WHEN admin_notes IS NULL OR admin_notes = '' THEN ''
              ELSE E'\n'
            END ||
            'お客様都合によるキャンセル' ||
            CASE
              WHEN ${data.reason} IS NOT NULL AND ${data.reason} != ''
              THEN ': ' || ${sanitizeString(data.reason)}
              ELSE ''
            END ||
            ' (キャンセル日時: ' || now()::timestamp(0) || ')',
          updated_at = now()
        WHERE id = ${reservationData.id}
      `);

      await sql`COMMIT`;

      // キャッシュクリア
      clearCache('availability');

      log(LogLevel.INFO, '予約キャンセル成功', {
        reservationNumber: data.reservationNumber,
        email: data.email.substring(0, 3) + '***'
      });

      const response: ApiResponse = {
        success: true,
        message: '予約をキャンセルしました。確認メールをお送りしました。'
      };

      return NextResponse.json(response);

    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error: any) {
    log(LogLevel.ERROR, '予約キャンセルエラー', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: '予約のキャンセルに失敗しました'
      },
      { status: 500 }
    );
  }
}