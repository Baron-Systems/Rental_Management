import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';

export interface SessionData {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'rental_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession() {
  const cookieStore = cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function loginUser(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      OR: [
        { email: identifier },
        { phone: identifier },
      ],
    },
  });

  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  const session = await getSession();
  session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
  };
  await session.save();

  return session.user;
}

export async function logoutUser() {
  const session = await getSession();
  session.destroy();
}
