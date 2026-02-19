'use client';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// IGNITEブランドカラー
const BRAND = {
  orange: '#ea580c',   // brand-600
  dark: '#9a3412',     // brand-dark
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  orangeLight: '#fff7ed',  // orange-50
  orangeBorder: '#fed7aa', // orange-200
  white: '#ffffff',
};

// Noto Sans JP はCDNから自動フォールバック
// react-pdf は Unicode 対応フォントが必要
// ここでは Noto Sans CJK JP を指定（手動登録が難しい場合は英語フォントのみ）
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    backgroundColor: BRAND.white,
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 45,
    color: BRAND.gray900,
  },

  // ─── ヘッダー ───
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  logoBox: {
    width: 22,
    height: 22,
    backgroundColor: BRAND.orange,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  logoText: {
    color: BRAND.white,
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gray900,
  },
  companyMeta: {
    fontSize: 8,
    color: BRAND.gray500,
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gray900,
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: BRAND.gray500,
    textAlign: 'right',
  },

  // ─── 請求先 / 日付 ───
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gray900,
    marginBottom: 3,
  },
  clientAddress: {
    fontSize: 8,
    color: BRAND.gray500,
    lineHeight: 1.6,
  },
  dateTable: {
    alignItems: 'flex-end',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  dateLabel: {
    fontSize: 8,
    color: BRAND.gray500,
    width: 70,
    textAlign: 'right',
    paddingRight: 10,
  },
  dateValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    width: 80,
    textAlign: 'right',
  },
  dateValueOrange: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.orange,
    width: 80,
    textAlign: 'right',
  },

  // ─── 明細テーブル ───
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.gray900,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gray200,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: BRAND.gray100,
  },

  // カラム幅
  colDesc: { flex: 1, paddingLeft: 8 },
  colUnit: { width: 80, textAlign: 'right', paddingRight: 4 },
  colQty: { width: 40, textAlign: 'right', paddingRight: 4 },
  colTax: { width: 36, textAlign: 'center' },
  colAmount: { width: 80, textAlign: 'right', paddingRight: 8 },

  thText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.white,
  },
  tdText: {
    fontSize: 8.5,
    color: BRAND.gray900,
  },
  tdTextMono: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: BRAND.gray900,
  },
  tdSub: {
    fontSize: 7,
    color: BRAND.gray400,
    marginTop: 1,
  },

  // ─── 合計 ───
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginBottom: 20,
  },
  totalsBox: {
    width: 200,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 8.5,
    color: BRAND.gray500,
  },
  totalsValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: BRAND.gray900,
  },
  totalsFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: BRAND.gray900,
  },
  totalsFinalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gray900,
  },
  totalsFinalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.orange,
  },

  // ─── 振込先 ───
  bankBox: {
    backgroundColor: BRAND.orangeLight,
    borderWidth: 1,
    borderColor: BRAND.orangeBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  bankLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.dark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankItem: {
    marginRight: 24,
    marginBottom: 4,
  },
  bankItemLabel: {
    fontSize: 7,
    color: BRAND.gray500,
    marginBottom: 1,
  },
  bankItemValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gray900,
  },

  // ─── 備考 ───
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gray700,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8.5,
    color: BRAND.gray500,
    lineHeight: 1.6,
  },
});

export interface InvoicePdfData {
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    notes: string | null;
    notesEn: string | null;
    totalJpy: number;
  };
  client: {
    name: string;
    nameEn: string | null;
    address: string | null;
    addressEn: string | null;
  };
  items: Array<{
    description: string;
    descriptionEn: string | null;
    unitCost: number;
    qty: number;
    taxRate: number;
    currency: string;
    exchangeRate: number | null;
    amountJpy: number;
  }>;
}

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

interface Props {
  data: InvoicePdfData;
  lang: 'ja' | 'en';
}

