const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分

export function getCached(key: string) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

export function setCache(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function clearCache(keyPattern?: string) {
  if (keyPattern) {
    for (const key of cache.keys()) {
      if (key.includes(keyPattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

export async function getAvailabilityCached(startDate: string, endDate: string) {
  const cacheKey = `availability_${startDate}_${endDate}`;
  let availability = getCached(cacheKey);
  
  if (!availability) {
    // calculateAvailability関数は別途実装
    availability = await calculateAvailability(startDate, endDate);
    setCache(cacheKey, availability);
  }
  
  return availability;
}

async function calculateAvailability(date: string, planId?: string) {
  const { sql } = await import('@vercel/postgres');
  const { generateTimeSlots } = await import('./utils');

  const timeSlots = generateTimeSlots();
  const availability: Record<string, { available: boolean; reason?: string }> = {};

  for (const time of timeSlots) {
    let isAvailable = true;
    let reason = undefined;

    try {
      // 予約済みかチェック
      const reservations = await sql`
        SELECT id FROM reservations
        WHERE reservation_date = ${date}
        AND start_time = ${time}
        AND status = 'confirmed'
      `;

      // ブロック済み時間枠かチェック
      const blockedSlots = await sql`
        SELECT id FROM blocked_slots
        WHERE block_date = ${date}
        AND start_time <= ${time}
        AND end_time > ${time}
        AND is_active = true
      `;

      if (reservations.rows.length > 0) {
        isAvailable = false;
        reason = '予約済み';
      } else if (blockedSlots.rows.length > 0) {
        isAvailable = false;
        reason = '受付停止';
      }

    } catch (error) {
      console.error('Error checking availability:', error);
      // エラーの場合は安全のため利用不可に
      isAvailable = false;
      reason = 'システムエラー';
    }

    availability[time] = {
      available: isAvailable,
      ...(reason && { reason })
    };
  }

  return availability;
}