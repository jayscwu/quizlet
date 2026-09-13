// 英文 Level 1（Unit 01~40）專用的資料存取：從兩份共用 Sheet
// （單字清單、例句清單）讀取資料，依「單元」欄位過濾出單一單元的題目。
const ENGLISH_SUBJECT_NAME = '英文';
const ENGLISH_COURSE_NAME = 'Level 1';

let englishVocabRowsCache = null;
let englishSentenceRowsCache = null;

async function fetchCsvRows(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`無法連線至 Google Sheet（狀態碼 ${res.status}）`);
  }
  const csvText = await res.text();
  const parsed = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true });
  return parsed.data;
}

async function getEnglishVocabRows() {
  if (!englishVocabRowsCache) {
    englishVocabRowsCache = await fetchCsvRows(ENGLISH_VOCAB_SHEET_ID);
  }
  return englishVocabRowsCache;
}

async function getEnglishSentenceRows() {
  if (!englishSentenceRowsCache) {
    englishSentenceRowsCache = await fetchCsvRows(ENGLISH_SENTENCE_SHEET_ID);
  }
  return englishSentenceRowsCache;
}

function naturalUnitCompare(a, b) {
  const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
  const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

async function fetchEnglishUnitNames() {
  const rows = await getEnglishVocabRows();
  const names = new Set();
  rows.forEach((row) => {
    const unit = (row['單元'] || '').trim();
    if (unit) names.add(unit);
  });
  return Array.from(names).sort(naturalUnitCompare);
}

function uniqueOptions(answer, distractors) {
  return Array.from(new Set([answer, ...distractors.filter(Boolean)]));
}

// 模式 A（中選英）：題目為中文釋義，正確答案為英文單字，
// 選項直接使用資料本身附帶的 3 個「混淆單字」。
async function fetchVocabItems(unitName) {
  const rows = await getEnglishVocabRows();
  return rows
    .filter((row) => (row['單元'] || '').trim() === unitName)
    .map((row) => {
      const answer = (row['目標單字'] || '').trim();
      const question = (row['精簡中文釋義'] || '').trim();
      const distractors = [row['混淆單字1'], row['混淆單字2'], row['混淆單字3']].map((v) => (v || '').trim());
      return { question, answer, options: uniqueOptions(answer, distractors) };
    })
    .filter((item) => item.question && item.answer);
}

// 模式 B（例句選擇題）：挖空的英文例句，選項為正確解答 + 3 個錯誤選項。
async function fetchSentenceItems(unitName) {
  const rows = await getEnglishSentenceRows();
  return rows
    .filter((row) => (row['單元'] || '').trim() === unitName)
    .map((row) => {
      const answer = (row['正確解答'] || '').trim();
      const question = (row['測驗挖空句'] || '').trim();
      const distractors = [row['錯誤選項1'], row['錯誤選項2'], row['錯誤選項3']].map((v) => (v || '').trim());
      return { question, answer, options: uniqueOptions(answer, distractors) };
    })
    .filter((item) => item.question && item.answer);
}
