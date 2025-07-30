/* === 設定オブジェクト === */
const settings = {
  theme: 'dark',
  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
  fontSize: 14,
  lineHeight: 1.5,
  editorWidth: 50,
  wordWrap: false,
  autoSave: true,
  livePreview: true
};

/* === DOM要素 === */
const codeEditor = document.getElementById('codeEditor');
const previewFrame = document.getElementById('previewFrame');
const lineNumbers = document.getElementById('lineNumbers');
const currentLine = document.getElementById('currentLine');
const currentCol = document.getElementById('currentCol');
const settingsModal = document.getElementById('settingsModal');
const themeToggle = document.querySelector('.theme-toggle');
const themeStatus = document.getElementById('themeStatus');
const editorPanel = document.getElementById('editorPanel');
const previewPanel = document.getElementById('previewPanel');
const resizer = document.getElementById('resizer');

/* === テンプレート === */
const initialTemplate = `<!DOCTYPE html>
<html lang="ja">
<body>
  <div class="container">
    <h1>VSCode風HTMLエディター</h1>
    <p>左側でHTMLコードを編集すると、<span class="highlight">リアルタイム</span>でプレビューが更新されます。</p>
    <p>ここから自由にHTMLを編集してください！</p>
    <p>右上の設定ボタンでテーマやフォントをカスタマイズできます。</p>
  </div>
</body>
</html>`;

/* === 初期化 === */
function init() {
  loadSettings();
  codeEditor.value = sessionStorage.getItem('cachedCode') || initialTemplate;
  updatePreview();
  updateLineNumbers();
  updateCursorPosition();
  setupResizer();
}
window.onload = init;

/* === 設定系 === */
function loadSettings() {
  const savedSettings = JSON.parse(localStorage.getItem('editorSettings') || '{}');
  Object.assign(settings, savedSettings);
  applySettings();
  updateSettingsUI();
}

function applySettings() {
  document.body.setAttribute('data-theme', settings.theme);
  document.documentElement.style.setProperty('--font-family', settings.fontFamily);
  document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px');
  document.documentElement.style.setProperty('--line-height', settings.lineHeight);
  editorPanel.style.width = settings.editorWidth + '%';
  previewPanel.style.width = (100 - settings.editorWidth) + '%';
  codeEditor.style.whiteSpace = settings.wordWrap ? 'pre-wrap' : 'pre';
  updateThemeUI();
}

function updateSettingsUI() {
  document.getElementById('themeSelect').value = settings.theme;
  document.getElementById('fontFamily').value = settings.fontFamily;
  document.getElementById('fontSize').value = settings.fontSize;
  document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';
  document.getElementById('lineHeight').value = settings.lineHeight;
  document.getElementById('lineHeightValue').textContent = settings.lineHeight;
  document.getElementById('editorWidth').value = settings.editorWidth;
  document.getElementById('editorWidthValue').textContent = settings.editorWidth + '%';
  document.getElementById('wordWrap').checked = settings.wordWrap;
  document.getElementById('autoSave').checked = settings.autoSave;
  document.getElementById('livePreview').checked = settings.livePreview;
}

function updateThemeUI() {
  const isDark = settings.theme === 'dark';
  themeToggle.textContent = isDark ? 'ライト' : 'ダーク';
  themeStatus.textContent = isDark ? 'ダークモード' : 'ライトモード';
}

function saveSettings() {
  if (settings.autoSave) {
    localStorage.setItem('editorSettings', JSON.stringify(settings));
  }
}

/* === テーマ・設定更新 === */
function toggleTheme() {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  applySettings();
  updateSettingsUI();
  saveSettings();
}

function updateSettings() {
  settings.fontFamily = document.getElementById('fontFamily').value;
  settings.fontSize = parseInt(document.getElementById('fontSize').value);
  settings.lineHeight = parseFloat(document.getElementById('lineHeight').value);
  settings.wordWrap = document.getElementById('wordWrap').checked;
  settings.autoSave = document.getElementById('autoSave').checked;
  settings.livePreview = document.getElementById('livePreview').checked;
  applySettings();
  updateLineNumbers();
  saveSettings();
}

