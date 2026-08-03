document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initHomePage);
});

async function initHomePage(user) {
  const isAdmin = user.role === 'admin';

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.hidden = false;
    logoutBtn.addEventListener('click', logout);
  }

  const roleBadge = document.getElementById('role-badge');
  if (roleBadge) {
    roleBadge.textContent = isAdmin ? `🔧 ${user.name}（老師）` : `👤 ${user.name}`;
    roleBadge.hidden = false;
  }

  const logLink = document.getElementById('quiz-log-link');
  if (logLink && isAdmin) {
    logLink.href = `https://docs.google.com/spreadsheets/d/${QUIZ_LOG_SHEET_ID}/edit`;
    logLink.hidden = false;
  }

  const searchInput = document.getElementById('unit-search');
  const chipRow = document.getElementById('subject-chips');
  const grid = document.getElementById('unit-grid');
  const emptyState = document.getElementById('unit-empty');

  grid.innerHTML = '<p class="loading">單元載入中，請稍候...</p>';

  let subjects;
  try {
    subjects = await fetchDirectory();
  } catch (err) {
    grid.innerHTML = `<p class="error">載入題庫目錄失敗：${err.message}</p>`;
    return;
  }

  const units = [];
  subjects.forEach((subject) => {
    subject.courses.forEach((course) => {
      course.units.forEach((unit) => {
        units.push({
          subjectName: subject.name,
          courseName: course.name,
          unitName: unit.name,
          sheetId: unit.sheetId,
        });
      });
    });
  });

  if (units.length === 0) {
    grid.innerHTML = '<p class="empty-state">目錄裡還沒有啟用中的單元。</p>';
    return;
  }

  let activeSubject = '全部';

  const subjectChip = (name) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = name;
    chip.dataset.subject = name;
    chip.addEventListener('click', () => {
      activeSubject = name;
      chipRow.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.subject === name));
      applyFilter();
    });
    return chip;
  };

  const allChip = subjectChip('全部');
  allChip.classList.add('active');
  chipRow.appendChild(allChip);
  subjects.forEach((subject) => chipRow.appendChild(subjectChip(subject.name)));

  grid.innerHTML = '';
  units.forEach((unit) => {
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.dataset.subject = unit.subjectName;
    card.dataset.searchText = `${unit.subjectName} ${unit.courseName} ${unit.unitName}`.toLowerCase();
    card.innerHTML = `
      <p class="unit-tag">${escapeHtml(unit.subjectName)} &gt; ${escapeHtml(unit.courseName)}</p>
      <h2>${escapeHtml(unit.unitName)}</h2>
      <div class="deck-actions">
        <a class="btn btn-primary" href="quiz.html?subject=${encodeURIComponent(unit.subjectName)}&course=${encodeURIComponent(unit.courseName)}&unit=${encodeURIComponent(unit.unitName)}">📝 開始測驗</a>
        ${
          isAdmin
            ? `<a class="btn btn-secondary" href="https://docs.google.com/spreadsheets/d/${encodeURIComponent(unit.sheetId)}/edit" target="_blank" rel="noopener">✏️ 編輯題庫</a>`
            : ''
        }
      </div>
    `;
    grid.appendChild(card);
  });

  function applyFilter() {
    const tokens = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let visibleCount = 0;

    grid.querySelectorAll('.deck-card').forEach((card) => {
      const matchesSubject = activeSubject === '全部' || card.dataset.subject === activeSubject;
      const matchesSearch = tokens.every((token) => card.dataset.searchText.includes(token));
      const visible = matchesSubject && matchesSearch;
      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount += 1;
    });

    emptyState.hidden = visibleCount !== 0;
  }

  searchInput.addEventListener('input', applyFilter);
}
