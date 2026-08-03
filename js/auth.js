// 簡易登入保護：僅用於區分使用者身分與角色，不是真正的安全機制。
// 因為這是純前端的公開網站，所有密碼雜湊值都會被放在公開原始碼中，
// 任何懂技術的人都可能繞過或暴力破解。
// 老師模式能看到的「編輯題庫」「查看測驗紀錄」連結，實際能不能存取
// 還是由 Google 那邊的共用權限決定；這裡的登入只是切換介面，不是真正的存取控管。
const AUTH_STORAGE_KEY = 'quizlet_auth_v2';

const USERS = [
  { name: 'Mason', role: 'student', passwordHash: '53d6668b995a4117d05d7799f6563672f4659d05f9f9fd45f961164de256b5d0' },
  { name: 'Emily', role: 'student', passwordHash: 'a67ae99df04ecbdbbd885e266be5c7ffaba85d003ca5b9c9e7ac1c5699acb1ac' },
  { name: 'Jay', role: 'admin', passwordHash: '1bec026ad7b921c876e44e89dd076cd90aab9665e0cd0b38512d137982acbd3b' },
  { name: 'Jane', role: 'admin', passwordHash: 'b5ac8ff9fde613ff3122ffcab1cb500a6a18aa1464ca10d69a0b2e7c690a79d2' },
];

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.name && parsed.role) return parsed;
  } catch (err) {
    // 舊格式或壞掉的資料，當作未登入
  }
  return null;
}

function isAuthed() {
  return getCurrentUser() !== null;
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  location.reload();
}

function requireAuth(onSuccess) {
  const user = getCurrentUser();
  if (user) {
    onSuccess(user);
    return;
  }
  showLoginGate(onSuccess);
}

function showLoginGate(onSuccess) {
  const overlay = document.createElement('div');
  overlay.id = 'auth-gate';
  overlay.innerHTML = `
    <form class="auth-card" id="auth-form">
      <h2>🔒 請選擇身份並輸入密碼</h2>
      <div class="user-select" id="user-select">
        ${USERS.map((u) => `<button type="button" class="user-chip" data-name="${u.name}">${u.name}</button>`).join('')}
      </div>
      <input type="password" id="auth-password" placeholder="密碼" autocomplete="current-password" />
      <button type="submit" class="btn btn-primary">登入</button>
      <p class="auth-error" id="auth-error" hidden></p>
    </form>
  `;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('#auth-form');
  const userSelect = overlay.querySelector('#user-select');
  const input = overlay.querySelector('#auth-password');
  const errorEl = overlay.querySelector('#auth-error');
  let selectedName = null;

  userSelect.querySelectorAll('.user-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedName = chip.dataset.name;
      userSelect.querySelectorAll('.user-chip').forEach((c) => c.classList.toggle('active', c === chip));
      errorEl.hidden = true;
      input.focus();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedName) {
      errorEl.textContent = '請先選擇身份';
      errorEl.hidden = false;
      return;
    }

    const user = USERS.find((u) => u.name === selectedName);
    const hash = await sha256Hex(input.value);

    if (user && hash === user.passwordHash) {
      const authedUser = { name: user.name, role: user.role };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authedUser));
      overlay.remove();
      onSuccess(authedUser);
    } else {
      errorEl.textContent = '密碼錯誤，請再試一次';
      errorEl.hidden = false;
      input.value = '';
      input.focus();
    }
  });
}