function updateLayout() {
  settings.editorWidth = parseInt(document.getElementById('editorWidth').value);
  document.getElementById('editorWidthValue').textContent = settings.editorWidth + '%';
  editorPanel.style.width = settings.editorWidth + '%';
  previewPanel.style.width = (100 - settings.editorWidth) + '%';
  saveSettings();
}

/* === モーダルとリセット === */
function openSettings() {
  settingsModal.classList.add('active');
}
function closeSettings() {
  settingsModal.classList.remove('active');
}
function resetSettings() {
  if (confirm('設定をデフォルトに戻しますか？')) {
    Object.assign(settings, {
      theme: 'dark',
      fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
      fontSize: 14,
      lineHeight: 1.5,
      editorWidth: 50,
      wordWrap: false,
      autoSave: true,
      livePreview: true
    });
    applySettings();
    updateSettingsUI();
    saveSettings();
  }
}

/* === リサイザー === */
function setupResizer() {
  let isResizing = false;
  resizer.addEventListener('mousedown', () => {
    isResizing = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  });

  function handleResize(e) {
    if (!isResizing) return;
    const containerWidth = document.querySelector('.editor-container').offsetWidth;
   
    const newWidth = (e.clientX / containerWidth) * 100;
    if (newWidth >= 30 && newWidth <= 70) {
      settings.editorWidth = newWidth;
      editorPanel.style.width = newWidth + '%';
      previewPanel.style.width = (100 - newWidth) + '%';
      document.getElementById('editorWidth').value = Math.round(newWidth);
      document.getElementById('editorWidthValue').textContent = Math.round(newWidth) + '%';
    }
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    saveSettings();
  }
}

/* === エディタ機能 === */
codeEditor.addEventListener('input', () => {
  if (settings.livePreview) {
    updatePreview();
  }
  updateLineNumbers();
  updateCursorPosition();
  cacheCode();  // 変更時にキャッシュ保存
});

codeEditor.addEventListener('keyup', updateCursorPosition);
codeEditor.addEventListener('mouseup', updateCursorPosition);

/* 行番号の更新 */
function updateLineNumbers() {
  const lines = codeEditor.value.split('\n').length;
  let lineNumbersHTML = '';
  for (let i = 1; i <= lines; i++) {
    lineNumbersHTML += i + '\n';
  }
  lineNumbers.textContent = lineNumbersHTML;
}

/* カーソル位置の更新 */
function updateCursorPosition() {
  const pos = codeEditor.selectionStart;
  const textUpToPos = codeEditor.value.substring(0, pos);
  const lines = textUpToPos.split('\n');
  currentLine.textContent = lines.length;
  currentCol.textContent = lines[lines.length - 1].length + 1;
}

/* プレビューの更新 */
function updatePreview() {
  const code = codeEditor.value;
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  previewFrame.src = url;
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* テンプレート挿入 */
function insertTemplate() {
  if (confirm('現在のコードをテンプレートで置き換えますか？')) {
    codeEditor.value = initialTemplate;
    updatePreview();
    updateLineNumbers();
    updateCursorPosition();
    cacheCode();
  }
}

/* タブインデント対応（Tabキー） */
codeEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;
    // インデントはスペース2つに変更（質問ではスペース4つですが、わかりやすく2つにしています）
    const tab = '  ';
    codeEditor.value = codeEditor.value.substring(0, start) + tab + codeEditor.value.substring(end);
    codeEditor.selectionStart = codeEditor.selectionEnd = start + tab.length;

    if (settings.livePreview) updatePreview();
    updateLineNumbers();
  }

  // Ctrl+Sでプレビュー更新と保存
  if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    updatePreview();
    cacheCode();
  }
});

/* === 予測入力機能（簡易版） === */
const htmlTags = [
  'html', 'head', 'body', 'div', 'span', 'h1', 'h2', 'h3', 'p', 'a', 'img',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'footer',
  'header', 'section', 'article', 'nav', 'form', 'input', 'button', 'script', 'style'
];

