// 英文（Level 1、Level 2...）專用的資料存取：每個 Level 各自對應一組
// 單字清單／例句清單 Sheet，從中依「單元」欄位過濾出單一單元的題目。
// 故意依欄位「順序」而不是欄位「名稱」解析，因為不同 Level 的 Sheet
// 標題文字可能會有些微差異（例如「精簡中文釋義」vs「精簡中文釋義（不含標記）」）。
const ENGLISH_SUBJECT_NAME = '英文';

const ENGLISH_LEVELS = [
  { courseName: 'Level 1', vocabSheetId: ENGLISH_VOCAB_SHEET_ID, sentenceSheetId: ENGLISH_SENTENCE_SHEET_ID },
  { courseName: 'Level 2', vocabSheetId: ENGLISH_LEVEL2_VOCAB_SHEET_ID, sentenceSheetId: ENGLISH_LEVEL2_SENTENCE_SHEET_ID },
];

// 單字清單欄位順序：單元, 項次, 目標單字, 精簡中文釋義, 混淆單字1, 混淆單字2, 混淆單字3
const VOCAB_COL = { UNIT: 0, WORD: 2, MEANING: 3, CONFUSE1: 4, CONFUSE2: 5, CONFUSE3: 6 };
// 例句清單欄位順序：資料項次, 單元, ...(略)..., 測驗挖空句, 正確解答, 錯誤選項1, 錯誤選項2, 錯誤選項3
const SENTENCE_COL = { UNIT: 1, BLANK: 11, ANSWER: 12, WRONG1: 13, WRONG2: 14, WRONG3: 15 };

const csvRowsCache = new Map();

function fetchCsvRowsRaw(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  return fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`無法連線至 Google Sheet（狀態碼 ${res.status}）`);
    }
    return res.text();
  }).then((csvText) => {
    const parsed = Papa.parse(csvText.trim(), { skipEmptyLines: true });
    return parsed.data.slice(1); // 第一列是標題，跳過
  });
}

function getCsvRowsCached(sheetId) {
  if (!csvRowsCache.has(sheetId)) {
    csvRowsCache.set(sheetId, fetchCsvRowsRaw(sheetId));
  }
  return csvRowsCache.get(sheetId);
}

function getEnglishLevel(courseName) {
  return ENGLISH_LEVELS.find((level) => level.courseName === courseName);
}

function naturalUnitCompare(a, b) {
  const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
  const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

function uniqueOptions(answer, distractors) {
  return Array.from(new Set([answer, ...distractors.filter(Boolean)]));
}

// 掃出每個 Level 底下實際出現過的「單元」名稱，組成 英文 -> 課程(Level) -> 單元 結構。
async function fetchEnglishCourses() {
  const courses = [];

  for (const level of ENGLISH_LEVELS) {
    const rows = await getCsvRowsCached(level.vocabSheetId);
    const names = new Set();
    rows.forEach((row) => {
      const unit = (row[VOCAB_COL.UNIT] || '').trim();
      if (unit) names.add(unit);
    });
    const unitNames = Array.from(names).sort(naturalUnitCompare);
    if (unitNames.length > 0) {
      courses.push({
        name: level.courseName,
        units: unitNames.map((name) => ({ name, isEnglish: true })),
      });
    }
  }

  return courses;
}

// 模式 A（中選英）：題目為中文釋義，正確答案為英文單字，
// 選項直接使用資料本身附帶的 3 個「混淆單字」。
async function fetchVocabItems(courseName, unitName) {
  const level = getEnglishLevel(courseName);
  if (!level) throw new Error(`找不到課程「${courseName}」對應的英文資料來源`);

  const rows = await getCsvRowsCached(level.vocabSheetId);
  return rows
    .filter((row) => (row[VOCAB_COL.UNIT] || '').trim() === unitName)
    .map((row) => {
      const answer = (row[VOCAB_COL.WORD] || '').trim();
      const question = (row[VOCAB_COL.MEANING] || '').trim();
      const distractors = [row[VOCAB_COL.CONFUSE1], row[VOCAB_COL.CONFUSE2], row[VOCAB_COL.CONFUSE3]].map(
        (v) => (v || '').trim()
      );
      return { question, answer, options: uniqueOptions(answer, distractors) };
    })
    .filter((item) => item.question && item.answer);
}

// 模式 B（例句選擇題）：挖空的英文例句，選項為正確解答 + 3 個錯誤選項。
async function fetchSentenceItems(courseName, unitName) {
  const level = getEnglishLevel(courseName);
  if (!level) throw new Error(`找不到課程「${courseName}」對應的英文資料來源`);

  const rows = await getCsvRowsCached(level.sentenceSheetId);
  return rows
    .filter((row) => (row[SENTENCE_COL.UNIT] || '').trim() === unitName)
    .map((row) => {
      const answer = (row[SENTENCE_COL.ANSWER] || '').trim();
      const question = (row[SENTENCE_COL.BLANK] || '').trim();
      const distractors = [row[SENTENCE_COL.WRONG1], row[SENTENCE_COL.WRONG2], row[SENTENCE_COL.WRONG3]].map(
        (v) => (v || '').trim()
      );
      return { question, answer, options: uniqueOptions(answer, distractors) };
    })
    .filter((item) => item.question && item.answer);
}
