// 這份程式碼不是給網站直接執行的，是要貼到「測驗紀錄」Google Sheet 的
// Apps Script 編輯器裡（擴充功能 → Apps Script），部署成網頁應用程式，
// 讓網站可以用 POST 請求寫入一列測驗結果。詳細部署步驟見 README.md。

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['學生姓名', '科目', '課程', '單元', '題型', '測驗時間', '總題數', '答對題數', '答錯題數', '正確率']);
  }

  sheet.appendRow([
    data.studentName,
    data.subject,
    data.course,
    data.unit,
    data.quizType,
    data.takenAt,
    data.total,
    data.correct,
    data.wrong,
    data.percent + '%',
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
}
