/**
 * U-Safe 社員マスタ同期 — Google Apps Script
 *
 * 【設置方法】
 * 1. 社員マスタ Spreadsheet を開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. このファイルの内容を貼り付けて保存
 * 4. Apps Script エディタ > 左メニュー「プロジェクトの設定」>「スクリプト プロパティ」
 *    以下を追加：
 *      USAFE_API_URL    : https://your-domain.vercel.app  (または http://localhost:3000)
 *      USAFE_SYNC_SECRET: U-Safe の GAS_SYNC_SECRET と同じ値
 *    ※ Secret はスプレッドシートのセルには保存しないこと
 *
 * 【スプレッドシート形式】
 * シート名「社員マスタ」の1行目（ヘッダー）に以下の列が必要：
 *   社員番号 / 氏名 / メールアドレス / 部門 / 在籍フラグ
 *
 * 【在籍フラグの有効値】
 *   true, 1, ○, yes, 在籍 → 在籍（is_active: true）
 *   それ以外 → 退職（is_active: false）
 */

var SHEET_NAME = '社員マスタ';

var COLUMN_HEADERS = {
  employee_number: '社員番号',
  name: '氏名',
  email: 'メールアドレス',
  department: '部門',
  is_active: '在籍フラグ',
};

/** Spreadsheet を開いたときにカスタムメニューを追加する */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('U-Safe')
    .addItem('社員マスタを最新化', 'syncEmployees')
    .addToUi();
}

/** U-Safe へ社員マスタを同期する */
function syncEmployees() {
  var props = PropertiesService.getScriptProperties();
  var apiUrl = props.getProperty('USAFE_API_URL');
  var secret = props.getProperty('USAFE_SYNC_SECRET');

  if (!apiUrl || !secret) {
    SpreadsheetApp.getUi().alert(
      'Script Properties が設定されていません。\n' +
      'USAFE_API_URL と USAFE_SYNC_SECRET を設定してください。'
    );
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('「' + SHEET_NAME + '」シートが見つかりません。');
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('社員データがありません（ヘッダー行のみ）。');
    return;
  }

  // ヘッダー行から列インデックスを解決する
  var headers = data[0].map(function(h) { return String(h); });
  var col = {};
  var missingCols = [];
  for (var key in COLUMN_HEADERS) {
    var idx = headers.indexOf(COLUMN_HEADERS[key]);
    if (idx === -1) {
      missingCols.push(COLUMN_HEADERS[key]);
    } else {
      col[key] = idx;
    }
  }
  if (missingCols.length > 0) {
    SpreadsheetApp.getUi().alert('必要な列が見つかりません: ' + missingCols.join(', '));
    return;
  }

  // 社員リストを構築する
  var employees = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var empNumber = String(row[col.employee_number] || '').trim();
    if (!empNumber) continue; // 社員番号が空の行はスキップ

    var isActiveRaw = row[col.is_active];
    var isActiveStr = String(isActiveRaw).trim().toLowerCase();
    var isActive = (
      isActiveRaw === true ||
      isActiveRaw === 1 ||
      isActiveStr === '○' ||
      isActiveStr === 'yes' ||
      isActiveStr === '在籍' ||
      isActiveStr === 'true'
    );

    employees.push({
      employee_number: empNumber,
      name: String(row[col.name] || '').trim(),
      email: String(row[col.email] || '').trim().toLowerCase(),
      department: String(row[col.department] || '').trim() || null,
      is_active: isActive,
    });
  }

  if (employees.length === 0) {
    SpreadsheetApp.getUi().alert('有効な社員データが見つかりません。');
    return;
  }

  // U-Safe API へ POST する
  try {
    var response = UrlFetchApp.fetch(apiUrl + '/api/employees/sync', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + secret },
      payload: JSON.stringify({ employees: employees }),
      muteHttpExceptions: true,
    });

    var statusCode = response.getResponseCode();
    var result = JSON.parse(response.getContentText());

    if (statusCode === 200 && result.success) {
      SpreadsheetApp.getUi().alert(
        'U-Safeの社員マスタを最新化しました。\n対象社員数：' + result.received + '名'
      );
    } else {
      // エラー詳細はログのみに記録（Secret は含めない）
      Logger.log('[U-Safe sync] status=' + statusCode + ' error=' + (result.error || 'unknown'));
      SpreadsheetApp.getUi().alert('U-Safeの社員マスタ最新化に失敗しました。');
    }
  } catch (e) {
    Logger.log('[U-Safe sync] Exception: ' + e.toString());
    SpreadsheetApp.getUi().alert('U-Safeの社員マスタ最新化に失敗しました。');
  }
}
