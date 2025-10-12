import { Resend } from 'resend';
import { sql } from '@vercel/postgres';
import { safeQuery } from './db';
import { log, LogLevel } from './utils';
import { EmailTemplate } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailWithRetry(
  emailData: any,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await resend.emails.send(emailData);
    } catch (error: any) {
      log(LogLevel.ERROR, `メール送信失敗 (試行 ${attempt}/${maxRetries})`, { error: error.message });
      
      if (attempt === maxRetries) {
        await saveToEmailQueue(emailData);
        throw new Error('メール送信に失敗しました');
      }
      
      // 指数バックオフ
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

export async function saveToEmailQueue(emailData: any) {
  try {
    await safeQuery(() => sql`
      INSERT INTO email_queue (to_email, subject, html_content, text_content)
      VALUES (${emailData.to}, ${emailData.subject}, ${emailData.html}, ${emailData.text || ''})
    `);
  } catch (error: any) {
    log(LogLevel.ERROR, 'メールキュー保存エラー', { error: error.message });
  }
}

export async function sendReservationConfirmationEmail(reservation: any, customer: any, plan: any) {
  const emailData = {
    from: process.env.EMAIL_FROM || 'noreply@serena.com',
    to: customer.email,
    subject: '【予約確認】ご予約を承りました',
    html: generateReservationConfirmationHTML(reservation, customer, plan),
    text: generateReservationConfirmationText(reservation, customer, plan)
  };
  
  try {
    const result = await sendEmailWithRetry(emailData);
    log(LogLevel.INFO, '予約確認メール送信成功', { 
      reservationId: reservation.id,
      customerId: customer.id
    });
    return result;
  } catch (error: any) {
    log(LogLevel.ERROR, '予約確認メール送信失敗', { 
      error: error.message,
      reservationId: reservation.id
    });
    throw error;
  }
}

export async function sendAdminNotificationEmail(reservation: any, customer: any, plan: any) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@serena.com';
  
  const emailData = {
    from: process.env.EMAIL_FROM || 'noreply@serena.com',
    to: adminEmail,
    subject: `【新規予約】${customer.name}様からの予約`,
    html: generateAdminNotificationHTML(reservation, customer, plan),
    text: generateAdminNotificationText(reservation, customer, plan)
  };
  
  try {
    const result = await sendEmailWithRetry(emailData);
    log(LogLevel.INFO, '管理者通知メール送信成功', { 
      reservationId: reservation.id
    });
    return result;
  } catch (error: any) {
    log(LogLevel.ERROR, '管理者通知メール送信失敗', { 
      error: error.message,
      reservationId: reservation.id
    });
    // 管理者通知の失敗は予約処理を止めない
  }
}

export async function sendCancellationEmail(reservation: any, customer: any, plan: any) {
  const emailData = {
    from: process.env.EMAIL_FROM || 'noreply@serena.com',
    to: customer.email,
    subject: '【予約キャンセル】予約がキャンセルされました',
    html: generateCancellationHTML(reservation, customer, plan),
    text: generateCancellationText(reservation, customer, plan)
  };
  
  try {
    const result = await sendEmailWithRetry(emailData);
    log(LogLevel.INFO, 'キャンセル通知メール送信成功', { 
      reservationId: reservation.id
    });
    return result;
  } catch (error: any) {
    log(LogLevel.ERROR, 'キャンセル通知メール送信失敗', { 
      error: error.message,
      reservationId: reservation.id
    });
    throw error;
  }
}

