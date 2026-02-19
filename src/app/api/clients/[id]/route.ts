export const runtime = 'edge';

import { getDb } from '@/db';
import { clients, invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateClientSchema, parseBody } from '@/lib/validation';

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
    const raw = await request.json();
    const parsed = parseBody(updateClientSchema, raw);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 明示的にホワイトリストで更新フィールドを制限
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.addressEn !== undefined) updateData.addressEn = body.addressEn;
    if (body.contactName !== undefined) updateData.contactName = body.contactName;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail || null;
    if (body.invoicePrefix !== undefined) updateData.invoicePrefix = body.invoicePrefix;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.taxRate !== undefined) updateData.taxRate = body.taxRate;

    const db = getDb(process.env as unknown as { DB: D1Database });
    const result = await db
      .update(clients)
      .set(updateData)
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
    const clientId = Number(id);
    const db = getDb(process.env as unknown as { DB: D1Database });

    // 関連請求書の存在チェック（ON DELETE RESTRICT 対策）
    const relatedInvoices = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .limit(1);

    if (relatedInvoices.length > 0) {
      return Response.json(
        { error: 'このクライアントには請求書が存在するため削除できません。先に請求書を削除してください。' },
        { status: 409 }
      );
    }

    const result = await db
      .delete(clients)
      .where(eq(clients.id, clientId))
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
