// 把測驗結果送到「測驗紀錄」Google Sheet（透過 Apps Script 部署的網頁應用程式端點）。
// QUIZ_LOG_ENDPOINT 尚未設定前，這裡會直接跳過，不影響學生看到自己的測驗結果。
const QUIZ_LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdJwqbI1PmNy3liuG4rxRFzLem3DcYK6eRCeB0_uJ1bxv6688f5lww6AvEM3uTTXAj/exec';

// 不管使用者裝置本身的時區設定為何，都直接算出台灣時間（UTC+8），
// 避免記錄成 UTC 時間造成老師看紀錄時要自己換算。
function formatTaiwanTime(date) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const taiwanDate = new Date(utcMs + 8 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${taiwanDate.getFullYear()}-${pad(taiwanDate.getMonth() + 1)}-${pad(taiwanDate.getDate())} ` +
    `${pad(taiwanDate.getHours())}:${pad(taiwanDate.getMinutes())}:${pad(taiwanDate.getSeconds())}`
  );
}

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
    takenAt: formatTaiwanTime(new Date()),
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
