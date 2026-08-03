document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initSubjectPage);
});

async function initSubjectPage() {
  const params = new URLSearchParams(location.search);
  const subjectName = params.get('subject');

  const titleEl = document.getElementById('subject-title');
  const grid = document.getElementById('course-grid');

  if (!subjectName) {
    titleEl.textContent = '找不到科目';
    grid.innerHTML = '<p class="error">找不到指定的科目，請回首頁重新選擇。</p>';
    return;
  }

  titleEl.textContent = subjectName;
  document.title = `${subjectName}｜課程列表`;
  grid.innerHTML = '<p class="loading">課程載入中，請稍候...</p>';

  try {
    const subjects = await fetchDirectory();
    const subject = findSubject(subjects, subjectName);

    if (!subject) {
      grid.innerHTML = '<p class="error">找不到這個科目，請回首頁重新選擇。</p>';
      return;
    }

    grid.innerHTML = '';
    subject.courses.forEach((course) => {
      const card = document.createElement('div');
      card.className = 'deck-card';
      card.innerHTML = `
        <h2>${escapeHtml(course.name)}</h2>
        <p class="deck-count">共 ${course.units.length} 個單元</p>
        <div class="deck-actions">
          <a class="btn btn-primary" href="course.html?subject=${encodeURIComponent(subject.name)}&course=${encodeURIComponent(course.name)}">📂 查看單元</a>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="error">載入課程失敗：${err.message}</p>`;
  }
}
