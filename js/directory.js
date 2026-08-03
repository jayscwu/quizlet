// 讀取並解析「目錄」Google Sheet，組出 科目 -> 課程 -> 單元 的結構。
// 故意用欄位「順序」而不是欄位「名稱」解析，這樣就算維護目錄 Sheet 的人
// 不小心改動或清空標題列文字，網站仍然能正常運作。
// 欄位順序固定為：科目, 課程, 單元, 單元題庫SheetID, 啟用

async function fetchDirectory() {
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
