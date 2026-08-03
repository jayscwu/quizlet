function renderTest(container, items, context) {
  const order = shuffle(items.map((_, i) => i));
  let pos = 0;
  let score = 0;
  let answered = false;
  const wrongAnswers = [];

  function renderQuestion() {
    answered = false;
    const item = items[order[pos]];
    const options = shuffle(item.options);

    container.innerHTML = `
      <div class="question-block">
        <div class="progress">第 ${pos + 1} / ${items.length} 題</div>
        <div class="question-text">${renderBlankQuestion(item.question)}</div>
        <div class="options-list" id="options-list"></div>
        <div class="question-footer">
          <span class="score-badge">目前得分：${score} / ${pos}</span>
          <button class="control-btn" id="next-btn" style="display:none;">
            ${pos + 1 === items.length ? '看結果 →' : '下一題 →'}
          </button>
        </div>
      </div>
    `;

    const list = container.querySelector('#options-list');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(btn, opt, item));
      list.appendChild(btn);
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

  function handleAnswer(btn, chosen, item) {
    if (answered) return;
    answered = true;

    const isCorrect = chosen === item.answer;
    if (isCorrect) {
      score += 1;
      btn.classList.add('correct');
    } else {
      btn.classList.add('wrong');
      wrongAnswers.push({ question: item.question, answer: item.answer, chosen });
    }

    container.querySelectorAll('.option-btn').forEach((b) => {
      b.disabled = true;
      if (b.textContent === item.answer) b.classList.add('correct');
    });

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
      quizType: 'choice',
      total: items.length,
      correct: score,
    });

    container.innerHTML = `
      <div class="result-card">
        <div>測驗完成！</div>
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
      renderTest(container, items, context);
    });
  }

  renderQuestion();
}
