import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getSession, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { newEmail, password } = body;

    if (!newEmail || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const valid = await verifyPassword(password, existingUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 400 });
    }

    const duplicate = await prisma.user.findUnique({ where: { email: newEmail } });
    if (duplicate && duplicate.id !== user.id) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    const session = await getSession();
    if (session.user) {
      session.user.email = newEmail;
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
