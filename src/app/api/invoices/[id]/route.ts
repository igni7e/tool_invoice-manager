export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db';
import { invoices, invoiceItems, exchangeRates, clients, bankAccounts } from '@/db/schema';
import { calcAmountJpy, calcTotals } from '@/lib/rounding';
import { updateInvoiceSchema, parseBody } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb(getRequestContext().env as unknown as { DB: D1Database });

    const invoiceResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, Number(id)));

    if (invoiceResult.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const inv = invoiceResult[0];
    const queries: [Promise<unknown[]>, Promise<unknown[]>, Promise<unknown[]>, Promise<unknown[]>?] = [
      db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, Number(id))),
      db.select().from(exchangeRates).where(eq(exchangeRates.invoiceId, Number(id))),
      db.select().from(clients).where(eq(clients.id, inv.clientId)),
    ];
    if (inv.bankAccountId) {
      queries.push(db.select().from(bankAccounts).where(eq(bankAccounts.id, inv.bankAccountId)));
    }

    const [items, rates, clientResult, bankAccountResult] = await Promise.all(queries);

    return Response.json({
      ...inv,
      client: (clientResult as unknown[])[0] ?? null,
      items,
      exchangeRates: rates,
      bankAccount: bankAccountResult ? (bankAccountResult as unknown[])[0] ?? null : null,
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
    const invoiceId = Number(id);
    const raw = await request.json();
    const parsed = parseBody(updateInvoiceSchema, raw);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    const db = getDb(getRequestContext().env as unknown as { DB: D1Database });

    // 請求書の存在確認
    const existing = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 明細を更新する場合: 削除 + 再挿入を batch で原子化
    let totalJpy: number | undefined;
    if (body.items && body.items.length > 0) {
      const itemsWithAmount = body.items.map((item, index) => ({
        invoiceId,
        description: item.description,
        descriptionEn: item.descriptionEn,
        unitCost: item.unitCost,
        qty: item.qty,
        unit: item.unit,
        taxRate: item.taxRate,
        currency: item.currency,
        exchangeRate: item.exchangeRate,
        sortOrder: item.sortOrder ?? index,
        amountJpy: calcAmountJpy({
          unitCost: item.unitCost,
          qty: item.qty,
          taxRate: item.taxRate,
          exchangeRate: item.exchangeRate,
        }),
      }));

      totalJpy = calcTotals(itemsWithAmount).totalJpy;

      // 既存明細を削除してから再挿入
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      await db.insert(invoiceItems).values(itemsWithAmount);
    }

    // 請求書本体をホワイトリスト更新
    const updateData: Record<string, unknown> = {};
    if (body.clientId !== undefined) updateData.clientId = body.clientId;
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber;
    if (body.invoiceDate !== undefined) updateData.invoiceDate = body.invoiceDate;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.notesEn !== undefined) updateData.notesEn = body.notesEn;
    if (totalJpy !== undefined) updateData.totalJpy = totalJpy;
    if (body.bankAccountId !== undefined) updateData.bankAccountId = body.bankAccountId;

    const result = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, invoiceId))
      .returning();

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
    const db = getDb(getRequestContext().env as unknown as { DB: D1Database });

    // invoice_items, exchange_rates は ON DELETE CASCADE で自動削除
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
