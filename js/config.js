// 「目錄」Google Sheet：維護科目／課程／單元的結構，以及每個單元對應的題庫 Sheet ID。
// 之後新增科目、課程、單元都直接編輯這份 Google Sheet，不需要修改程式碼。
const DIRECTORY_SHEET_ID = '16bhOrSaCZU3OjhAchA00vLdKrLQisl0Ke_nXnzKY5Qg';

// 「測驗紀錄」Google Sheet：記錄學生每次測驗的成績（見 js/quizlog.js 寫入端點設定）。
const QUIZ_LOG_SHEET_ID = '1-YrGjnaokvKE6ojkKtq96-sgOq0Fs98j73S5jisq4x0';

// 英文 Level 1（Unit 01~40）改用這兩份共用 Sheet，單元由網站自動掃描「單元」欄位偵測，
// 不再透過目錄 Sheet 手動列出（見 js/englishdata.js）。
const ENGLISH_VOCAB_SHEET_ID = '1jTd8i6JGebtsh6eZHyIxoKUpj4_Un2p4';
const ENGLISH_SENTENCE_SHEET_ID = '1PoixQ8WrFEtN00yn5OFt5hRHkXxTWZLo';

// 英文 Level 2（Unit 01~40），跟 Level 1 一樣自動偵測單元。
const ENGLISH_LEVEL2_VOCAB_SHEET_ID = '15lIYuNdemmm8s9HhM0I6NUzwXGd_SZCZ';
const ENGLISH_LEVEL2_SENTENCE_SHEET_ID = '177PIfpj37mqK0N6b25wrqIs0nQWc8snd';

// 「錯題紀錄」Google Sheet：記錄英文測驗答錯的每一題，供學生之後重新練習
// （見 js/wronglog.js 讀取邏輯、寫入端點設定）。
const WRONG_LOG_SHEET_ID = '1wijMGb6JBzyxTy8k2ZkiDXujTjeb60RXSHHUlsdeb7U';
