import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/jwt-auth';
import { log, LogLevel } from '@/lib/utils';

export function withAuth(handler: (request: NextRequest, admin: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const admin = await authenticateAdmin(request);
      return await handler(request, admin);
    } catch (error: any) {
      log(LogLevel.WARN, '認証エラー', { error: error.message });

      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          {
            success: false,
            error: 'UNAUTHORIZED',
            message: '認証が必要です'
          },
          { status: 401 }
        );
      }

      if (error.message === 'TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            success: false,
            error: 'TOKEN_EXPIRED',
            message: 'トークンの有効期限が切れています'
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'SERVER_ERROR',
          message: '認証処理でエラーが発生しました'
        },
        { status: 500 }
      );
    }
  };
}