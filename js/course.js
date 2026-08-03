document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initCoursePage);
});

async function initCoursePage() {
  const params = new URLSearchParams(location.search);
  const subjectName = params.get('subject');
  const courseName = params.get('course');

  const titleEl = document.getElementById('course-title');
  const backLink = document.getElementById('back-link');
  const grid = document.getElementById('unit-grid');
  const searchInput = document.getElementById('unit-search');
  const emptyState = document.getElementById('unit-empty');

  if (!subjectName || !courseName) {
    titleEl.textContent = '找不到課程';
    grid.innerHTML = '<p class="error">找不到指定的課程，請回首頁重新選擇。</p>';
    return;
  }

  backLink.href = `subject.html?subject=${encodeURIComponent(subjectName)}`;
  titleEl.textContent = `${subjectName} > ${courseName}`;
  document.title = `${subjectName} - ${courseName}｜單元列表`;
  grid.innerHTML = '<p class="loading">單元載入中，請稍候...</p>';

  try {
    const subjects = await fetchDirectory();
    const subject = findSubject(subjects, subjectName);
    const course = findCourse(subject, courseName);

    if (!course) {
      grid.innerHTML = '<p class="error">找不到這個課程，請回首頁重新選擇。</p>';
      return;
    }

    grid.innerHTML = '';
    course.units.forEach((unit) => {
      const card = document.createElement('div');
      card.className = 'deck-card';
      card.dataset.searchText = unit.name.toLowerCase();
      card.innerHTML = `
        <h2>${escapeHtml(unit.name)}</h2>
        <p class="deck-count" data-unit="${escapeHtml(unit.name)}">題目數量載入中...</p>
        <div class="deck-actions">
          <a class="btn btn-primary" href="quiz.html?subject=${encodeURIComponent(subjectName)}&course=${encodeURIComponent(courseName)}&unit=${encodeURIComponent(unit.name)}">📝 開始測驗</a>
        </div>
      `;
      grid.appendChild(card);

      fetchDeck(unit.sheetId)
        .then((items) => {
          card.querySelector('.deck-count').textContent = `共 ${items.length} 題`;
        })
        .catch((err) => {
          card.querySelector('.deck-count').textContent = '載入失敗，請稍後再試';
          console.error(`載入單元 ${unit.name} 失敗：`, err);
        });
    });

    searchInput.addEventListener('input', () => {
      const keyword = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;
      grid.querySelectorAll('.deck-card').forEach((card) => {
        const match = !keyword || card.dataset.searchText.includes(keyword);
        card.style.display = match ? '' : 'none';
        if (match) visibleCount += 1;
      });
      emptyState.hidden = visibleCount !== 0;
    });
  } catch (err) {
    grid.innerHTML = `<p class="error">載入單元失敗：${err.message}</p>`;
  }
}
