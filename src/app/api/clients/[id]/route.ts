export const runtime = 'edge';

import { getDb } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db.select().from(clients).where(eq(clients.id, Number(id)));

    if (result.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<{
      name: string;
      nameEn: string;
      address: string;
      addressEn: string;
      contactName: string;
      contactEmail: string;
      invoicePrefix: string;
      currency: string;
      taxRate: number;
    }>;

    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db
      .update(clients)
      .set(body)
      .where(eq(clients.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db
      .delete(clients)
      .where(eq(clients.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