export function InvoiceDocument({ data, lang }: Props) {
  const { invoice, client, items } = data;
  const isJa = lang === 'ja';

  const subtotal = items.reduce(
    (s, item) => s + Math.floor(item.unitCost * item.qty * (item.exchangeRate ?? 1)),
    0,
  );
  const tax = invoice.totalJpy - subtotal;

  const clientName = isJa ? client.name : (client.nameEn ?? client.name);
  const clientAddress = isJa ? client.address : (client.addressEn ?? client.address);

  return (
    <Document
      title={invoice.invoiceNumber}
      author="IGNITE"
      creator="Invoice Manager"
    >
      <Page size="A4" style={styles.page}>

        {/* ─── ヘッダー ─── */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>I</Text>
              </View>
              <Text style={styles.companyName}>IGNITE</Text>
            </View>
            <Text style={styles.companyMeta}>
              {'530-0001 Osaka, Japan\ndaisuke@igni7e.jp'}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>
              {isJa ? '請求書' : 'INVOICE'}
            </Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* ─── 請求先 / 日付 ─── */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.sectionLabel}>
              {isJa ? '請求先' : 'Bill To'}
            </Text>
            <Text style={styles.clientName}>{clientName}</Text>
            {clientAddress && (
              <Text style={styles.clientAddress}>{clientAddress}</Text>
            )}
          </View>
          <View style={styles.dateTable}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>
                {isJa ? '請求日' : 'Invoice Date'}
              </Text>
              <Text style={styles.dateValue}>{invoice.invoiceDate}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>
                {isJa ? '支払期限' : 'Due Date'}
              </Text>
              <Text style={styles.dateValueOrange}>{invoice.dueDate}</Text>
            </View>
          </View>
        </View>

        {/* ─── 明細テーブル ─── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colDesc]}>
            {isJa ? '品名' : 'Description'}
          </Text>
          <Text style={[styles.thText, styles.colUnit]}>
            {isJa ? '単価' : 'Unit Price'}
          </Text>
          <Text style={[styles.thText, styles.colQty]}>
            {isJa ? '数量' : 'Qty'}
          </Text>
          <Text style={[styles.thText, styles.colTax]}>
            {isJa ? '税率' : 'Tax'}
          </Text>
          <Text style={[styles.thText, styles.colAmount]}>
            {isJa ? '金額(JPY)' : 'Amount(JPY)'}
          </Text>
        </View>

        {items.map((item, i) => {
          const desc = isJa ? item.description : (item.descriptionEn ?? item.description);
          const isForeign = item.currency !== 'JPY';
          return (
            <View
              key={i}
              style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tdText, styles.colDesc]}>{desc}</Text>
              <View style={styles.colUnit}>
                <Text style={[styles.tdTextMono, { textAlign: 'right' }]}>
                  {fmt(item.unitCost, item.currency)}
                </Text>
                {isForeign && item.exchangeRate && (
                  <Text style={[styles.tdSub, { textAlign: 'right' }]}>
                    @ {item.exchangeRate}
                  </Text>
                )}
              </View>
              <Text style={[styles.tdText, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tdText, styles.colTax]}>
                {(item.taxRate * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.tdTextMono, styles.colAmount]}>
                {fmt(item.amountJpy, 'JPY')}
              </Text>
            </View>
          );
        })}

        {/* ─── 合計 ─── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                {isJa ? '税抜合計' : 'Subtotal'}
              </Text>
              <Text style={styles.totalsValue}>{fmt(subtotal, 'JPY')}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                {isJa ? '消費税' : 'Consumption Tax'}
              </Text>
              <Text style={styles.totalsValue}>{fmt(tax, 'JPY')}</Text>
            </View>
            <View style={styles.totalsFinalRow}>
              <Text style={styles.totalsFinalLabel}>
                {isJa ? '合計（税込）' : 'Total'}
              </Text>
              <Text style={styles.totalsFinalValue}>
                {fmt(invoice.totalJpy, 'JPY')}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 振込先 ─── */}
        <View style={styles.bankBox}>
          <Text style={styles.bankLabel}>
            {isJa ? '振込先' : 'Bank Transfer Details'}
          </Text>
          <View style={styles.bankGrid}>
            <View style={styles.bankItem}>
              <Text style={styles.bankItemLabel}>
                {isJa ? '銀行' : 'Bank'}
              </Text>
              <Text style={styles.bankItemValue}>
                {isJa ? '三井住友銀行 梅田支店' : 'SMBC Umeda Branch'}
              </Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankItemLabel}>
                {isJa ? '口座番号' : 'Account No.'}
              </Text>
              <Text style={styles.bankItemValue}>普通 1234567</Text>
            </View>
            <View style={[styles.bankItem, { marginTop: 4 }]}>
              <Text style={styles.bankItemLabel}>
                {isJa ? '口座名義' : 'Account Name'}
              </Text>
              <Text style={styles.bankItemValue}>
                {isJa ? '（有）イグナイト' : 'Ignite LLC'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 備考 ─── */}
        {(invoice.notes || invoice.notesEn) && (
          <View>
            <Text style={styles.notesLabel}>
              {isJa ? '備考' : 'Notes'}
            </Text>
            <Text style={styles.notesText}>
              {isJa ? invoice.notes : (invoice.notesEn ?? invoice.notes)}
            </Text>
          </View>
        )}

      </Page>
    </Document>
  );
}
