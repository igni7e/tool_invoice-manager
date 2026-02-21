export const runtime = 'edge';

import { getDb } from '@/db';
import { invoices, invoiceItems, clients, exchangeRates } from '@/db/schema';
import { calcAmountJpy, calcTotals } from '@/lib/rounding';
import { createInvoiceSchema, parseBody } from '@/lib/validation';
import { eq, and, gte, lte, asc, desc, sql, count } from 'drizzle-orm';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const clientId = searchParams.get('clientId');
    const sort = searchParams.get('sort') ?? 'date_desc';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));

    const db = getDb(process.env as unknown as { DB: D1Database });

    const conditions = [];
    if (q) {
      const term = `%${q.toLowerCase()}%`;
      conditions.push(
        sql`(LOWER(${invoices.invoiceNumber}) LIKE ${term} OR LOWER(${clients.name}) LIKE ${term} OR LOWER(${invoices.notes}) LIKE ${term})`
      );
    }
    if (status) conditions.push(eq(invoices.status, status));
    if (dateFrom) conditions.push(gte(invoices.invoiceDate, dateFrom));
    if (dateTo) conditions.push(lte(invoices.invoiceDate, dateTo));
    if (clientId) conditions.push(eq(invoices.clientId, Number(clientId)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = sort === 'date_asc' ? asc(invoices.invoiceDate)
      : sort === 'amount_desc' ? desc(invoices.totalJpy)
      : sort === 'amount_asc' ? asc(invoices.totalJpy)
      : desc(invoices.invoiceDate);

    const [rows, countResult] = await Promise.all([
      db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        status: invoices.status,
        totalJpy: invoices.totalJpy,
        clientName: clients.name,
      })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(where ?? sql`1=1`)
        .orderBy(orderBy)
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db.select({ total: count() })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(where ?? sql`1=1`),
    ]);

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return Response.json({ data: rows, total, page, totalPages, pageSize: PAGE_SIZE });
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
      bankAccountId: body.bankAccountId ?? null,
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
