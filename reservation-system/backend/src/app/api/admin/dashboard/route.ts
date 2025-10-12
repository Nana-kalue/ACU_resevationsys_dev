import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { safeQuery } from '@/lib/db';
import { log, LogLevel, formatJSTDate } from '@/lib/utils';
import { withAuth } from '@/lib/middleware';
import { ApiResponse } from '@/types';

export const GET = withAuth(async (request: NextRequest, admin: any) => {
  try {
    const today = formatJSTDate(new Date());
    
    // 並列でダッシュボードデータを取得
    const [
      todayReservations,
      weeklyStats,
      monthlyRevenue,
      recentCustomers
    ] = await Promise.all([
      getTodayReservations(today),
      getWeeklyStats(),
      getMonthlyRevenue(),
      getRecentCustomers()
    ]);
    
    const response: ApiResponse = {
      success: true,
      data: {
        todayReservations,
        weeklyStats,
        monthlyRevenue,
        recentCustomers
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    log(LogLevel.ERROR, 'ダッシュボードデータ取得エラー', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    );
  }
});

async function getTodayReservations(today: string) {
  const result = await safeQuery(() => sql`
    SELECT 
      r.*,
      c.name as customer_name,
      c.phone as customer_phone,
      p.name as plan_name
    FROM reservations r
    JOIN customers c ON r.customer_id = c.id
    JOIN plans p ON r.plan_id = p.id
    WHERE r.reservation_date = ${today}
    AND r.status = 'confirmed'
    ORDER BY r.start_time ASC
  `);
  
  return result.rows;
}

async function getWeeklyStats() {
  const result = await safeQuery(() => sql`
    SELECT 
      COUNT(*) as total_reservations,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_reservations,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_reservations
    FROM reservations 
    WHERE reservation_date >= CURRENT_DATE - INTERVAL '7 days'
    AND reservation_date <= CURRENT_DATE
  `);
  
  return result.rows[0];
}

async function getMonthlyRevenue() {
  const result = await safeQuery(() => sql`
    SELECT 
      SUM(p.price) as total_revenue,
      COUNT(r.id) as total_bookings
    FROM reservations r
    JOIN plans p ON r.plan_id = p.id
    WHERE r.reservation_date >= DATE_TRUNC('month', CURRENT_DATE)
    AND r.status = 'confirmed'
  `);
  
  return result.rows[0];
}

async function getRecentCustomers() {
  const result = await safeQuery(() => sql`
    SELECT DISTINCT
      c.id,
      c.name,
      c.email,
      c.phone,
      MAX(r.created_at) as last_reservation
    FROM customers c
    JOIN reservations r ON c.id = r.customer_id
    WHERE r.status = 'confirmed'
    GROUP BY c.id, c.name, c.email, c.phone
    ORDER BY last_reservation DESC
    LIMIT 10
  `);
  
  return result.rows;
}