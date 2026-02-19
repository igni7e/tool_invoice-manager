# Invoice Manager

IGNITE社内専用の請求書管理Webアプリ。Cloudflare Pages + D1 で動作する。

## 技術スタック

- **Hosting**: Cloudflare Pages
- **Auth**: Cloudflare Access (Zero Trust) - `@igni7e.jp` メールOTP認証
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Next.js 15 + Tailwind CSS
- **ORM**: Drizzle ORM

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Cloudflare D1 データベース作成

```bash
wrangler d1 create invoice-manager
```

出力された `database_id` を `wrangler.toml` の `database_id` に設定する。

### 3. スキーマ適用

```bash
# ローカル
wrangler d1 execute invoice-manager --local --file=migrations/0001_initial.sql

# 本番
wrangler d1 execute invoice-manager --file=migrations/0001_initial.sql
```

### 4. 環境変数設定

```bash
cp .dev.vars.example .dev.vars
# .dev.vars を編集して値を設定
```

### 5. ローカル開発

```bash
npm run dev
```

### 6. デプロイ

```bash
npm run build
wrangler pages deploy .next
```

## Cloudflare Access 設定（ダッシュボードから5分で完了）

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. 「Add an Application」→ Self-hosted
3. Application name: Invoice Manager
4. Application domain: `tool-invoice-manager.pages.dev`
5. Policies: `Allow` - Emails ending in `@igni7e.jp`
6. Authentication: One-time PIN

## データ移行（Excelから）

```bash
cd scripts
pip install -r requirements.txt
python migrate_excel.py --file /path/to/invoices.xlsx --output migration.sql
wrangler d1 execute invoice-manager --file=migration.sql
```

## 端数処理ルール

```typescript
// 各行: Math.floor(unitCost * qty * (1 + taxRate) * exchangeRate)
// 合計: 行の積み上げ（追加丸めなし）
// 消費税: 合計 - 税抜合計
```

検証値: NLCSv2 = ¥666,464（消費税 ¥60,588）

## Changelog

### 2026-02-19 - 初回実装
- プロジェクト初期化（Next.js 15 + Cloudflare Pages）
- D1データベーススキーマ設計（clients, invoices, invoice_items, exchange_rates）
- クライアント管理 CRUD
- 請求書作成フォーム（多通貨対応・端数処理統一）
- PDF出力（印刷ページ方式、日英切り替え対応）
- Excelデータ移行スクリプト（Python/openpyxl）
