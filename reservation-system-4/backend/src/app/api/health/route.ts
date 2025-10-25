import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // データベース接続確認
    const dbHealthy = await testConnection();
    const dbTime = Date.now() - startTime;
    
    // メール送信サービス確認
    const resendHealthy = !!process.env.RESEND_API_KEY;
    
    // 認証設定確認
    const authHealthy = !!process.env.JWT_SECRET;
    
    const health = {
      status: dbHealthy && resendHealthy && authHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          responseTime: `${dbTime}ms`
        },
        email: {
          status: resendHealthy ? 'healthy' : 'unhealthy',
          configured: resendHealthy
        },
        auth: {
          status: authHealthy ? 'healthy' : 'unhealthy',
          configured: authHealthy
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}