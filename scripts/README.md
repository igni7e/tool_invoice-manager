# Excel → Cloudflare D1 移行スクリプト

既存の Excel 請求書ファイル（90+ シート）を Cloudflare D1 に移行するためのツールです。

---

## 1. 環境準備

Python 3.10 以上が必要です。仮想環境の使用を推奨します。

```bash
# scripts/ ディレクトリに移動
cd scripts

# 仮想環境を作成・有効化
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 依存パッケージをインストール
pip install -r requirements.txt
```

---

## 2. スクリプト実行方法

### 基本実行

```bash
python migrate_excel.py --file /path/to/invoices.xlsx --output migration.sql
```

### オプション一覧

| オプション | 説明 | デフォルト |
|---|---|---|
| `--file` | 入力 Excel ファイルパス（必須） | - |
| `--output` | 出力 SQL ファイルパス | `migration.sql` |
| `--dry-run` | SQL をターミナルに表示するだけ（ファイル出力なし） | false |
| `--default-currency` | 通貨シンボルが見つからない場合のデフォルト通貨 | `USD` |

### 実行例

```bash
# ドライランで内容を確認
python migrate_excel.py --file ~/Documents/invoices.xlsx --dry-run

# SQL ファイルに出力
python migrate_excel.py --file ~/Documents/invoices.xlsx --output migration.sql

# デフォルト通貨を JPY に設定
python migrate_excel.py --file ~/Documents/invoices.xlsx --default-currency JPY
```

### シート解析ルール

スクリプトは以下のキーワードをセルから検索して請求書データを抽出します。

- **請求書番号**: `Invoice No`, `Invoice #`, `請求書番号`, `請求番号`
- **請求日**: `Invoice Date`, `請求日`, `発行日`, `Date`
- **支払期限**: `Due Date`, `支払期限`, `Payment Due`
- **合計金額**: `Total`, `合計`, `Grand Total`, `請求金額`
- **明細行**: `Description/品名` + `Quantity/数量` + `Unit Price/単価` のヘッダーを検索

解析できないシートは自動的にスキップされ、ログにその旨が表示されます。

---

## 3. D1 への投入方法

### 前提条件

- `wrangler` がインストール済みであること
- D1 データベースが作成済みであること（`wrangler d1 create invoice-manager`）
- `wrangler.toml` の `database_id` が正しく設定されていること

### テーブルスキーマの適用（初回のみ）

D1 に移行する前に、テーブルが存在しない場合はスキーマを適用します。

```bash
# プロジェクトルートで実行
wrangler d1 execute invoice-manager --remote --file=migrations/schema.sql
```

### 移行 SQL の投入

```bash
# ローカル D1 に投入（開発・確認用）
wrangler d1 execute invoice-manager --local --file=scripts/migration.sql

# リモート D1 に投入（本番）
wrangler d1 execute invoice-manager --remote --file=scripts/migration.sql
```

> **注意**: `--remote` フラグを使用すると本番データベースに直接書き込みます。
> 必ず `--local` で動作確認してから実行してください。

---

## 4. 移行後の確認方法

### レコード数の確認

```bash
# クライアント数
wrangler d1 execute invoice-manager --remote --command="SELECT COUNT(*) as count FROM clients;"

# 請求書数
wrangler d1 execute invoice-manager --remote --command="SELECT COUNT(*) as count FROM invoices;"

# 明細行数
wrangler d1 execute invoice-manager --remote --command="SELECT COUNT(*) as count FROM invoice_items;"
```

### データサンプルの確認

```bash
# クライアント一覧（先頭10件）
wrangler d1 execute invoice-manager --remote --command="SELECT id, name FROM clients LIMIT 10;"

# 請求書一覧（先頭10件）
wrangler d1 execute invoice-manager --remote \
  --command="SELECT inv.invoice_number, c.name, inv.issue_date, inv.total_amount, inv.currency FROM invoices inv JOIN clients c ON inv.client_id = c.id LIMIT 10;"
```

### 問題が発生した場合

移行 SQL はトランザクション（`BEGIN TRANSACTION` / `COMMIT`）で囲まれているため、
エラーが発生した場合は全体がロールバックされます。

エラーログを確認し、該当シートの Excel データを修正した上で再実行してください。

---

## スクリプトの対応通貨

| シンボル | 通貨コード |
|---|---|
| `$` | USD |
| `€` | EUR |
| `£` | GBP |
| `A$` | AUD |
| `C$` | CAD |
| `S$` | SGD |
| `NZ$` | NZD |
| `¥` | JPY |
