export const runtime = 'edge';

import { getDb } from '@/db';
import { invoices, invoiceItems, exchangeRates } from '@/db/schema';
import { calcAmountJpy, calcTotals } from '@/lib/rounding';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb(process.env as unknown as { DB: D1Database });

    const invoiceResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, Number(id)));

    if (invoiceResult.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, Number(id)));

    const rates = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.invoiceId, Number(id)));

    return Response.json({
      ...invoiceResult[0],
      items,
      exchangeRates: rates,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<{
      clientId: number;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      currency: string;
      status: string;
      notes: string;
      notesEn: string;
      items: Array<{
        id?: number;
        description: string;
        descriptionEn?: string;
        unitCost: number;
        qty?: number;
        taxRate?: number;
        currency?: string;
        exchangeRate?: number;
        sortOrder?: number;
      }>;
    }>;

    const db = getDb(process.env as unknown as { DB: D1Database });

    // 明細を更新する場合は既存行を削除して再挿入
    let totalJpy: number | undefined;
    if (body.items) {
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, Number(id)));

      const itemsWithAmount = body.items.map((item, index) => ({
        invoiceId: Number(id),
        description: item.description,
        descriptionEn: item.descriptionEn,
        unitCost: item.unitCost,
        qty: item.qty ?? 1,
        taxRate: item.taxRate ?? 0.1,
        currency: item.currency ?? body.currency ?? 'JPY',
        exchangeRate: item.exchangeRate ?? 1,
        sortOrder: item.sortOrder ?? index,
        amountJpy: calcAmountJpy({
          unitCost: item.unitCost,
          qty: item.qty ?? 1,
          taxRate: item.taxRate ?? 0.1,
          currency: item.currency ?? body.currency ?? 'JPY',
          exchangeRate: item.exchangeRate ?? 1,
        }),
      }));

      totalJpy = calcTotals(itemsWithAmount).totalJpy;

      if (itemsWithAmount.length > 0) {
        await db.insert(invoiceItems).values(itemsWithAmount);
      }
    }

    const updateData: Record<string, unknown> = { ...body };
    delete updateData['items'];
    if (totalJpy !== undefined) {
      updateData['totalJpy'] = totalJpy;
    }

    const result = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb(process.env as unknown as { DB: D1Database });

    // invoice_itemsはcascade deleteで自動削除
    const result = await db
      .delete(invoices)
      .where(eq(invoices.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
