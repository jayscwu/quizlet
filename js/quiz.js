document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initQuizPage);
});

async function initQuizPage(user) {
  const params = new URLSearchParams(location.search);
  const subjectName = params.get('subject');
  const courseName = params.get('course');
  const unitName = params.get('unit');

  const titleEl = document.getElementById('deck-title');
  const app = document.getElementById('app');

  if (!subjectName || !courseName || !unitName) {
    titleEl.textContent = '找不到單元';
    app.innerHTML = '<p class="error">找不到指定的單元，請回首頁重新選擇。</p>';
    return;
  }

  titleEl.textContent = `${subjectName} > ${courseName} > ${unitName}`;
  document.title = `${unitName}｜測驗`;

  app.innerHTML = '<p class="loading">題目載入中，請稍候...</p>';

  try {
    const subjects = await fetchDirectory();
    const subject = findSubject(subjects, subjectName);
    const course = findCourse(subject, courseName);
    const unit = findUnit(course, unitName);

    if (!unit) {
      app.innerHTML = '<p class="error">找不到這個單元，請回首頁重新選擇。</p>';
      return;
    }

    const items = await fetchDeck(unit.sheetId);
    const context = { user, subjectName, courseName, unitName };
    renderSetup(app, items, context);
  } catch (err) {
    app.innerHTML = `<p class="error">載入題庫失敗：${err.message}</p>`;
  }
}

function buildCountOptions(total) {
  const options = [];
  for (let n = 10; n < total; n += 10) {
    options.push(n);
  }
  options.push(total);
  return options;
}

function renderSetup(container, items, context) {
  const total = items.length;
  const countOptions = buildCountOptions(total);

  container.innerHTML = `
    <div class="setup-card">
      <h2>測驗設定</h2>

      <div class="setup-group">
        <div class="setup-label">題型</div>
        <label class="radio-option">
          <input type="radio" name="quiz-type" value="choice" checked />
          選擇題（四選一）
        </label>
        <label class="radio-option">
          <input type="radio" name="quiz-type" value="spelling" />
          拼字測驗
        </label>
      </div>

      <div class="setup-group">
        <div class="setup-label">題數（題庫共 ${total} 題）</div>
        ${countOptions
          .map(
            (n) => `
          <label class="radio-option">
            <input type="radio" name="quiz-count" value="${n}" ${n === total ? 'checked' : ''} />
            ${n === total ? `全部 ${total} 題` : `${n} 題`}
          </label>
        `
          )
          .join('')}
      </div>

      <button class="btn btn-primary" id="start-btn">開始測驗 →</button>
    </div>
  `;

  container.querySelector('#start-btn').addEventListener('click', () => {
    const type = container.querySelector('input[name="quiz-type"]:checked').value;
    const count = Number(container.querySelector('input[name="quiz-count"]:checked').value);
    const selected = shuffle(items).slice(0, count);

    if (type === 'spelling') {
      renderSpelling(container, selected, context);
    } else {
      renderTest(container, selected, context);
    }
  });
}
