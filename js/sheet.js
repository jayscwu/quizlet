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

// 「共用題庫課程」：整個課程只用一份題庫 Sheet（欄位同上），單元由網站自動掃描
// 「單元」欄位偵測，不透過目錄 Sheet 逐單元列出。這類課程只提供選擇題。
// 要新增這類課程，在這裡多加一筆即可。
const SHARED_DECK_COURSES = [
  { subjectName: '國文', courseName: '七上國文形音義', sheetId: CHINESE_G7A_XYY_SHEET_ID },
];

// 單元順序依 Sheet 由上到下第一次出現的順序（「第一課、第二課」是國字，無法用數字排序）。
async function fetchSharedDeckSubjects() {
  const subjects = [];

  for (const entry of SHARED_DECK_COURSES) {
    const items = await fetchDeck(entry.sheetId);
    const unitNames = Array.from(new Set(items.map((item) => item.unit).filter(Boolean)));
    if (unitNames.length === 0) continue;

    let subject = subjects.find((s) => s.name === entry.subjectName);
    if (!subject) {
      subject = { name: entry.subjectName, courses: [] };
      subjects.push(subject);
    }
    subject.courses.push({
      name: entry.courseName,
      units: unitNames.map((name) => ({ name, sheetId: entry.sheetId, isSharedDeck: true })),
    });
  }

  return subjects;
}
