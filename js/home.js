document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initHomePage);
});

async function initHomePage() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.hidden = false;
    logoutBtn.addEventListener('click', logout);
  }

  const grid = document.getElementById('subject-grid');
  grid.innerHTML = '<p class="loading">科目載入中，請稍候...</p>';

  try {
    const subjects = await fetchDirectory();

    if (subjects.length === 0) {
      grid.innerHTML = '<p class="empty-state">目錄裡還沒有啟用中的科目。</p>';
      return;
    }

    grid.innerHTML = '';
    subjects.forEach((subject) => {
      const unitCount = subject.courses.reduce((sum, c) => sum + c.units.length, 0);
      const card = document.createElement('div');
      card.className = 'deck-card';
      card.innerHTML = `
        <h2>${escapeHtml(subject.name)}</h2>
        <p class="deck-count">共 ${subject.courses.length} 個課程、${unitCount} 個單元</p>
        <div class="deck-actions">
          <a class="btn btn-primary" href="subject.html?subject=${encodeURIComponent(subject.name)}">📖 查看課程</a>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="error">載入科目目錄失敗：${err.message}</p>`;
  }
}
