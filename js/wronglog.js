// 讀取「錯題紀錄」Sheet，篩出目前登入者自己的錯題，依「科目/課程/單元/題型/題目/正確答案」
// 去重（同一題只列一次），並統計錯了幾次。
// Sheet 欄位順序：項次, 學生姓名, 科目, 課程, 單元, 題型, 測驗時間, 題目, 正確答案, 學生作答, 選項, 啟用與否, 登載時間
const WRONG_LOG_COL = {
  STUDENT: 1,
  SUBJECT: 2,
  COURSE: 3,
  UNIT: 4,
  QUIZ_TYPE: 5,
  QUESTION: 7,
  ANSWER: 8,
  OPTIONS: 10,
  ENABLED: 11,
};

// 「單字選擇題（錯題重測）」這種重測標記，統計次數與分組時要當成
// 跟原本的「單字選擇題」是同一種題型，不然同一題從錯題本重測答錯，
// 會被當成新的一組、次數也不會跟原本的合併。
function normalizeQuizType(quizType) {
  return quizType.replace(/（[^）]*）\s*$/, '').trim();
}

async function fetchWrongQuestions(studentName) {
  const url = `https://docs.google.com/spreadsheets/d/${WRONG_LOG_SHEET_ID}/gviz/tq?tqx=out:csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`無法連線至錯題紀錄 Sheet（狀態碼 ${res.status}）`);
  }
  const csvText = await res.text();
  const parsed = Papa.parse(csvText.trim(), { skipEmptyLines: true });
  const rows = parsed.data.slice(1); // 第一列是標題，跳過

  const grouped = new Map();

  rows.forEach((row) => {
    const rowStudent = (row[WRONG_LOG_COL.STUDENT] || '').trim();
    if (rowStudent !== studentName) return;

    const enabled = (row[WRONG_LOG_COL.ENABLED] || '').trim();
    if (enabled !== '是') return;

    const subject = (row[WRONG_LOG_COL.SUBJECT] || '').trim();
    const course = (row[WRONG_LOG_COL.COURSE] || '').trim();
    const unit = (row[WRONG_LOG_COL.UNIT] || '').trim();
    const quizType = normalizeQuizType((row[WRONG_LOG_COL.QUIZ_TYPE] || '').trim());
    const question = (row[WRONG_LOG_COL.QUESTION] || '').trim();
    const answer = (row[WRONG_LOG_COL.ANSWER] || '').trim();
    const optionsRaw = (row[WRONG_LOG_COL.OPTIONS] || '').trim();

    if (!subject || !course || !unit || !quizType || !question || !answer) return;

    const key = [subject, course, unit, quizType, question, answer].join('␟');
    if (!grouped.has(key)) {
      grouped.set(key, {
        subject,
        course,
        unit,
        quizType,
        question,
        answer,
        options: optionsRaw ? optionsRaw.split('｜').filter(Boolean) : [],
        wrongCount: 0,
      });
    }
    grouped.get(key).wrongCount += 1;
  });

  return Array.from(grouped.values());
}

// 把去重後的錯題，依「科目 > 課程 > 單元 > 題型」分組，每組是一份可重測的題組。
function groupWrongQuestionsByUnit(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = [item.subject, item.course, item.unit, item.quizType].join('␟');
    if (!groups.has(key)) {
      groups.set(key, {
        subject: item.subject,
        course: item.course,
        unit: item.unit,
        quizType: item.quizType,
        items: [],
      });
    }
    groups.get(key).items.push(item);
  });

  return Array.from(groups.values());
}
