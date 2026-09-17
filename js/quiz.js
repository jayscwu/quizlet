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

    const baseContext = { user, subjectName, courseName, unitName };

    if (unit.isEnglish) {
      await initEnglishSetup(app, unitName, baseContext);
    } else {
      const items = await fetchDeck(unit.sheetId);
      renderLegacySetup(app, items, baseContext);
    }
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

function renderCountOptionsHtml(total) {
  const countOptions = buildCountOptions(total);
  return `
    <div class="setup-label">題數（共 ${total} 題）</div>
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
  `;
}

// 舊式（目錄 Sheet 驅動）單元：題型只有「選擇題／拼字測驗」二選一。
function renderLegacySetup(container, items, context) {
  const total = items.length;

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

      <div class="setup-group" id="count-group">${renderCountOptionsHtml(total)}</div>

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

// 英文自動偵測單元：測驗類別（A. 中選英／B. 例句選擇題），
// 選 A 時才會多一層「作答方式」（選擇題／拼字題）。
async function initEnglishSetup(container, unitName, baseContext) {
  const courseName = baseContext.courseName;
  let vocabItems;
  try {
    vocabItems = await fetchVocabItems(courseName, unitName);
  } catch (err) {
    container.innerHTML = `<p class="error">載入單字清單失敗：${err.message}</p>`;
    return;
  }

  let sentenceItems = null;

  container.innerHTML = `
    <div class="setup-card">
      <h2>測驗設定</h2>

      <div class="setup-group">
        <div class="setup-label">測驗類別</div>
        <label class="radio-option">
          <input type="radio" name="quiz-category" value="vocab" checked />
          A. 中選英（給中文選英文）
        </label>
        <label class="radio-option">
          <input type="radio" name="quiz-category" value="sentence" />
          B. 例句選擇題
        </label>
      </div>

      <div class="setup-group" id="answer-type-group">
        <div class="setup-label">作答方式</div>
        <label class="radio-option">
          <input type="radio" name="quiz-answer-type" value="choice" checked />
          選擇題
        </label>
        <label class="radio-option">
          <input type="radio" name="quiz-answer-type" value="spelling" />
          拼字題
        </label>
      </div>

      <div class="setup-group" id="count-group"></div>

      <button class="btn btn-primary" id="start-btn">開始測驗 →</button>
    </div>
  `;

  const answerTypeGroup = container.querySelector('#answer-type-group');
  const countGroup = container.querySelector('#count-group');
  const startBtn = container.querySelector('#start-btn');

  async function updateForCategory() {
    const category = container.querySelector('input[name="quiz-category"]:checked').value;
    answerTypeGroup.hidden = category !== 'vocab';

    if (category === 'vocab') {
      countGroup.innerHTML = renderCountOptionsHtml(vocabItems.length);
      return;
    }

    if (!sentenceItems) {
      countGroup.innerHTML = '<p class="loading">例句載入中...</p>';
      startBtn.disabled = true;
      try {
        sentenceItems = await fetchSentenceItems(courseName, unitName);
      } catch (err) {
        countGroup.innerHTML = `<p class="error">載入例句失敗：${err.message}</p>`;
        return;
      } finally {
        startBtn.disabled = false;
      }
    }
    countGroup.innerHTML = renderCountOptionsHtml(sentenceItems.length);
  }

  container.querySelectorAll('input[name="quiz-category"]').forEach((radio) => {
    radio.addEventListener('change', updateForCategory);
  });

  await updateForCategory();

  startBtn.addEventListener('click', () => {
    const category = container.querySelector('input[name="quiz-category"]:checked').value;
    const answerType = container.querySelector('input[name="quiz-answer-type"]:checked').value;
    const count = Number(container.querySelector('input[name="quiz-count"]:checked').value);

    const items = category === 'vocab' ? vocabItems : sentenceItems;
    const selected = shuffle(items).slice(0, count);

    let quizTypeLabel;
    if (category === 'vocab') {
      quizTypeLabel = answerType === 'spelling' ? '單字拼字題' : '單字選擇題';
    } else {
      quizTypeLabel = '例句選擇題';
    }

    const context = { ...baseContext, quizTypeLabel, trackWrongQuestions: true };

    if (category === 'vocab' && answerType === 'spelling') {
      renderSpelling(container, selected, context);
    } else {
      renderTest(container, selected, context);
    }
  });
}
