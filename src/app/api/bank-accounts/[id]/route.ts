export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db';
import { bankAccounts } from '@/db/schema';
import { updateBankAccountSchema, parseBody } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const raw = await request.json();
    const parsed = parseBody(updateBankAccountSchema, raw);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    const db = getDb(getRequestContext().env as unknown as { DB: D1Database });

    // デフォルト口座に設定する場合、既存のデフォルトを解除
    if (body.isDefault === 1) {
      await db.update(bankAccounts).set({ isDefault: 0 }).where(eq(bankAccounts.isDefault, 1));
    }

    const result = await db
      .update(bankAccounts)
      .set(body)
      .where(eq(bankAccounts.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Bank account not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update bank account' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb(getRequestContext().env as unknown as { DB: D1Database });

    const result = await db
      .delete(bankAccounts)
      .where(eq(bankAccounts.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Bank account not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
}
