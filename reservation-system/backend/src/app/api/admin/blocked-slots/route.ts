import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { log, LogLevel, sanitizeString } from '@/lib/utils';
import { clearCache } from '@/lib/cache';
import { withAuth } from '@/lib/middleware';
import { ApiResponse } from '@/types';

// GET: ブロック状況を取得（一時的に認証なし）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let result;
    if (startDate && endDate) {
      result = await query(`
        SELECT * FROM blocked_slots
        WHERE block_date BETWEEN $1 AND $2
        ORDER BY block_date ASC, start_time ASC
      `, [startDate, endDate]);
    } else {
      result = await query(`
        SELECT * FROM blocked_slots
        ORDER BY block_date ASC, start_time ASC
      `);
    }

    const response: ApiResponse = {
      success: true,
      data: { blockedSlots: result.rows }
    };

    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;

  } catch (error: any) {
    log(LogLevel.ERROR, 'ブロック枠取得エラー', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'ブロック枠の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 単一ブロック枠作成（一時的に認証なし）
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.blockDate || !data.startTime || !data.endTime) {
      return NextResponse.json(
        { success: false, error: '日付、開始時間、終了時間が必要です' },
        { status: 400 }
      );
    }

    // 重複チェック
    const existingBlock = await query(`
      SELECT id FROM blocked_slots
      WHERE block_date = $1 AND start_time = $2 AND end_time = $3
    `, [data.blockDate, data.startTime, data.endTime]);

    if (existingBlock.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'この時間は既にブロックされています' },
        { status: 409 }
      );
    }

    // ブロック枠作成
    const result = await query(`
      INSERT INTO blocked_slots (block_date, start_time, end_time, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.blockDate, data.startTime, data.endTime, sanitizeString(data.reason || '')]);

    // キャッシュクリア
    clearCache('availability');

    log(LogLevel.INFO, 'ブロック枠作成成功', { blockId: result.rows[0].id });

    const response: ApiResponse = {
      success: true,
      data: { blockedSlot: result.rows[0] },
      message: 'ブロック枠が正常に作成されました'
    };

    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;

  } catch (error: any) {
    log(LogLevel.ERROR, 'ブロック枠作成エラー', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'ブロック枠の作成に失敗しました' },
      { status: 500 }
    );
  }
}

// PATCH: 一括更新（suspend画面用）（一時的に認証なし）
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.changes || typeof data.changes !== 'object') {
      return NextResponse.json(
        { success: false, error: '変更データが必要です' },
        { status: 400 }
      );
    }

    // トランザクション開始
    await query('BEGIN');

    try {
      let addedCount = 0;
      let removedCount = 0;

      for (const [key, status] of Object.entries(data.changes)) {
        const [day, time] = key.split('-');
        const blockDate = `${data.year || new Date().getFullYear()}-${data.month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
        const endTime = `${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

        if (status === 'suspended') {
          // ブロック追加
          const existing = await query(`
            SELECT id FROM blocked_slots
            WHERE block_date = $1 AND start_time = $2 AND end_time = $3
          `, [blockDate, time, endTime]);

          if (existing.rows.length === 0) {
            await query(`
              INSERT INTO blocked_slots (block_date, start_time, end_time, reason)
              VALUES ($1, $2, $3, $4)
            `, [blockDate, time, endTime, '管理者による受付停止']);
            addedCount++;
          }
        } else if (status === 'available') {
          // ブロック削除
          const result = await query(`
            DELETE FROM blocked_slots
            WHERE block_date = $1 AND start_time = $2 AND end_time = $3
          `, [blockDate, time, endTime]);
          removedCount += result.rowCount || 0;
        }
      }

      await query('COMMIT');

      // キャッシュクリア
      clearCache('availability');

      log(LogLevel.INFO, '一括ブロック更新成功', { addedCount, removedCount });

      const response: ApiResponse = {
        success: true,
        data: { addedCount, removedCount },
        message: `${addedCount}件追加、${removedCount}件削除しました`
      };

      const jsonResponse = NextResponse.json(response);
      jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
      jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return jsonResponse;

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    log(LogLevel.ERROR, '一括ブロック更新エラー', { error: error.message });
    return NextResponse.json(
      { success: false, error: '一括更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: ブロック枠削除（一時的に認証なし）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'IDが必要です' },
        { status: 400 }
      );
    }

    const result = await query(`
      DELETE FROM blocked_slots WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ブロック枠が見つかりません' },
        { status: 404 }
      );
    }

    // キャッシュクリア
    clearCache('availability');

    log(LogLevel.INFO, 'ブロック枠削除成功', { blockId: id });

    const response: ApiResponse = {
      success: true,
      message: 'ブロック枠が正常に削除されました'
    };

    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return jsonResponse;

  } catch (error: any) {
    log(LogLevel.ERROR, 'ブロック枠削除エラー', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'ブロック枠の削除に失敗しました' },
      { status: 500 }
    );
  }
}
// CORS対応のOPTIONSメソッド
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
