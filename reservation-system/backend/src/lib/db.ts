import { sql } from '@vercel/postgres';

export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('DB接続成功:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('DB接続エラー:', error);
    return false;
  }
}

export async function safeQuery(queryFn: Function) {
  try {
    return await queryFn();
  } catch (error: any) {
    if (error.message.includes('connection')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await queryFn();
    }
    throw error;
  }
}

export async function createReservationSafely(reservationData: any) {
  await sql`BEGIN`;

  try {
    const existingReservation = await sql`
      SELECT id FROM reservations
      WHERE reservation_date = ${reservationData.reservationDate}
      AND start_time = ${reservationData.startTime}
      AND status = 'confirmed'
      FOR UPDATE
    `;

    if (existingReservation.rows.length > 0) {
      await sql`ROLLBACK`;
      throw new Error('SLOT_ALREADY_BOOKED');
    }

    // 予約番号を生成
    const reservationNumberResult = await sql`SELECT generate_reservation_number() as number`;
    const reservationNumber = reservationNumberResult.rows[0].number;

    const result = await sql`
      INSERT INTO reservations (reservation_number, customer_id, plan_id, reservation_date, start_time, end_time, notes)
      VALUES (${reservationNumber}, ${reservationData.customerId}, ${reservationData.planId}, ${reservationData.reservationDate}, ${reservationData.startTime}, ${reservationData.endTime}, ${reservationData.notes})
      RETURNING *
    `;

    await sql`COMMIT`;
    return result.rows[0];

  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
}

export { sql };