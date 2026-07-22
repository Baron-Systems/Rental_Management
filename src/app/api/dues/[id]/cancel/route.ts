import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { cancellationSchema } from '@/lib/validation';
import { cancelDue } from '@/services/cancellation.service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const { id } = params;
    console.log('[DUE CANCEL] user:', user?.id, 'dueId:', id);

    const body = await req.json();
    console.log('[DUE CANCEL] body:', body);

    const parsed = cancellationSchema.safeParse(body);
    console.log('[DUE CANCEL] parsed.success:', parsed.success, 'parsed.error:', parsed.error);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('، ');
      console.log('[DUE CANCEL] validation failed:', messages);
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const due = await cancelDue(id, parsed.data.reason, user.id);
    console.log('[DUE CANCEL] cancelled due:', due.id, 'status:', due.status);
    return NextResponse.json({ due });
  } catch (error: any) {
    console.error('[DUE CANCEL] ERROR:', error);
    console.error('[DUE CANCEL] ERROR message:', error.message);
    console.error('[DUE CANCEL] ERROR code:', error.code);
    console.error('[DUE CANCEL] ERROR stack:', error.stack);
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Due not found') return NextResponse.json({ error: 'الالتزام غير موجود' }, { status: 404 });
    if (error.message === 'Due already cancelled') return NextResponse.json({ error: 'الالتزام ملغي مسبقاً' }, { status: 409 });
    return NextResponse.json({ error: 'حدث خطأ', detail: error.message }, { status: 500 });
  }
}