function generateReservationConfirmationHTML(reservation: any, customer: any, plan: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
            .content { padding: 20px 0; }
            .reservation-details { background-color: #f1f3f4; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 0.9em; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>ご予約確認</h1>
                <p>この度はご予約いただき、誠にありがとうございます。</p>
            </div>
            
            <div class="content">
                <p>以下の内容でご予約を承りました。</p>
                
                <div class="reservation-details">
                    <h3>予約詳細</h3>
                    <p><strong>お名前:</strong> ${customer.name}様</p>
                    <p><strong>メニュー:</strong> ${plan.name}</p>
                    <p><strong>日時:</strong> ${reservation.reservation_date} ${reservation.start_time} - ${reservation.end_time}</p>
                    <p><strong>電話番号:</strong> ${customer.phone}</p>
                    ${reservation.notes ? `<p><strong>ご要望:</strong> ${reservation.notes}</p>` : ''}
                </div>
                
                <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
                <p>当日お会いできることを楽しみにしております。</p>
            </div>
            
            <div class="footer">
                <p>このメールは予約システムから自動送信されています。</p>
                <p>返信はできませんので、お問い合わせは店舗までお電話ください。</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateReservationConfirmationText(reservation: any, customer: any, plan: any): string {
  return `
【予約確認】ご予約を承りました

${customer.name}様

この度はご予約いただき、誠にありがとうございます。
以下の内容でご予約を承りました。

■予約詳細
お名前: ${customer.name}様
メニュー: ${plan.name}
日時: ${reservation.reservation_date} ${reservation.start_time} - ${reservation.end_time}
電話番号: ${customer.phone}
${reservation.notes ? `ご要望: ${reservation.notes}` : ''}

ご不明な点がございましたら、お気軽にお問い合わせください。
当日お会いできることを楽しみにしております。

※このメールは予約システムから自動送信されています。
  `;
}

function generateAdminNotificationHTML(reservation: any, customer: any, plan: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .reservation-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="alert">
                <h2>新規予約通知</h2>
                <p>新しい予約が入りました。</p>
            </div>
            
            <div class="reservation-details">
                <h3>予約詳細</h3>
                <p><strong>お客様名:</strong> ${customer.name}</p>
                <p><strong>メールアドレス:</strong> ${customer.email}</p>
                <p><strong>電話番号:</strong> ${customer.phone}</p>
                <p><strong>メニュー:</strong> ${plan.name}</p>
                <p><strong>日時:</strong> ${reservation.reservation_date} ${reservation.start_time} - ${reservation.end_time}</p>
                <p><strong>予約ID:</strong> ${reservation.id}</p>
                ${reservation.notes ? `<p><strong>ご要望:</strong> ${reservation.notes}</p>` : ''}
                <p><strong>予約日時:</strong> ${reservation.created_at}</p>
            </div>
            
            <p>管理画面から詳細を確認してください。</p>
        </div>
    </body>
    </html>
  `;
}

function generateAdminNotificationText(reservation: any, customer: any, plan: any): string {
  return `
【新規予約通知】

新しい予約が入りました。

■予約詳細
お客様名: ${customer.name}
メールアドレス: ${customer.email}
電話番号: ${customer.phone}
メニュー: ${plan.name}
日時: ${reservation.reservation_date} ${reservation.start_time} - ${reservation.end_time}
予約ID: ${reservation.id}
${reservation.notes ? `ご要望: ${reservation.notes}` : ''}
予約日時: ${reservation.created_at}

管理画面から詳細を確認してください。
  `;
}

function generateCancellationHTML(reservation: any, customer: any, plan: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #fff3cd; padding: 20px; text-align: center; border-radius: 8px; }
            .content { padding: 20px 0; }
            .reservation-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>予約キャンセルのお知らせ</h1>
            </div>
            
            <div class="content">
                <p>${customer.name}様</p>
                <p>以下の予約がキャンセルされました。</p>
                
                <div class="reservation-details">
                    <h3>キャンセルされた予約</h3>
                    <p><strong>メニュー:</strong> ${plan.name}</p>
                    <p><strong>日時:</strong> ${reservation.reservation_date} ${reservation.start_time} - ${reservation.end_time}</p>
                    <p><strong>予約ID:</strong> ${reservation.id}</p>
                </div>
                
                <p>またのご利用をお待ちしております。</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateCancellationText(reservation: any, customer: any, plan: any): string {
  return `
【予約キャンセル】予約がキャンセルされました

${customer.name}様

以下の予約がキャンセルされました。

■キャンセルされた予約
メニュー: ${plan.name}
日時: ${reservation.reservation_date} ${reservation.start_time} - ${reservation.end_time}
予約ID: ${reservation.id}

またのご利用をお待ちしております。
  `;
}