'use client';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: '/fonts/NotoSansJP-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/NotoSansJP-Bold.ttf', fontWeight: 700 },
  ],
});

// IGNITEブランドカラー（blue/navy）
const BRAND = {
  blue: '#1855AF',   // brand-600
  navy: '#151C27',   // dark navy header
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  blueLight: '#e8f0fb',   // brand-50
  blueBorder: '#9dbdee',  // brand-200
  white: '#ffffff',
};

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    backgroundColor: BRAND.white,
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
  logoImage: {
    width: 80,
    height: 28,
    objectFit: 'contain',
    marginBottom: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND.gray900,
  },
  companyMeta: {
    fontSize: 8,
    color: BRAND.gray500,
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: BRAND.gray900,
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 9,
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
    fontWeight: 700,
    color: BRAND.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 700,
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
    fontWeight: 700,
    width: 80,
    textAlign: 'right',
  },
  dateValueBlue: {
    fontSize: 8,
    fontWeight: 700,
    color: BRAND.blue,
    width: 80,
    textAlign: 'right',
  },

  // ─── 明細テーブル ───
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.navy,
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
  colQty: { width: 50, textAlign: 'right', paddingRight: 4 },
  colTax: { width: 36, textAlign: 'center' },
  colAmount: { width: 80, textAlign: 'right', paddingRight: 8 },

  thText: {
    fontSize: 8,
    fontWeight: 700,
    color: BRAND.white,
  },
  tdText: {
    fontSize: 8.5,
    color: BRAND.gray900,
  },
  tdTextMono: {
    fontSize: 8.5,
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
    width: 220,
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
    fontWeight: 700,
    color: BRAND.gray900,
  },
  totalsFinalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: BRAND.blue,
  },
  totalsNote: {
    fontSize: 7,
    color: BRAND.gray400,
    marginTop: 4,
  },

  // ─── 振込先 ───
  bankBox: {
    backgroundColor: BRAND.blueLight,
    borderWidth: 1,
    borderColor: BRAND.blueBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  bankLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: BRAND.blue,
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
    fontWeight: 700,
    color: BRAND.gray900,
  },

  // ─── 備考 ───
  notesLabel: {
    fontSize: 8,
    fontWeight: 700,
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
    unit?: string | null;
    taxRate: number;
    currency: string;
    exchangeRate: number | null;
    amountJpy: number;
  }>;
  settings: {
    companyName: string | null;
    companyAddress: string | null;
    companyAddressEn: string | null;
    bankName: string | null;
    bankBranch: string | null;
    accountType: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
    accountHolderEn: string | null;
    taxRegistrationNumber: string | null;
    bankCode?: string | null;
    swiftCode?: string | null;
    bankNameEn?: string | null;
    bankBranchEn?: string | null;
  };
  bankAccount?: {
    bankName?: string | null;
    bankBranch?: string | null;
    bankNameEn?: string | null;
    bankBranchEn?: string | null;
    accountType?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
    accountHolderEn?: string | null;
    bankCode?: string | null;
    swiftCode?: string | null;
  } | null;
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
  const { invoice, client, items, settings, bankAccount } = data;
  const isJa = lang === 'ja';

  // 税率別合計（calcSubtotalJpy で丸め規則を統一）
  const taxMap = new Map<number, { subtotal: number; tax: number }>();
  for (const item of items) {
    const subtotal = Math.floor(
      item.unitCost * item.qty * (item.exchangeRate ?? 1) + Number.EPSILON
    );
    const taxAmt = item.amountJpy - subtotal;
    const existing = taxMap.get(item.taxRate) ?? { subtotal: 0, tax: 0 };
    taxMap.set(item.taxRate, { subtotal: existing.subtotal + subtotal, tax: existing.tax + taxAmt });
  }
  const has8 = taxMap.has(0.08);

  const clientName = isJa ? client.name : (client.nameEn ?? client.name);
  const clientAddress = isJa ? client.address : (client.addressEn ?? client.address);

  // bankAccountが指定されていれば優先、なければsettingsにフォールバック
  const ba = bankAccount;
  const bankNameJa = ba?.bankName ?? settings.bankName ?? 'SMBC';
  const bankBranchJa = ba?.bankBranch ?? settings.bankBranch ?? '';
  const bankNameEnVal = ba?.bankNameEn ?? settings.bankNameEn;
  const bankBranchEnVal = ba?.bankBranchEn ?? settings.bankBranchEn;
  const bankName = isJa ? bankNameJa : (bankNameEnVal ?? bankNameJa);
  const bankBranch = isJa ? bankBranchJa : (bankBranchEnVal ?? bankBranchJa);
  const accountTypeRaw = ba?.accountType ?? settings.accountType ?? '普通';
  const accountType = isJa
    ? accountTypeRaw
    : (accountTypeRaw === '普通' ? 'Ordinary' : accountTypeRaw === '当座' ? 'Checking' : accountTypeRaw);
  const accountNumber = ba?.accountNumber ?? settings.accountNumber ?? '1234567';
  const accountHolder = isJa
    ? (ba?.accountHolder ?? settings.accountHolder ?? '（有）イグナイト')
    : (ba?.accountHolderEn ?? settings.accountHolderEn ?? 'Ignite LLC');
  const swiftCode = ba?.swiftCode ?? settings.swiftCode;
  const companyName = settings.companyName ?? 'IGNITE';
  const companyAddress = isJa
    ? (settings.companyAddress ?? '530-0001 Osaka, Japan')
    : (settings.companyAddressEn ?? '530-0001 Osaka, Japan');

  return (
    <Document
      title={invoice.invoiceNumber}
      author={companyName}
      creator="Invoice Manager"
    >
      <Page size="A4" style={[styles.page, { fontFamily: isJa ? 'NotoSansJP' : 'Helvetica' }]}>

        {/* ─── ヘッダー ─── */}
        <View style={styles.header}>
          <View>
            <Image src="/ignite-logo.png" style={styles.logoImage} />
            <Text style={styles.companyMeta}>{companyAddress}</Text>
            {settings.taxRegistrationNumber && (
              <Text style={styles.companyMeta}>
                {isJa ? '登録番号: ' : 'Tax Reg. No.: '}{settings.taxRegistrationNumber}
              </Text>
            )}
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
              <Text style={styles.dateValueBlue}>{invoice.dueDate}</Text>
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
          const qtyLabel = item.unit ? `${item.qty}${item.unit}` : `${item.qty}`;
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
              <Text style={[styles.tdText, styles.colQty]}>{qtyLabel}</Text>
              <Text style={[styles.tdText, styles.colTax]}>
                {(item.taxRate * 100).toFixed(0)}%{item.taxRate === 0.08 ? ' *' : ''}
              </Text>
              <Text style={[styles.tdTextMono, styles.colAmount]}>
                {fmt(item.amountJpy, 'JPY')}
              </Text>
            </View>
          );
        })}

        {/* ─── 合計（税率別） ─── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            {Array.from(taxMap.entries())
              .sort(([a], [b]) => b - a)
              .map(([rate, { subtotal, tax }]) => (
                <View key={rate}>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>
                      {`${(rate * 100).toFixed(0)}%${isJa ? '対象計' : ' subject'}${rate === 0.08 ? ' *' : ''}`}
                    </Text>
                    <Text style={styles.totalsValue}>{fmt(subtotal, 'JPY')}</Text>
                  </View>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>
                      {isJa ? `消費税(${(rate * 100).toFixed(0)}%)` : `Tax(${(rate * 100).toFixed(0)}%)`}
                    </Text>
                    <Text style={styles.totalsValue}>{fmt(tax, 'JPY')}</Text>
                  </View>
                </View>
              ))
            }
            <View style={styles.totalsFinalRow}>
              <Text style={styles.totalsFinalLabel}>
                {isJa ? '合計（税込）' : 'Total'}
              </Text>
              <Text style={styles.totalsFinalValue}>
                {fmt(invoice.totalJpy, 'JPY')}
              </Text>
            </View>
            {has8 && (
              <Text style={styles.totalsNote}>
                {isJa ? '* 軽減税率（8%）対象' : '* Reduced tax rate (8%) applicable'}
              </Text>
            )}
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
                {bankName}{bankBranch ? ` ${bankBranch}` : ''}
              </Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankItemLabel}>
                {isJa ? '口座番号' : 'Account No.'}
              </Text>
              <Text style={styles.bankItemValue}>{accountType} {accountNumber}</Text>
            </View>
            {!isJa && swiftCode && (
              <View style={styles.bankItem}>
                <Text style={styles.bankItemLabel}>SWIFT/BIC</Text>
                <Text style={styles.bankItemValue}>{swiftCode}</Text>
              </View>
            )}
            <View style={[styles.bankItem, { marginTop: 4 }]}>
              <Text style={styles.bankItemLabel}>
                {isJa ? '口座名義' : 'Account Name'}
              </Text>
              <Text style={styles.bankItemValue}>{accountHolder}</Text>
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
