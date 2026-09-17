// 這份程式碼不是給網站直接執行的，是要貼到「錯題紀錄」Google Sheet 的
// Apps Script 編輯器裡（擴充功能 → Apps Script），部署成網頁應用程式，
// 讓網站可以用 POST 請求批次寫入這次測驗答錯的題目。詳細部署步驟見 README.md。
//
// Sheet 欄位順序固定為：
// 項次, 學生姓名, 科目, 課程, 單元, 題型, 測驗時間, 題目, 正確答案, 學生作答, 選項, 啟用與否, 登載時間
// 「項次」「登載時間」由這支程式自動填入；「啟用與否」新增時一律填「是」，
// 之後想讓某筆錯題不要出現在學生的錯題本裡，直接把那一列手動改成「否」即可（不用刪除資料）。

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '項次', '學生姓名', '科目', '課程', '單元', '題型', '測驗時間',
      '題目', '正確答案', '學生作答', '選項', '啟用與否', '登載時間',
    ]);
  }

  var nextIndex = sheet.getLastRow(); // 標題佔第 1 列，剛好等於下一筆資料的項次
  var loggedAt = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  var items = data.items || [];

  items.forEach(function (item) {
    sheet.appendRow([
      nextIndex,
      data.studentName,
      data.subject,
      data.course,
      data.unit,
      data.quizType,
      data.takenAt,
      item.question,
      item.answer,
      item.chosen,
      item.options,
      '是',
      loggedAt,
    ]);
    nextIndex += 1;
  });

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
}
