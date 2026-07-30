document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const deckId = params.get('deck');
  const mode = params.get('mode') === 'test' ? 'test' : 'flashcard';
  const deck = getDeckById(deckId);

  const titleEl = document.getElementById('deck-title');
  const modeEl = document.getElementById('mode-label');
  const app = document.getElementById('app');

  if (!deck) {
    titleEl.textContent = '找不到題庫';
    app.innerHTML = '<p class="error">找不到指定的題庫，請回首頁重新選擇。</p>';
    return;
  }

  titleEl.textContent = deck.name;
  modeEl.textContent = mode === 'test' ? '📝 測驗模式' : '📇 單字卡模式';
  document.title = `${deck.name}｜${mode === 'test' ? '測驗' : '單字卡'}`;

  app.innerHTML = '<p class="loading">題目載入中，請稍候...</p>';

  try {
    const items = await fetchDeck(deck.sheetId);
    if (mode === 'test') {
      renderTest(app, items, deck);
    } else {
      renderFlashcards(app, items, deck);
    }
  } catch (err) {
    app.innerHTML = `<p class="error">載入題庫失敗：${err.message}</p>`;
  }
});
