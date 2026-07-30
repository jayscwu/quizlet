// 負責從 Google Sheet 抓取並解析題庫資料
const SHEET_CACHE = {};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderBlankQuestion(question) {
  return escapeHtml(question).replace(/_{3,}/g, '<span class="blank">_____</span>');
}

async function fetchDeck(sheetId) {
  if (SHEET_CACHE[sheetId]) return SHEET_CACHE[sheetId];

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`無法連線至 Google Sheet（狀態碼 ${res.status}）`);
  }
  const csvText = await res.text();
  const parsed = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true });

  const items = parsed.data
    .map((row, idx) => {
      const question = (row['題目'] || '').trim();
      const answer = (row['正確答案'] || '').trim();
      const distractors = [row['第一個其他答案'], row['第二個其他答案'], row['第三個其他答案']]
        .map((v) => (v || '').trim())
        .filter((v) => v && v.toUpperCase() !== 'X');

      const optionSet = new Set([answer, ...distractors]);

      return {
        id: idx,
        unit: (row['單元'] || '').trim(),
        no: (row['題號'] || '').trim(),
        question,
        answer,
        // 故意不在這裡排序，改由測驗畫面每次渲染時即時洗牌
        options: Array.from(optionSet),
      };
    })
    .filter((item) => item.question && item.answer);

  if (items.length === 0) {
    throw new Error('這份題庫沒有可用的題目，請確認 Google Sheet 內容與欄位名稱。');
  }

  SHEET_CACHE[sheetId] = items;
  return items;
}
