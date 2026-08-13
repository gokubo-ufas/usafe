/**
 * U-Safe 社員マスタ同期スクリプト
 * ============================================================
 * 【設計方針】
 * GASは社員マスタの事前同期専用。
 * 災害発生時のU-Safe発報処理は、
 * 最後に正常同期されたSupabase employeesを利用し、
 * Google Sheets / GASには依存しない。
 * ============================================================
 *
 * 【Script Properties 設定】（コードへ直接書かないこと）
 *   USAFE_API_URL    : https://xxxxx.vercel.app
 *   USAFE_SYNC_SECRET: U-Safe側のGAS_SYNC_SECRETと同じ値
 *
 * 【スプレッドシート列定義】
 *   A列(0): 社員番号   ※必須
 *   B列(1): 氏名       ※必須
 *   C列(2): メールアドレス ※必須
 *   D列(3): 部門
 *   E列(4): 退職FLG（空欄=在籍 / ●=退職 / それ以外=エラー）
 *
 * データ開始行: 3行目
 */

// ── 定数 ──────────────────────────────────────────────────────

var SHEET_NAME    = '社員マスタ';
var DATA_START_ROW = 3;   // データ開始行（1-indexed）
var NUM_COLS       = 5;   // A〜E列

// 列インデックス（0-indexed）
var COL = {
  employee_number: 0,  // A
  name:            1,  // B
  email:           2,  // C
  department:      3,  // D
  retired_flag:    4,  // E
};

// ── カスタムメニュー ──────────────────────────────────────────

/**
 * Spreadsheetを開いたときに「U-Safe」メニューを追加する。
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('U-Safe')
    .addItem('社員マスタを最新化', 'syncEmployees')
    .addToUi();
}

// ── 同期処理 ──────────────────────────────────────────────────

/**
 * U-Safe へ社員マスタを同期する。
 * LockServiceで二重実行を防止する。
 */
function syncEmployees() {
  // 二重実行防止（LockService）
  var lock = LockService.getScriptLock();
  var acquired = lock.tryLock(0);
  if (!acquired) {
    SpreadsheetApp.getUi().alert('現在、社員マスタの同期処理が実行中です。');
    return;
  }

  try {
    _doSync();
  } finally {
    lock.releaseLock();
  }
}

/**
 * 同期の実処理。syncEmployees()からのみ呼ばれる。
 */
function _doSync() {
  var ui = SpreadsheetApp.getUi();

  // ── Script Properties 取得 ───────────────────────────────────
  var props  = PropertiesService.getScriptProperties();
  var apiUrl = props.getProperty('USAFE_API_URL');
  var secret = props.getProperty('USAFE_SYNC_SECRET');

  if (!apiUrl || !secret) {
    ui.alert(
      'Script Properties が設定されていません。\n' +
      'USAFE_API_URL と USAFE_SYNC_SECRET を設定してください。'
    );
    return;
  }

  // URL末尾の / を正規化して /api/employees/sync を連結する
  var endpoint = apiUrl.replace(/\/+$/, '') + '/api/employees/sync';

  // ── シート取得 ───────────────────────────────────────────────
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    ui.alert('「' + SHEET_NAME + '」シートが見つかりません。');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    ui.alert('社員データがありません（' + DATA_START_ROW + '行目以降にデータがありません）。');
    return;
  }

  // ── スプレッドシート読取 ─────────────────────────────────────
  var numRows = lastRow - DATA_START_ROW + 1;
  var data    = sheet.getRange(DATA_START_ROW, 1, numRows, NUM_COLS).getValues();

  var employees = [];

  for (var i = 0; i < data.length; i++) {
    var row    = data[i];
    var rowNum = DATA_START_ROW + i;   // Spreadsheet上の実際の行番号

    // 完全空行スキップ（A〜E列がすべて空）
    var allEmpty = true;
    for (var c = 0; c < NUM_COLS; c++) {
      if (String(row[c]).trim() !== '') { allEmpty = false; break; }
    }
    if (allEmpty) continue;

    // 必須項目チェック（社員番号・氏名・メールアドレス）
    var empNumber = String(row[COL.employee_number] || '').trim();
    var name      = String(row[COL.name]            || '').trim();
    var email     = String(row[COL.email]           || '').trim().toLowerCase();

    if (!empNumber) {
      ui.alert(rowNum + '行目：社員番号が入力されていません。同期を中止します。');
      return;
    }
    if (!name) {
      ui.alert(rowNum + '行目：氏名が入力されていません。同期を中止します。');
      return;
    }
    if (!email) {
      ui.alert(rowNum + '行目：メールアドレスが入力されていません。同期を中止します。');
      return;
    }

    // 退職FLG変換
    // 空欄 → is_active: true（在籍）
    // ●   → is_active: false（退職）
    // それ以外 → エラーで中止
    var retiredFlagStr = String(row[COL.retired_flag]).trim();
    var isActive;

    if (retiredFlagStr === '') {
      isActive = true;
    } else if (retiredFlagStr === '●') {
      isActive = false;
    } else {
      ui.alert(
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
    ui.alert('有効な社員データが見つかりません。');
    return;
  }

  // ── U-Safe API呼び出し ───────────────────────────────────────
  // Authorization ヘッダーのSecretはログに出力しない
  var response;
  try {
    response = UrlFetchApp.fetch(endpoint, {
      method:          'post',
      contentType:     'application/json',
      headers:         { Authorization: 'Bearer ' + secret },
      payload:         JSON.stringify({ employees: employees }),
      muteHttpExceptions: true,
    });
  } catch (e) {
    // 通信例外（ネットワーク障害・タイムアウト等）
    Logger.log('[U-Safe sync] 通信エラー: ' + e.toString());
    ui.alert(
      'U-Safeへの接続に失敗しました。\n' +
      'ネットワーク接続とUSAFE_API_URLを確認してください。'
    );
    return;
  }

  var statusCode = response.getResponseCode();

  var result;
  try {
    result = JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log('[U-Safe sync] レスポンス解析エラー status=' + statusCode);
    ui.alert('U-Safeから予期しないレスポンスが返されました。（HTTP ' + statusCode + '）');
    return;
  }

  // ── 結果表示 ─────────────────────────────────────────────────
  if (statusCode === 200 && result.success) {
    // 成功ダイアログ
    ui.alert(
      'U-Safeの社員マスタを最新化しました。\n\n' +
      '対象社員数：' + result.received + '名\n' +
      '発報対象：'   + result.active   + '名\n' +
      '対象外：'     + result.inactive + '名'
    );
  } else {
    // 失敗ダイアログ（Secretは含めない）
    var errorMsg = (result && result.error) ? result.error : '不明なエラー';
    Logger.log('[U-Safe sync] 失敗 status=' + statusCode + ' error=' + errorMsg);
    ui.alert(
      'U-Safeの社員マスタ最新化に失敗しました。\n' +
      'HTTP ' + statusCode + '：' + errorMsg
    );
  }
}

// ── GAS Web App エンドポイント（GET） ────────────────────────────
// U-Safe の /api/employees/preview から呼ばれる。
// 3行目以降のA〜E列をそのまま2次元配列で返す。解釈はU-Safe側で行う。

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Sheet not found: ' + SHEET_NAME }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < DATA_START_ROW) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var numRows = lastRow - DATA_START_ROW + 1;
    var data    = sheet.getRange(DATA_START_ROW, 1, numRows, NUM_COLS).getValues();

    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
