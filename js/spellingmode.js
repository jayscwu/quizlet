function normalizeSpelling(str) {
  return str.trim().toLowerCase();
}

function renderSpelling(container, items, context) {
  const order = shuffle(items.map((_, i) => i));
  let pos = 0;
  let score = 0;
  let answered = false;
  const wrongAnswers = [];

  function renderQuestion() {
    answered = false;
    const item = items[order[pos]];

    container.innerHTML = `
      <div class="question-block">
        <div class="progress">第 ${pos + 1} / ${items.length} 題</div>
        <div class="question-text">${renderBlankQuestion(item.question)}</div>
        <form id="spelling-form" class="spelling-form">
          <input
            type="text"
            id="spelling-input"
            class="spelling-input"
            placeholder="請輸入答案"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          />
          <button type="submit" class="btn btn-primary">送出</button>
        </form>
        <p class="spelling-feedback" id="spelling-feedback" hidden></p>
        <div class="question-footer">
          <span class="score-badge">目前得分：${score} / ${pos}</span>
          <button class="control-btn" id="next-btn" style="display:none;">
            ${pos + 1 === items.length ? '看結果 →' : '下一題 →'}
          </button>
        </div>
      </div>
    `;

    const form = container.querySelector('#spelling-form');
    const input = container.querySelector('#spelling-input');
    input.focus();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAnswer(input.value, item);
    });

    container.querySelector('#next-btn').addEventListener('click', () => {
      pos += 1;
      if (pos >= items.length) {
        renderResult();
      } else {
        renderQuestion();
      }
    });
  }

  function handleAnswer(rawValue, item) {
    if (answered) return;
    answered = true;

    const input = container.querySelector('#spelling-input');
    const feedback = container.querySelector('#spelling-feedback');
    const isCorrect = normalizeSpelling(rawValue) === normalizeSpelling(item.answer);

    input.disabled = true;
    feedback.hidden = false;

    if (isCorrect) {
      score += 1;
      feedback.textContent = '✅ 正確！';
      feedback.className = 'spelling-feedback correct';
    } else {
      feedback.innerHTML = `❌ 正確答案是：<strong>${escapeHtml(item.answer)}</strong>`;
      feedback.className = 'spelling-feedback wrong';
      wrongAnswers.push({ question: item.question, answer: item.answer, chosen: rawValue.trim() || '（未作答）' });
    }

    container.querySelector('.score-badge').textContent = `目前得分：${score} / ${pos + 1}`;
    container.querySelector('#next-btn').style.display = 'inline-flex';
  }

  function renderResult() {
    const percent = Math.round((score / items.length) * 100);

    logQuizResult({
      studentName: context.user.name,
      subjectName: context.subjectName,
      courseName: context.courseName,
      unitName: context.unitName,
      quizType: 'spelling',
      total: items.length,
      correct: score,
    });

    container.innerHTML = `
      <div class="result-card">
        <div>拼字測驗完成！</div>
        <div class="result-score">${score} / ${items.length}（${percent}%）</div>
        <div class="controls-row">
          <button class="control-btn" id="retry-btn">🔁 重新測驗</button>
        </div>
        ${
          wrongAnswers.length
            ? `<div class="wrong-list">
                <h3>答錯的題目（${wrongAnswers.length} 題）</h3>
                ${wrongAnswers
                  .map(
                    (w) => `
                  <div class="wrong-item">
                    <div class="q">${renderBlankQuestion(w.question)}</div>
                    <div>正確答案：<span class="a-correct">${escapeHtml(w.answer)}</span>　你的答案：<span class="a-wrong">${escapeHtml(w.chosen)}</span></div>
                  </div>
                `
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
    `;

    container.querySelector('#retry-btn').addEventListener('click', () => {
      renderSpelling(container, items, context);
    });
  }

  renderQuestion();
}
