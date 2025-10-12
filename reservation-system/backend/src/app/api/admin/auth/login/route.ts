import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/jwt-auth';
import { log, LogLevel } from '@/lib/utils';
import { ApiResponse, AdminLoginData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: AdminLoginData = await request.json();

    if (!data.loginId?.trim() || !data.password?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'ログインIDとパスワードが必要です'
        },
        { status: 400 }
      );
    }

    const authResult = await loginAdmin(data.loginId, data.password);

    log(LogLevel.INFO, '管理者ログイン成功', { loginId: data.loginId });

    const response: ApiResponse = {
      success: true,
      data: authResult
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    log(LogLevel.ERROR, '管理者ログインエラー', {
      error: error.message,
      stack: error.stack
    });

    if (error.message === 'INVALID_CREDENTIALS') {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'ログインIDまたはパスワードが正しくありません'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'ログインに失敗しました'
      },
      { status: 500 }
    );
  }
}