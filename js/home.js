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

  const wrongbookLink = document.getElementById('wrongbook-link');
  if (wrongbookLink) {
    wrongbookLink.hidden = false;
  }

  const logLink = document.getElementById('quiz-log-link');
  if (logLink && isAdmin) {
    logLink.href = `https://docs.google.com/spreadsheets/d/${QUIZ_LOG_SHEET_ID}/edit`;
    logLink.hidden = false;
  }

  const englishEditLinks = document.getElementById('english-edit-links');
  if (englishEditLinks && isAdmin) {
    englishEditLinks.innerHTML = ENGLISH_LEVELS.map(
      (level) => `
      <a class="home-link" href="https://docs.google.com/spreadsheets/d/${level.vocabSheetId}/edit" target="_blank" rel="noopener">📖 ${escapeHtml(level.courseName)} 單字</a>
      <a class="home-link" href="https://docs.google.com/spreadsheets/d/${level.sentenceSheetId}/edit" target="_blank" rel="noopener">📝 ${escapeHtml(level.courseName)} 例句</a>
    `
    ).join('');
  }

  const searchInput = document.getElementById('unit-search');
  const subjectChipRow = document.getElementById('subject-chips');
  const courseChipRow = document.getElementById('course-chips');
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
          isEnglish: !!unit.isEnglish,
        });
      });
    });
  });

  if (units.length === 0) {
    grid.innerHTML = '<p class="empty-state">目錄裡還沒有啟用中的單元。</p>';
    return;
  }

  let activeSubject = '全部';
  let activeCourse = '全部';

  function makeChip(row, label, isActive, onClick) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (isActive ? ' active' : '');
    chip.textContent = label;
    chip.addEventListener('click', onClick);
    row.appendChild(chip);
    return chip;
  }

  function renderSubjectChips() {
    subjectChipRow.innerHTML = '';
    makeChip(subjectChipRow, '全部', activeSubject === '全部', () => {
      activeSubject = '全部';
      activeCourse = '全部';
      renderSubjectChips();
      renderCourseChips();
      applyFilter();
    });
    subjects.forEach((subject) => {
      makeChip(subjectChipRow, subject.name, activeSubject === subject.name, () => {
        activeSubject = subject.name;
        activeCourse = '全部';
        renderSubjectChips();
        renderCourseChips();
        applyFilter();
      });
    });
  }

  function renderCourseChips() {
    courseChipRow.innerHTML = '';
    if (activeSubject === '全部') {
      courseChipRow.hidden = true;
      return;
    }
    const subject = subjects.find((s) => s.name === activeSubject);
    if (!subject || subject.courses.length <= 1) {
      courseChipRow.hidden = true;
      return;
    }
    courseChipRow.hidden = false;
    makeChip(courseChipRow, '全部課程', activeCourse === '全部', () => {
      activeCourse = '全部';
      renderCourseChips();
      applyFilter();
    });
    subject.courses.forEach((course) => {
      makeChip(courseChipRow, course.name, activeCourse === course.name, () => {
        activeCourse = course.name;
        renderCourseChips();
        applyFilter();
      });
    });
  }

  renderSubjectChips();
  renderCourseChips();

  grid.innerHTML = '';
  units.forEach((unit) => {
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.dataset.subject = unit.subjectName;
    card.dataset.course = unit.courseName;
    card.dataset.searchText = `${unit.subjectName} ${unit.courseName} ${unit.unitName}`.toLowerCase();
    card.innerHTML = `
      <p class="unit-tag">${escapeHtml(unit.subjectName)} &gt; ${escapeHtml(unit.courseName)}</p>
      <h2>${escapeHtml(unit.unitName)}</h2>
      <div class="deck-actions">
        <a class="btn btn-primary" href="quiz.html?subject=${encodeURIComponent(unit.subjectName)}&course=${encodeURIComponent(unit.courseName)}&unit=${encodeURIComponent(unit.unitName)}">📝 開始測驗</a>
        ${
          isAdmin && !unit.isEnglish
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
      const matchesCourse = activeCourse === '全部' || card.dataset.course === activeCourse;
      const matchesSearch = tokens.every((token) => card.dataset.searchText.includes(token));
      const visible = matchesSubject && matchesCourse && matchesSearch;
      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount += 1;
    });

    emptyState.hidden = visibleCount !== 0;
  }

  searchInput.addEventListener('input', applyFilter);
}
