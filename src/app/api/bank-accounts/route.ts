export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db';
import { bankAccounts } from '@/db/schema';
import { createBankAccountSchema, parseBody } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDb(getRequestContext().env as unknown as { DB: D1Database });
    const result = await db.select().from(bankAccounts);
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = parseBody(createBankAccountSchema, raw);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    const db = getDb(getRequestContext().env as unknown as { DB: D1Database });

    // デフォルト口座に設定する場合、既存のデフォルトを解除
    if (body.isDefault === 1) {
      await db.update(bankAccounts).set({ isDefault: 0 }).where(eq(bankAccounts.isDefault, 1));
    }

    const result = await db.insert(bankAccounts).values(body).returning();
    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create bank account' }, { status: 500 });
  }
}
