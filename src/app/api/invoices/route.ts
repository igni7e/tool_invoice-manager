export const runtime = 'edge';

import { getDb } from '@/db';
import { invoices, invoiceItems, exchangeRates } from '@/db/schema';
import { calcAmountJpy, calcTotals } from '@/lib/rounding';
import { createInvoiceSchema, parseBody } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const db = getDb(process.env as unknown as { DB: D1Database });
    const query = db.select().from(invoices);

    const result = clientId
      ? await query.where(eq(invoices.clientId, Number(clientId)))
      : await query;

    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const db = getDb(process.env as unknown as { DB: D1Database });
  let invoiceId: number | undefined;

  try {
    const raw = await request.json();
    const parsed = parseBody(createInvoiceSchema, raw);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 各行の amountJpy を計算（端数処理統一）
    const itemsWithAmount = body.items.map((item, index) => ({
      description: item.description,
      descriptionEn: item.descriptionEn,
      unitCost: item.unitCost,
      qty: item.qty,
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

    const { totalJpy } = calcTotals(itemsWithAmount);

    // Step 1: 請求書本体を挿入
    const invoiceResult = await db.insert(invoices).values({
      clientId: body.clientId,
      invoiceNumber: body.invoiceNumber,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      currency: body.currency,
      status: body.status,
      notes: body.notes,
      notesEn: body.notesEn,
      totalJpy,
    }).returning();

    const invoice = invoiceResult[0];
    invoiceId = invoice.id;

    // Step 2: 明細を挿入（失敗時は catch で invoices を補償削除）
    if (itemsWithAmount.length > 0) {
      await db.insert(invoiceItems).values(
        itemsWithAmount.map((item) => ({ ...item, invoiceId: invoice.id }))
      );
    }

    // Step 3: 為替レートを挿入
    if (body.exchangeRates && body.exchangeRates.length > 0) {
      await db.insert(exchangeRates).values(
        body.exchangeRates.map((er) => ({ ...er, invoiceId: invoice.id }))
      );
    }

    return Response.json(invoice, { status: 201 });
  } catch (error) {
    console.error(error);
    // 補償: 請求書だけ挿入されて明細が失敗した場合は請求書を削除
    if (invoiceId !== undefined) {
      await db.delete(invoices).where(eq(invoices.id, invoiceId)).catch(console.error);
    }
    return Response.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
