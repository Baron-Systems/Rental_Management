import { prisma } from '@/lib/prisma';

export async function cancelDue(dueId: string, reason: string, cancelledBy: string) {
  console.log('[CANCEL DUE SERVICE] dueId:', dueId, 'reason:', reason, 'cancelledBy:', cancelledBy);
  const due = await prisma.due.findUnique({
    where: { id: dueId },
  });
  console.log('[CANCEL DUE SERVICE] found due:', due);

  if (!due) throw new Error('Due not found');
  if (due.status === 'cancelled') throw new Error('Due already cancelled');

  const updated = await prisma.due.update({
    where: { id: dueId },
    data: {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledBy,
      cancelledAt: new Date(),
    },
  });
  console.log('[CANCEL DUE SERVICE] updated:', updated);
  return updated;
}

