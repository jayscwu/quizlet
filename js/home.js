document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('deck-grid');

  DECKS.forEach((deck) => {
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.innerHTML = `
      <h2>${deck.name}</h2>
      <p class="deck-count" data-deck="${deck.id}">題目數量載入中...</p>
      <div class="deck-actions">
        <a class="btn btn-primary" href="quiz.html?deck=${deck.id}&mode=flashcard">📇 單字卡</a>
        <a class="btn btn-secondary" href="quiz.html?deck=${deck.id}&mode=test">📝 測驗</a>
      </div>
    `;
    grid.appendChild(card);

    fetchDeck(deck.sheetId)
      .then((items) => {
        card.querySelector('.deck-count').textContent = `共 ${items.length} 題`;
      })
      .catch((err) => {
        card.querySelector('.deck-count').textContent = '載入失敗，請稍後再試';
        console.error(`載入題庫 ${deck.name} 失敗：`, err);
      });
  });
});
