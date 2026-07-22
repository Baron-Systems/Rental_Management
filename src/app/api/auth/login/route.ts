import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const user = await loginUser(parsed.data.identifier, parsed.data.password);

    if (!user) {
      return NextResponse.json({ error: 'بيانات تسجيل الدخول غير صحيحة' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 });
  }
}
