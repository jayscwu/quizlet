// 把測驗結果送到「測驗紀錄」Google Sheet（透過 Apps Script 部署的網頁應用程式端點）。
// QUIZ_LOG_ENDPOINT 尚未設定前，這裡會直接跳過，不影響學生看到自己的測驗結果。
const QUIZ_LOG_ENDPOINT = '';

function logQuizResult({ studentName, subjectName, courseName, unitName, quizType, total, correct }) {
  if (!QUIZ_LOG_ENDPOINT) return;

  const wrong = total - correct;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const payload = {
    studentName,
    subject: subjectName,
    course: courseName,
    unit: unitName,
    quizType: quizType === 'spelling' ? '拼字測驗' : '選擇題',
    takenAt: new Date().toISOString(),
    total,
    correct,
    wrong,
    percent,
  };

  // 用 no-cors + text/plain 送出，避開 Apps Script 對 CORS preflight 的支援問題。
  // 讀不到回應也沒關係，這只是背景記錄，失敗不影響學生看到自己的成績。
  fetch(QUIZ_LOG_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
