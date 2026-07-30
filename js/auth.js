// 簡易登入保護：僅用於避免陌生人隨意瀏覽，不是真正的安全機制。
// 因為這是純前端的公開網站，密碼雜湊值本身也會被放在公開原始碼中，
// 任何懂技術的人都可能繞過或暴力破解。如需真正的存取控管，需改用後端驗證。
const AUTH_STORAGE_KEY = 'quizlet_authed_v1';
const AUTH_PASSWORD_HASH = '53d6668b995a4117d05d7799f6563672f4659d05f9f9fd45f961164de256b5d0';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isAuthed() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === '1';
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  location.reload();
}

function requireAuth(onSuccess) {
  if (isAuthed()) {
    onSuccess();
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
    if (hash === AUTH_PASSWORD_HASH) {
      localStorage.setItem(AUTH_STORAGE_KEY, '1');
      overlay.remove();
      onSuccess();
    } else {
      errorEl.hidden = false;
      input.value = '';
      input.focus();
    }
  });
}
