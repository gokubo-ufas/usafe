# GAS セットアップ手順 — U-Safe 社員マスタ同期

## 概要

`gas/sync-employees.gs` を Google Apps Script へ設置することで、
U-Safe 用スプレッドシートの社員マスタを U-Safe（Supabase）へ Push 同期できます。

**設計方針：** GAS は社員マスタの事前同期専用です。
災害発生時の U-Safe 発報処理は Supabase の employees テーブルのみを参照し、
Google Sheets / GAS には依存しません。

---

## 手順

### 1. U-Safe 用スプレッドシートを開く

社員マスタが入力済みのスプレッドシートを Google ドライブで開きます。

### 2. Apps Script エディタを開く

メニュー：**拡張機能 → Apps Script**

### 3. スクリプトを貼り付ける

エディタ内の既存コードをすべて削除し、
`gas/sync-employees.gs` の内容をそのまま貼り付けて **保存**（Ctrl+S）します。

### 4. Script Properties を設定する

エディタ左メニュー：**プロジェクトの設定 → スクリプト プロパティ**

| プロパティ名 | 値 |
|---|---|
| `USAFE_API_URL` | Vercel URL（例: `https://usafe.vercel.app`） |
| `USAFE_SYNC_SECRET` | U-Safe 側の `GAS_SYNC_SECRET` と同じ値 |

> **重要：** Secret をスプレッドシートのセルやコードに保存しないでください。

### 5. スクリプトを保存する

Ctrl+S または保存アイコンをクリックします。

### 6. スプレッドシートを再読み込みする

ブラウザで F5 または再読み込みを行います。

### 7. U-Safe メニューを確認する

スプレッドシートのメニューバーに **「U-Safe」** が表示されていれば設置完了です。

### 8. USAFE_API_URL を確定させる

Vercel デプロイ後に正式 URL が確定したら、Script Properties の
`USAFE_API_URL` を本番 URL に更新してください。

### 9. 社員マスタを最新化する

**U-Safe → 社員マスタを最新化** をクリックします。

初回実行時は Google からアクセス許可の確認ダイアログが表示されます。
「許可」を選択してください。

### 10. 成功を確認する

以下のようなダイアログが表示されれば同期完了です。

```
U-Safeの社員マスタを最新化しました。

対象社員数：XX名
発報対象：XX名
対象外：XX名
```

---

## スプレッドシート仕様

| 列 | 内容 | 必須 |
|---|---|---|
| A | 社員番号 | ✓ |
| B | 氏名 | ✓ |
| C | メールアドレス | ✓ |
| D | 部門 | |
| E | 退職FLG | |

- **データ開始行：** 3行目
- **退職FLG：** 空欄 = 在籍（is_active: true）／`●` = 退職（is_active: false）
- 完全空行は自動的に無視されます

---

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| 「U-Safe」メニューが表示されない | スプレッドシートを再読み込みする |
| 「Script Properties が設定されていません」 | 手順4を再確認する |
| 「接続に失敗しました」 | `USAFE_API_URL` の値と Vercel のデプロイ状態を確認する |
| 「退職FLGに不正な値があります」 | E列の値を空欄または `●` に修正する |
| 「Unauthorized」 | `USAFE_SYNC_SECRET` が U-Safe 側の `GAS_SYNC_SECRET` と一致しているか確認する |
