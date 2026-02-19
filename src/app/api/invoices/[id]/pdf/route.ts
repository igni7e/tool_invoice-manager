export const runtime = 'edge';

import { getDb } from '@/db';
import { invoices, invoiceItems, clients, exchangeRates } from '@/db/schema';
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

    const invoice = invoiceResult[0];

    const clientResult = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId));

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, Number(id)));

    const rates = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.invoiceId, Number(id)));

    // TODO: PDF生成実装 (@react-pdf/renderer を使用予定)
    // 現時点では請求書データをJSONで返すプレースホルダー
    return Response.json({
      message: 'PDF generation not yet implemented',
      data: {
        invoice,
        client: clientResult[0] ?? null,
        items,
        exchangeRates: rates,
      },
    }, { status: 501 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
