document.addEventListener('DOMContentLoaded', () => {
  requireAuth(initHomePage);
});

function initHomePage() {
  const grid = document.getElementById('deck-grid');
  const searchInput = document.getElementById('deck-search');
  const emptyState = document.getElementById('deck-empty');
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.hidden = false;
    logoutBtn.addEventListener('click', logout);
  }

  DECKS.forEach((deck) => {
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.dataset.searchText = deck.name.toLowerCase();
    card.innerHTML = `
      <h2>${deck.name}</h2>
      <p class="deck-count" data-deck="${deck.id}">題目數量載入中...</p>
      <div class="deck-actions">
        <a class="btn btn-primary" href="quiz.html?deck=${deck.id}">📝 開始測驗</a>
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

  function applyFilter() {
    const keyword = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;
    grid.querySelectorAll('.deck-card').forEach((card) => {
      const match = !keyword || card.dataset.searchText.includes(keyword);
      card.style.display = match ? '' : 'none';
      if (match) visibleCount += 1;
    });
    emptyState.hidden = visibleCount !== 0;
  }

  searchInput.addEventListener('input', applyFilter);
}
