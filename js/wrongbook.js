document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initWrongbookPage);
});

async function initWrongbookPage(user) {
  const app = document.getElementById('app');
  app.innerHTML = '<p class="loading">載入錯題中，請稍候...</p>';

  let items;
  try {
    items = await fetchWrongQuestions(user.name);
  } catch (err) {
    app.innerHTML = `<p class="error">載入錯題失敗：${err.message}</p>`;
    return;
  }

  if (items.length === 0) {
    app.innerHTML = '<p class="empty-state">目前沒有任何錯題紀錄，繼續保持！</p>';
    return;
  }

  const groups = groupWrongQuestionsByUnit(items);
  renderWrongGroups(app, groups, user);
}

function renderWrongGroups(app, groups, user) {
  app.innerHTML = `
    <div class="deck-grid">
      ${groups
        .map(
          (group, idx) => `
        <div class="deck-card">
          <p class="unit-tag">${escapeHtml(group.subject)} &gt; ${escapeHtml(group.course)}</p>
          <h2>${escapeHtml(group.unit)}</h2>
          <p class="deck-count">${escapeHtml(group.quizType)}・共 ${group.items.length} 題</p>
          <ul class="wrong-book-list">
            ${group.items
              .map(
                (item) => `
              <li>
                <span class="wrong-book-q">${renderBlankQuestion(item.question)}</span>
                → <strong>${escapeHtml(item.answer)}</strong>
                <span class="wrong-count-badge">已錯 ${item.wrongCount} 次</span>
              </li>
            `
              )
              .join('')}
          </ul>
          <div class="deck-actions">
            <button type="button" class="btn btn-primary" data-group-index="${idx}">🔁 重新測驗（共 ${group.items.length} 題）</button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  app.querySelectorAll('[data-group-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = groups[Number(btn.dataset.groupIndex)];
      startWrongbookRetest(app, group, user);
    });
  });
}

function startWrongbookRetest(app, group, user) {
  const items = group.items.map((item) => ({
    question: item.question,
    answer: item.answer,
    options: item.options.length ? item.options : [item.answer],
  }));

  const context = {
    user,
    subjectName: group.subject,
    courseName: group.course,
    unitName: group.unit,
    quizTypeLabel: `${group.quizType}（錯題重測）`,
    trackWrongQuestions: true,
  };

  if (group.quizType.includes('拼字')) {
    renderSpelling(app, items, context);
  } else {
    renderTest(app, items, context);
  }
}
