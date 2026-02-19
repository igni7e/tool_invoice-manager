export const runtime = 'edge';

import { getDb } from '@/db';
import { invoices, invoiceItems, exchangeRates } from '@/db/schema';
import { calcAmountJpy, calcTotals } from '@/lib/rounding';
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
  try {
    const body = await request.json() as {
      clientId: number;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      currency?: string;
      status?: string;
      notes?: string;
      notesEn?: string;
      items: Array<{
        description: string;
        descriptionEn?: string;
        unitCost: number;
        qty?: number;
        taxRate?: number;
        currency?: string;
        exchangeRate?: number;
        sortOrder?: number;
      }>;
      exchangeRates?: Array<{
        currency: string;
        rate: number;
        rateDate: string;
      }>;
    };

    const db = getDb(process.env as unknown as { DB: D1Database });

    // 各行のamountJpyを計算
    const itemsWithAmount = body.items.map((item, index) => ({
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

    const { totalJpy } = calcTotals(itemsWithAmount);

    // 請求書本体を作成
    const invoiceResult = await db.insert(invoices).values({
      clientId: body.clientId,
      invoiceNumber: body.invoiceNumber,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      currency: body.currency ?? 'JPY',
      status: body.status ?? 'draft',
      notes: body.notes,
      notesEn: body.notesEn,
      totalJpy,
    }).returning();

    const invoice = invoiceResult[0];

    // 明細を一括挿入
    if (itemsWithAmount.length > 0) {
      await db.insert(invoiceItems).values(
        itemsWithAmount.map(item => ({ ...item, invoiceId: invoice.id })),
      );
    }

    // 為替レートを挿入
    if (body.exchangeRates && body.exchangeRates.length > 0) {
      await db.insert(exchangeRates).values(
        body.exchangeRates.map(er => ({ ...er, invoiceId: invoice.id })),
      );
    }

    return Response.json(invoice, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
