export const runtime = 'edge';

import { getDb } from '@/db';
import { clients } from '@/db/schema';

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
    const body = await request.json() as {
      name: string;
      nameEn?: string;
      address?: string;
      addressEn?: string;
      contactName?: string;
      contactEmail?: string;
      invoicePrefix: string;
      currency?: string;
      taxRate?: number;
    };

    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db.insert(clients).values({
      name: body.name,
      nameEn: body.nameEn,
      address: body.address,
      addressEn: body.addressEn,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      invoicePrefix: body.invoicePrefix,
      currency: body.currency ?? 'JPY',
      taxRate: body.taxRate ?? 0.1,
    }).returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
