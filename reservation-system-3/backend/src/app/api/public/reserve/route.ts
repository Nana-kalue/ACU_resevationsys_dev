import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { log, LogLevel, validateEmail, validatePhone, sanitizeString } from '@/lib/utils';
import { clearCache } from '@/lib/cache';
import { ApiResponse, ReservationFormData } from '@/types';

// 日付を正規化する関数
function normalizeDate(dateStr: string): string {
  // "9/30" のような形式を "2025-09-30" に変換
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 2) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    }
  }
  return dateStr;
}

export async function POST(request: NextRequest) {
  try {
    log(LogLevel.INFO, '新規予約リクエスト受信', {
      userAgent: request.headers.get('User-Agent'),
      timestamp: Date.now()
    });

    const rawData: ReservationFormData = await request.json();

    // 日付を正規化
    const data = {
      ...rawData,
      date: normalizeDate(rawData.date)
    };

    // バリデーション
    if (!data.name?.trim()) {
      const validationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'お名前が必要です'
        },
        { status: 400 }
      );
      validationResponse.headers.set('Access-Control-Allow-Origin', '*');
      validationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      validationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return validationResponse;
    }

    if (!validateEmail(data.email)) {
      const emailValidationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '有効なメールアドレスを入力してください'
        },
        { status: 400 }
      );
      emailValidationResponse.headers.set('Access-Control-Allow-Origin', '*');
      emailValidationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      emailValidationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return emailValidationResponse;
    }

    if (!validatePhone(data.phone)) {
      const phoneValidationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '有効な電話番号を入力してください'
        },
        { status: 400 }
      );
      phoneValidationResponse.headers.set('Access-Control-Allow-Origin', '*');
      phoneValidationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      phoneValidationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return phoneValidationResponse;
    }

    if (!data.planId || !data.date || !data.time) {
      const requiredFieldsResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '必須項目が不足しています'
        },
        { status: 400 }
      );
      requiredFieldsResponse.headers.set('Access-Control-Allow-Origin', '*');
      requiredFieldsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      requiredFieldsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return requiredFieldsResponse;
    }

    // 日付フォーマットの確認
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      const dateFormatResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '無効な日付フォーマットです'
        },
        { status: 400 }
      );
      dateFormatResponse.headers.set('Access-Control-Allow-Origin', '*');
      dateFormatResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      dateFormatResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return dateFormatResponse;
    }

    // 顧客情報の取得または作成
    let customer = await query(`
      SELECT * FROM customers WHERE email = $1
    `, [data.email]);

    let customerId: string;
    if (customer.rows.length === 0) {
      // 新規顧客作成
      const newCustomer = await query(`
        INSERT INTO customers (name, email, phone)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [sanitizeString(data.name), data.email, data.phone]);
      customerId = newCustomer.rows[0].id;
    } else {
      // 既存顧客はIDのみ使用（情報は更新しない）
      customerId = customer.rows[0].id;

      // 顧客情報が異なる場合は警告ログを出力
      const existingCustomer = customer.rows[0];
      if (existingCustomer.name !== sanitizeString(data.name) || existingCustomer.phone !== data.phone) {
        log(LogLevel.INFO, '既存顧客情報と異なる情報での予約', {
          email: data.email,
          existing: { name: existingCustomer.name, phone: existingCustomer.phone },
          provided: { name: sanitizeString(data.name), phone: data.phone }
        });
      }
    }

    // 終了時間を計算（1時間後）
    const startHour = parseInt(data.time.split(':')[0]);
    const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;

    // トランザション開始
    await query('BEGIN');

    try {
      // 同時予約チェック（悲観的ロック）
      const existingReservation = await query(`
        SELECT id FROM reservations
        WHERE reservation_date = $1
        AND start_time = $2
        AND status = 'confirmed'
        FOR UPDATE
      `, [data.date, data.time]);

      if (existingReservation.rows.length > 0) {
        await query('ROLLBACK');
        const conflictResponse = NextResponse.json(
          {
            success: false,
            error: 'SLOT_NOT_AVAILABLE',
            message: 'この時間は既に予約されています'
          },
          { status: 409 }
        );
        conflictResponse.headers.set('Access-Control-Allow-Origin', '*');
        conflictResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        conflictResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return conflictResponse;
      }

      // 予約番号を生成
      const reservationNumberResult = await query('SELECT generate_reservation_number() as number');
      const reservationNumber = reservationNumberResult.rows[0].number;

      // 予約作成
      const reservation = await query(`
        INSERT INTO reservations (reservation_number, customer_id, plan_id, reservation_date, start_time, end_time, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [reservationNumber, customerId, data.planId, data.date, data.time, endTime, data.notes ? sanitizeString(data.notes) : null]);

      await query('COMMIT');

      const reservationRecord = reservation.rows[0];

      // キャッシュクリア
      clearCache('availability');

      log(LogLevel.INFO, '予約作成成功', { reservationId: reservationRecord.id });

      const response: ApiResponse = {
        success: true,
        data: {
          reservationNumber: reservationRecord.reservation_number
        },
        message: '予約が正常に作成されました'
      };

      const jsonResponse = NextResponse.json(response, { status: 201 });
      jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
      jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return jsonResponse;

    } catch (transactionError: any) {
      await query('ROLLBACK');
      throw transactionError;
    }

  } catch (error: any) {

    log(LogLevel.ERROR, '予約作成エラー', {
      error: error.message,
      stack: error.stack
    });

    const serverErrorResponse = NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: '予約の作成に失敗しました'
      },
      { status: 500 }
    );
    serverErrorResponse.headers.set('Access-Control-Allow-Origin', '*');
    serverErrorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    serverErrorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return serverErrorResponse;
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