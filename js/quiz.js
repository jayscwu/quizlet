document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initQuizPage);
});

async function initQuizPage() {
  const params = new URLSearchParams(location.search);
  const deckId = params.get('deck');
  const deck = getDeckById(deckId);

  const titleEl = document.getElementById('deck-title');
  const app = document.getElementById('app');

  if (!deck) {
    titleEl.textContent = '找不到題庫';
    app.innerHTML = '<p class="error">找不到指定的題庫，請回首頁重新選擇。</p>';
    return;
  }

  titleEl.textContent = deck.name;
  document.title = `${deck.name}｜測驗`;

  app.innerHTML = '<p class="loading">題目載入中，請稍候...</p>';

  try {
    const items = await fetchDeck(deck.sheetId);
    renderTest(app, items, deck);
  } catch (err) {
    app.innerHTML = `<p class="error">載入題庫失敗：${err.message}</p>`;
  }
}
