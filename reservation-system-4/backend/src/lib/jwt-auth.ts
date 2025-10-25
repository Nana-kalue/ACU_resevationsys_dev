import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = '8h';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function authenticateAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error('TOKEN_EXPIRED');
  }

  // 管理者の存在確認
  const admin = await sql`
    SELECT id, login_id, is_active FROM admins
    WHERE id = ${payload.adminId} AND is_active = true
  `;

  if (admin.rows.length === 0) {
    throw new Error('UNAUTHORIZED');
  }

  return admin.rows[0];
}

export async function loginAdmin(loginId: string, password: string) {
// この関数はDBのadminsテーブルに登録された管理者のみ認証します。
  try {
    const result = await sql`
      SELECT id, login_id, password_hash, is_active FROM admins
      WHERE login_id = ${loginId} AND is_active = true
    `;

    if (result.rows.length === 0) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const admin = result.rows[0];
    const isPasswordValid = await verifyPassword(password, admin.password_hash);

    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = generateToken({
      adminId: admin.id,
      loginId: admin.login_id,
    });

    return {
      token,
      admin: {
        id: admin.id,
        loginId: admin.login_id,
        name: '管理者',
        role: 'admin'
      },
      expiresIn: JWT_EXPIRES_IN
    };
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      throw error;
    }
    throw new Error('LOGIN_FAILED');
  }
}