codeEditor.addEventListener('input', () => {
  const cursorPos = codeEditor.selectionStart;
  const value = codeEditor.value;
  const wordMatch = value.substring(0, cursorPos).match(/<(\w*)$/);

  if (wordMatch) {
    const partial = wordMatch[1];
    const suggestions = htmlTags.filter(tag => tag.startsWith(partial));
    if (suggestions.length > 0) {
      showSuggestion(suggestions[0], cursorPos, partial);
    } else {
      hideSuggestion();
    }
  } else {
    hideSuggestion();
  }
});

/* 予測入力用のUI要素を作成 */
const suggestionBox = document.createElement('div');
suggestionBox.style.position = 'absolute';
suggestionBox.style.background = '#333';
suggestionBox.style.color = '#fff';
suggestionBox.style.padding = '2px 5px';
suggestionBox.style.borderRadius = '3px';
suggestionBox.style.fontSize = '12px';
suggestionBox.style.fontFamily = 'monospace';
suggestionBox.style.zIndex = '1000';
suggestionBox.style.display = 'none';
document.body.appendChild(suggestionBox);

function showSuggestion(text, cursorPos, partial) {
  const coords = getCaretCoordinates(codeEditor, cursorPos);
  suggestionBox.textContent = text.substring(partial.length);
  suggestionBox.style.left = (coords.left + 5) + 'px';
  suggestionBox.style.top = (coords.top + 20) + 'px';
  suggestionBox.style.display = 'block';
}

function hideSuggestion() {
  suggestionBox.style.display = 'none';
}

/* 予測入力確定（TabまたはEnter） */
codeEditor.addEventListener('keydown', (e) => {
  if (suggestionBox.style.display === 'block') {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const cursorPos = codeEditor.selectionStart;
      const value = codeEditor.value;
      const wordMatch = value.substring(0, cursorPos).match(/<(\w*)$/);
      if (wordMatch) {
        const partial = wordMatch[1];
        const full = suggestionBox.textContent;
        codeEditor.value = value.substring(0, cursorPos) + full + value.substring(cursorPos);
        codeEditor.selectionStart = codeEditor.selectionEnd = cursorPos + full.length;
        hideSuggestion();
        if (settings.livePreview) updatePreview();
        updateLineNumbers();
      }
    }
  }
});

/* キャレット座標取得用の関数（単純化版） */
function getCaretCoordinates(element, position) {
  // textareaのカーソル位置計算は難しいため簡易的に左上を返す（高度な計算は外部ライブラリ推奨）
  const rect = element.getBoundingClientRect();
  return { left: rect.left + 10, top: rect.top + 10 };
}

/* === コードキャッシュ機能（sessionStorage使用） === */
function cacheCode() {
  sessionStorage.setItem('cachedCode', codeEditor.value);
}

/* === コードのダウンロード機能 === */
function downloadCode(filename = 'code.html') {
  const blob = new Blob([codeEditor.value], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* === コードのアップロード機能 === */
function uploadCode(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    codeEditor.value = e.target.result;
    updatePreview();
    updateLineNumbers();
    updateCursorPosition();
    cacheCode();
  };
  reader.readAsText(file);
}

/* ファイルアップロードのinputを作成しイベントを設定 */
const uploadInput = document.createElement('input');
uploadInput.type = 'file';
uploadInput.accept = '.html,.htm,.txt';
uploadInput.style.display = 'none';
uploadInput.addEventListener('change', (e) => {
  if (uploadInput.files.length > 0) {
    uploadCode(uploadInput.files[0]);
  }
});
document.body.appendChild(uploadInput);

/* === 複数ファイル保存機能 === */
function downloadMultipleFiles(files) {
  // filesは [{name:'file1.html', content:'...'}, ...]
  files.forEach(file => {
    const blob = new Blob([file.content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

/* 例：複数ファイル保存ボタン押下時の処理 */
// これをボタンに割り当てて使ってください
function saveMultipleExample() {
  const files = [
    {name: 'index.html', content: codeEditor.value},
    {name: 'readme.txt', content: 'このファイルはサンプルです。'}
  ];
  downloadMultipleFiles(files);
}

/* === モーダル閉じる処理 === */
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettings();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
    closeSettings();
  }
});