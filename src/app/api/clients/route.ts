export const runtime = 'edge';

import { getDb } from '@/db';
import { clients } from '@/db/schema';
import { createClientSchema, parseBody } from '@/lib/validation';

export async function GET() {
  try {
    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db.select().from(clients);
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = parseBody(createClientSchema, raw);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db.insert(clients).values({
      name: body.name,
      nameEn: body.nameEn,
      address: body.address,
      addressEn: body.addressEn,
      contactName: body.contactName,
      contactEmail: body.contactEmail || undefined,
      invoicePrefix: body.invoicePrefix,
      currency: body.currency,
      taxRate: body.taxRate,
    }).returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
