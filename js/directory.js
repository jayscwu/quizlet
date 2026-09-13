// 組出 科目 -> 課程 -> 單元 的結構，來源有兩個，會合併在一起：
// 1. 英文 Level 1：自動從單字清單 Sheet 掃描「單元」欄位偵測（見 js/englishdata.js）
// 2. 其他科目：透過「目錄」Google Sheet 手動維護
// 故意用欄位「順序」而不是欄位「名稱」解析目錄 Sheet，這樣就算維護目錄 Sheet 的人
// 不小心改動或清空標題列文字，網站仍然能正常運作。
// 目錄 Sheet 欄位順序固定為：科目, 課程, 單元, 單元題庫SheetID, 啟用

async function fetchDirectory() {
  const [sheetSubjects, englishSubject] = await Promise.all([
    fetchDirectorySheetSubjects(),
    buildEnglishSubject(),
  ]);

  const subjects = [];
  sheetSubjects.forEach((subject) => mergeSubjectInto(subjects, subject));
  if (englishSubject) mergeSubjectInto(subjects, englishSubject);

  return subjects;
}

// 合併時若同一課程下出現同名單元（例如目錄 Sheet 裡還留著舊資料，
// 剛好跟自動偵測的英文單元同名），後合併進來的那筆會取代先前的，
// 呼叫順序上自動偵測的英文一定最後合併，所以新資料一定會贏過舊資料。
function mergeSubjectInto(subjects, subject) {
  const existingSubject = subjects.find((s) => s.name === subject.name);
  if (!existingSubject) {
    subjects.push(subject);
    return;
  }
  subject.courses.forEach((course) => {
    const existingCourse = existingSubject.courses.find((c) => c.name === course.name);
    if (!existingCourse) {
      existingSubject.courses.push(course);
      return;
    }
    course.units.forEach((unit) => {
      const dupIndex = existingCourse.units.findIndex((u) => u.name === unit.name);
      if (dupIndex !== -1) {
        existingCourse.units.splice(dupIndex, 1);
      }
      existingCourse.units.push(unit);
    });
  });
}

async function buildEnglishSubject() {
  const unitNames = await fetchEnglishUnitNames();
  if (unitNames.length === 0) return null;
  return {
    name: ENGLISH_SUBJECT_NAME,
    courses: [
      {
        name: ENGLISH_COURSE_NAME,
        units: unitNames.map((name) => ({ name, isEnglish: true })),
      },
    ],
  };
}

async function fetchDirectorySheetSubjects() {
  const url = `https://docs.google.com/spreadsheets/d/${DIRECTORY_SHEET_ID}/gviz/tq?tqx=out:csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`無法連線至目錄 Sheet（狀態碼 ${res.status}）`);
  }
  const csvText = await res.text();
  const parsed = Papa.parse(csvText.trim(), { skipEmptyLines: true });
  const rows = parsed.data.slice(1); // 第一列是標題，跳過

  const subjects = [];

  rows.forEach((row) => {
    const subjectName = (row[0] || '').trim();
    const courseName = (row[1] || '').trim();
    const unitName = (row[2] || '').trim();
    const unitSheetId = (row[3] || '').trim();
    const enabled = (row[4] || '').trim();

    if (enabled !== '是') return;
    if (!subjectName || !courseName || !unitName || !unitSheetId) return;

    let subject = subjects.find((s) => s.name === subjectName);
    if (!subject) {
      subject = { name: subjectName, courses: [] };
      subjects.push(subject);
    }

    let course = subject.courses.find((c) => c.name === courseName);
    if (!course) {
      course = { name: courseName, units: [] };
      subject.courses.push(course);
    }

    course.units.push({ name: unitName, sheetId: unitSheetId });
  });

  return subjects;
}

function findSubject(subjects, name) {
  return subjects.find((s) => s.name === name);
}

function findCourse(subject, name) {
  return subject ? subject.courses.find((c) => c.name === name) : undefined;
}

function findUnit(course, name) {
  return course ? course.units.find((u) => u.name === name) : undefined;
}
