export const runtime = 'edge';

import { getDb } from '@/db';
import { appSettings } from '@/db/schema';
import { settingsSchema, parseBody } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db.select().from(appSettings).where(eq(appSettings.id, 1));
    return Response.json(result[0] ?? {});
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const raw = await request.json();
    const parsed = parseBody(settingsSchema, raw);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    const db = getDb(process.env as unknown as { DB: D1Database });
    await db.insert(appSettings).values({ id: 1, ...body }).onConflictDoUpdate({
      target: appSettings.id,
      set: body,
    });

    const result = await db.select().from(appSettings).where(eq(appSettings.id, 1));
    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
