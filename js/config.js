// 題庫設定：每一份 Google Sheet 對應一個題庫（deck）
// 之後要新增題庫，只要在這裡加入一筆新的物件即可。
const DECKS = [
  {
    id: 'unit01',
    name: 'Level 1 - Unit 01',
    sheetId: '1l4zrivemBon9MKM9si-mzbZuNbPrwtg2p3eknmZG-t8',
  },
  {
    id: 'unit02',
    name: 'Level 1 - Unit 02',
    sheetId: '1_U1zfNY2fOdS4qCyz2FdKoghF6vMDRs-OPHA-iQ6v7g',
  },
  {
    id: 'unit03',
    name: 'Level 1 - Unit 03',
    sheetId: '1oy53aH3DfG__8h0L6o0lxkV7MLu1sCymIoDUVYmU19o',
  },
  {
    id: 'unit04',
    name: 'Level 1 - Unit 04',
    sheetId: '1WUjsoh_VHiJSwVZp-XvUKN75ijOHkCZJtosmN04dnIM',
  },
];

function getDeckById(id) {
  return DECKS.find((d) => d.id === id);
}
