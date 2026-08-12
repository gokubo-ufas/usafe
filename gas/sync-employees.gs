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
 * データ開始行：3行目
 *   A列：社員番号
 *   B列：氏名
 *   C列：メールアドレス
 *   D列：部門
 *   E列：退職FLG（空欄 = 在籍 / ● = 退職 / それ以外 = エラー）
 *
 * 【必須項目】
 *   社員番号・氏名・メールアドレス（いずれかが空の非空行はエラーで中止）
 *
 * 【完全空行】
 *   A〜E列がすべて空の行はスキップする
 */

var SHEET_NAME = '社員マスタ';
var DATA_START_ROW = 3; // データ開始行（1-indexed）
var NUM_COLS = 5;       // A〜E列

// 列インデックス（0-indexed、A=0）
var COL = {
  employee_number: 0, // A
  name:            1, // B
  email:           2, // C
  department:      3, // D
  retired_flag:    4, // E
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

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    SpreadsheetApp.getUi().alert('社員データがありません（' + DATA_START_ROW + '行目以降にデータがありません）。');
    return;
  }

  var numRows = lastRow - DATA_START_ROW + 1;
  var data = sheet.getRange(DATA_START_ROW, 1, numRows, NUM_COLS).getValues();

  var employees = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var rowNum = DATA_START_ROW + i;

    // 完全空行（A〜E列がすべて空）はスキップ
    var allEmpty = true;
    for (var c = 0; c < NUM_COLS; c++) {
      if (String(row[c]).trim() !== '') { allEmpty = false; break; }
    }
    if (allEmpty) continue;

    // 必須項目チェック
    var empNumber  = String(row[COL.employee_number] || '').trim();
    var name       = String(row[COL.name]            || '').trim();
    var email      = String(row[COL.email]           || '').trim().toLowerCase();

    if (!empNumber || !name || !email) {
      SpreadsheetApp.getUi().alert(
        rowNum + '行目に必須項目が不足しています。\n' +
        '社員番号・氏名・メールアドレスはすべて必須です。\n同期を中止します。'
      );
      return;
    }

    // 退職FLG変換
    var retiredFlagStr = String(row[COL.retired_flag]).trim();
    var isActive;

    if (retiredFlagStr === '') {
      isActive = true;          // 空欄 → 在籍
    } else if (retiredFlagStr === '●') {
      isActive = false;         // ● → 退職
    } else {
      SpreadsheetApp.getUi().alert(
        rowNum + '行目の退職FLGに不正な値があります：「' + retiredFlagStr + '」\n' +
        '有効な値は空欄（在籍）または「●」（退職）のみです。\n同期を中止します。'
      );
      return;
    }

    employees.push({
      employee_number: empNumber,
      name:            name,
      email:           email,
      department:      String(row[COL.department] || '').trim() || null,
      is_active:       isActive,
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
      Logger.log('[U-Safe sync] status=' + statusCode + ' error=' + (result.error || 'unknown'));
      SpreadsheetApp.getUi().alert('U-Safeの社員マスタ最新化に失敗しました。');
    }
  } catch (e) {
    Logger.log('[U-Safe sync] Exception: ' + e.toString());
    SpreadsheetApp.getUi().alert('U-Safeの社員マスタ最新化に失敗しました。');
  }
}
