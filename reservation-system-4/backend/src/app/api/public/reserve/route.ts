import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { log, LogLevel, validateEmail, validatePhone, sanitizeString } from '@/lib/utils';
import { clearCache } from '@/lib/cache';
import { ApiResponse, ReservationFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    log(LogLevel.INFO, '新規予約リクエスト受信', {
      userAgent: request.headers.get('User-Agent'),
      timestamp: Date.now()
    });

    const data: ReservationFormData = await request.json();

    // バリデーション
    if (!data.customer?.name?.trim()) {
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

    if (!data.customer.furigana?.trim()) {
      const furiganaValidationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'フリガナが必要です'
        },
        { status: 400 }
      );
      furiganaValidationResponse.headers.set('Access-Control-Allow-Origin', '*');
      furiganaValidationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      furiganaValidationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return furiganaValidationResponse;
    }

    if (!data.customer.gender?.trim()) {
      const genderValidationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '性別が必要です'
        },
        { status: 400 }
      );
      genderValidationResponse.headers.set('Access-Control-Allow-Origin', '*');
      genderValidationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      genderValidationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return genderValidationResponse;
    }

    if (!data.customer.birthdate?.trim()) {
      const birthdateValidationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '生年月日が必要です'
        },
        { status: 400 }
      );
      birthdateValidationResponse.headers.set('Access-Control-Allow-Origin', '*');
      birthdateValidationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      birthdateValidationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return birthdateValidationResponse;
    }

    if (!data.customer.address?.trim()) {
      const addressValidationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'ご住所が必要です'
        },
        { status: 400 }
      );
      addressValidationResponse.headers.set('Access-Control-Allow-Origin', '*');
      addressValidationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      addressValidationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return addressValidationResponse;
    }

    // メールアドレスは任意だが、入力されている場合は検証
    if (data.customer.email && !validateEmail(data.customer.email)) {
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

    if (!validatePhone(data.customer.phone)) {
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

    if (!data.planId || !data.reservationDate || !data.startTime) {
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.reservationDate)) {
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

    // 事前問診のバリデーション
    if (!data.questionnaire?.symptoms?.trim()) {
      const symptomsValidationResponse = NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '現在の症状や気になる部位を入力してください'
        },
        { status: 400 }
      );
      symptomsValidationResponse.headers.set('Access-Control-Allow-Origin', '*');
      symptomsValidationResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      symptomsValidationResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return symptomsValidationResponse;
    }

    // 顧客情報の取得または作成
    // 電話番号をキーとして既存顧客を検索
    let customer = await query(`
      SELECT * FROM customers WHERE phone = $1
    `, [data.customer.phone]);

    let customerId: string;
    if (customer.rows.length === 0) {
      // 新規顧客作成
      const newCustomer = await query(`
        INSERT INTO customers (name, furigana, gender, birthdate, age, email, phone, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        sanitizeString(data.customer.name),
        sanitizeString(data.customer.furigana),
        sanitizeString(data.customer.gender),
        data.customer.birthdate,
        parseInt(data.customer.age),
        data.customer.email || null,
        data.customer.phone,
        sanitizeString(data.customer.address)
      ]);
      customerId = newCustomer.rows[0].id;
      log(LogLevel.INFO, '新規顧客作成', { customerId, phone: data.customer.phone });
    } else {
      // 既存顧客の情報を更新
      customerId = customer.rows[0].id;
      await query(`
        UPDATE customers
        SET name = $1, furigana = $2, gender = $3, birthdate = $4, age = $5, email = $6, address = $7, updated_at = now()
        WHERE id = $8
      `, [
        sanitizeString(data.customer.name),
        sanitizeString(data.customer.furigana),
        sanitizeString(data.customer.gender),
        data.customer.birthdate,
        parseInt(data.customer.age),
        data.customer.email || null,
        sanitizeString(data.customer.address),
        customerId
      ]);
      log(LogLevel.INFO, '既存顧客情報更新', { customerId, phone: data.customer.phone });
    }

    // 終了時間を計算（1時間後）
    const startHour = parseInt(data.startTime.split(':')[0]);
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
      `, [data.reservationDate, data.startTime]);

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
        INSERT INTO reservations (reservation_number, customer_id, plan_id, reservation_date, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [reservationNumber, customerId, data.planId, data.reservationDate, data.startTime, endTime]);

      const reservationId = reservation.rows[0].id;

      // 事前問診データを保存
      await query(`
        INSERT INTO questionnaires (reservation_id, symptoms, medical_history, current_medication, allergies, pregnancy, other_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        reservationId,
        sanitizeString(data.questionnaire.symptoms),
        data.questionnaire.medicalHistory ? sanitizeString(data.questionnaire.medicalHistory) : null,
        data.questionnaire.currentMedication ? sanitizeString(data.questionnaire.currentMedication) : null,
        data.questionnaire.allergies ? sanitizeString(data.questionnaire.allergies) : null,
        data.questionnaire.pregnancy || null,
        data.questionnaire.otherNotes ? sanitizeString(data.questionnaire.otherNotes) : null
      ]);

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
