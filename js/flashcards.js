function renderFlashcards(container, items, deck) {
  let order = items.map((_, i) => i);
  let pos = 0;
  let flipped = false;

  container.innerHTML = `
    <div class="flashcard-wrap">
      <div class="progress" id="fc-progress"></div>
      <div class="flashcard" id="fc-card">
        <div class="flashcard-inner">
          <div class="flashcard-face front" id="fc-front"></div>
          <div class="flashcard-face back" id="fc-back"></div>
        </div>
      </div>
      <div class="flashcard-hint">點卡片可翻面看答案</div>
      <div class="controls-row">
        <button class="control-btn" id="fc-prev">⟵ 上一題</button>
        <button class="control-btn" id="fc-shuffle">🔀 隨機排序</button>
        <button class="control-btn" id="fc-next">下一題 ⟶</button>
      </div>
    </div>
  `;

  const cardEl = container.querySelector('#fc-card');
  const frontEl = container.querySelector('#fc-front');
  const backEl = container.querySelector('#fc-back');
  const progressEl = container.querySelector('#fc-progress');

  function renderCard() {
    flipped = false;
    cardEl.classList.remove('flipped');
    const item = items[order[pos]];
    frontEl.innerHTML = renderBlankQuestion(item.question);
    backEl.textContent = item.answer;
    progressEl.textContent = `第 ${pos + 1} / ${items.length} 張`;
  }

  cardEl.addEventListener('click', () => {
    flipped = !flipped;
    cardEl.classList.toggle('flipped', flipped);
  });

  container.querySelector('#fc-prev').addEventListener('click', () => {
    pos = (pos - 1 + items.length) % items.length;
    renderCard();
  });

  container.querySelector('#fc-next').addEventListener('click', () => {
    pos = (pos + 1) % items.length;
    renderCard();
  });

  container.querySelector('#fc-shuffle').addEventListener('click', () => {
    order = shuffle(order);
    pos = 0;
    renderCard();
  });

  renderCard();
}

function renderBlankQuestion(question) {
  return escapeHtml(question).replace(/_{3,}/g, '<span class="blank">_____</span>');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
