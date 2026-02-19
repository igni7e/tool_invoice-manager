'use client';
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoiceDocument } from './InvoiceDocument';
import type { InvoicePdfData } from './InvoiceDocument';

interface Props {
  data: InvoicePdfData;
  lang: 'ja' | 'en';
  invoiceNumber: string;
}

export function PdfDownloadButton({ data, lang, invoiceNumber }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await pdf(<InvoiceDocument data={data} lang={lang} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}-${lang}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className='bg-brand-600 text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-60'
    >
      {generating ? 'PDF生成中...' : 'PDFダウンロード'}
    </button>
  );
}
