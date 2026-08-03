// 簡易登入保護：僅用於區分「學生」「老師」看到的介面，不是真正的安全機制。
// 因為這是純前端的公開網站，兩組密碼的雜湊值都會被放在公開原始碼中，
// 任何懂技術的人都可能繞過或暴力破解。
// 老師模式能看到的「編輯題庫」連結，實際能不能編輯還是由 Google 試算表
// 自己的共用權限決定；這裡的登入只是切換介面，不是真正的存取控管。
const AUTH_STORAGE_KEY = 'quizlet_authed_v1';
const STUDENT_PASSWORD_HASH = '53d6668b995a4117d05d7799f6563672f4659d05f9f9fd45f961164de256b5d0'; // 0709
const ADMIN_PASSWORD_HASH = 'b5ac8ff9fde613ff3122ffcab1cb500a6a18aa1464ca10d69a0b2e7c690a79d2'; // 0131

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getRole() {
  const role = localStorage.getItem(AUTH_STORAGE_KEY);
  return role === 'admin' ? 'admin' : role === 'student' ? 'student' : null;
}

function isAuthed() {
  return getRole() !== null;
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  location.reload();
}

function requireAuth(onSuccess) {
  const role = getRole();
  if (role) {
    onSuccess(role);
    return;
  }
  showLoginGate(onSuccess);
}

function showLoginGate(onSuccess) {
  const overlay = document.createElement('div');
  overlay.id = 'auth-gate';
  overlay.innerHTML = `
    <form class="auth-card" id="auth-form">
      <h2>🔒 請輸入密碼</h2>
      <input type="password" id="auth-password" placeholder="密碼" autocomplete="current-password" autofocus />
      <button type="submit" class="btn btn-primary">登入</button>
      <p class="auth-error" id="auth-error" hidden>密碼錯誤，請再試一次</p>
    </form>
  `;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('#auth-form');
  const input = overlay.querySelector('#auth-password');
  const errorEl = overlay.querySelector('#auth-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hash = await sha256Hex(input.value);
    let role = null;
    if (hash === STUDENT_PASSWORD_HASH) role = 'student';
    else if (hash === ADMIN_PASSWORD_HASH) role = 'admin';

    if (role) {
      localStorage.setItem(AUTH_STORAGE_KEY, role);
      overlay.remove();
      onSuccess(role);
    } else {
      errorEl.hidden = false;
      input.value = '';
      input.focus();
    }
  });
}
