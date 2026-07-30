# 英文題庫測驗網

一個以 Google Sheet 作為題庫來源的 Quizlet 風格英文測驗網站，純前端（HTML / CSS / JavaScript），無需伺服器或建置流程，可直接部署到 GitHub Pages。

## 功能

- 首頁列出所有題庫（deck），並即時顯示題目數量
- **單字卡模式**：點擊卡片翻面查看答案，可上一題 / 下一題 / 隨機排序
- **測驗模式**：四選一測驗，作答後立即顯示對錯，測驗結束顯示分數與錯題列表，可重新測驗

## 資料來源

每份題庫是一個 Google Sheet，需符合以下欄位（見任一份現有題庫）：

| 單元 | 題號 | 題目 | 正確答案 | 第一個其他答案 | 第二個其他答案 | 第三個其他答案 |
|---|---|---|---|---|---|---|

- `題目` 中的空格請用底線表示，例如 `Judy is _____ hard-working student.`
- 若某題的錯誤選項不足 3 個，可以用 `X` 填入空缺欄位，程式會自動忽略。
- Google Sheet 需設定為「知道連結的任何人皆可查看」，網站是透過 Google 的 CSV 匯出端點在瀏覽器端即時讀取資料，未使用任何金鑰或後端服務。

## 新增題庫

編輯 [`js/config.js`](js/config.js)，在 `DECKS` 陣列中新增一筆物件：

```js
{
  id: 'unit05',                 // 網址參數用的代稱，需唯一
  name: 'Level 1 - Unit 05',    // 顯示在首頁的名稱
  sheetId: '你的 Google Sheet ID', // 從 Sheet 網址取得
}
```

`sheetId` 是 Google Sheet 網址中 `/d/` 與 `/edit` 之間的那段字串。

## 本機預覽

這是純靜態網站，用任何簡易 HTTP 伺服器開啟 `index.html` 即可（部分瀏覽器對 `file://` 開啟本地檔案會有限制，建議用本機伺服器）：

```bash
npx serve .
```

或使用 Python：

```bash
python -m http.server 8000
```

然後開啟 http://localhost:8000

## 部署到 GitHub Pages

1. 將此資料夾推送到 GitHub 上的一個 repository
2. 到 repository 的 **Settings → Pages**
3. Source 選擇 `Deploy from a branch`，Branch 選擇 `main`（或 `master`）、資料夾選擇 `/ (root)`
4. 儲存後，GitHub 會提供一個 `https://<你的帳號>.github.io/<repo名稱>/` 網址

## 專案結構

```
.
├── index.html        # 首頁：題庫列表
├── quiz.html          # 單字卡 / 測驗頁面
├── css/style.css      # 樣式
└── js/
    ├── config.js      # 題庫設定（Sheet ID 對照表）
    ├── sheet.js       # 抓取並解析 Google Sheet CSV 資料
    ├── home.js         # 首頁邏輯
    ├── flashcards.js   # 單字卡模式
    ├── testmode.js     # 測驗模式
    └── quiz.js         # 測驗頁面路由（依網址參數決定顯示模式）
```

## 未來可擴充方向

- 學習模式（Learn mode，答錯的題目會重複出現）
- 依單元分段測驗，而非整份題庫
- 錯題收藏 / 本地紀錄測驗歷史
- 支援日文、韓文等其他語言題庫
