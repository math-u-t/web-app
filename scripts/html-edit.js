// 設定オブジェクト
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

  // DOM要素
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

  // 初期HTMLテンプレート
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

  // 初期化
  function init() {
    loadSettings();
    codeEditor.value = initialTemplate;
    updatePreview();
    updateLineNumbers();
    updateCursorPosition();
    setupResizer();
  }

  // 設定読み込み
  function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('editorSettings') || '{}');
    Object.assign(settings, savedSettings);
    applySettings();
    updateSettingsUI();
  }

  // 設定適用
  function applySettings() {
    // テーマ適用
    document.body.setAttribute('data-theme', settings.theme);

    // CSS変数更新
    document.documentElement.style.setProperty('--font-family', settings.fontFamily);
    document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px');
    document.documentElement.style.setProperty('--line-height', settings.lineHeight);

    // レイアウト更新
    editorPanel.style.width = settings.editorWidth + '%';
    previewPanel.style.width = (100 - settings.editorWidth) + '%';

    // エディタ設定
    codeEditor.style.whiteSpace = settings.wordWrap ? 'pre-wrap' : 'pre';

    // テーマ表示更新
    updateThemeUI();
  }

  // 設定UI更新
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

  // テーマUI更新
  function updateThemeUI() {
    const isDark = settings.theme === 'dark';
    themeToggle.textContent = isDark ? 'ライト' : 'ダーク';
    themeStatus.textContent = isDark ? 'ダークモード' : 'ライトモード';
  }

  // 設定保存
  function saveSettings() {
    if (settings.autoSave) {
      localStorage.setItem('editorSettings', JSON.stringify(settings));
    }
  }

  // テーマ切り替え
  function toggleTheme() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    applySettings();
    updateSettingsUI();
    saveSettings();
  }

  function changeTheme() {
    settings.theme = document.getElementById('themeSelect').value;
    applySettings();
    saveSettings();
  }

  // 設定更新
  function updateSettings() {
    settings.fontFamily = document.getElementById('fontFamily').value;
    settings.fontSize = parseInt(document.getElementById('fontSize').value);
    settings.lineHeight = parseFloat(document.getElementById('lineHeight').value);
    settings.wordWrap = document.getElementById('wordWrap').checked;
    settings.autoSave = document.getElementById('autoSave').checked;
    settings.livePreview = document.getElementById('livePreview').checked;

    // 表示値更新
    document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';
    document.getElementById('lineHeightValue').textContent = settings.lineHeight;

    applySettings();
    updateLineNumbers();
    saveSettings();
  }

  // レイアウト更新
  function updateLayout() {
    settings.editorWidth = parseInt(document.getElementById('editorWidth').value);
    document.getElementById('editorWidthValue').textContent = settings.editorWidth + '%';

    editorPanel.style.width = settings.editorWidth + '%';
    previewPanel.style.width = (100 - settings.editorWidth) + '%';

    saveSettings();
  }

  // 設定リセット
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

  // 設定モーダル
  function openSettings() {
    settingsModal.classList.add('active');
  }

  function closeSettings() {
    settingsModal.classList.remove('active');
  }

  // リサイザー設定
  function setupResizer() {
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
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
        document.getElementById('editorWidth').value = newWidth;
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

  // エディタ機能
  codeEditor.addEventListener('input', () => {
    if (settings.livePreview) {
      updatePreview();
    }
    updateLineNumbers();
  });

  codeEditor.addEventListener('selectionchange', updateCursorPosition);
  codeEditor.addEventListener('keyup', updateCursorPosition);
  codeEditor.addEventListener('mouseup', updateCursorPosition);

  function updatePreview() {
    const code = codeEditor.value;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    previewFrame.src = url;
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function updateLineNumbers() {
    const lines = codeEditor.value.split('\n');
    const lineCount = lines.length;
    let lineNumbersHTML = '';

    for (let i = 1; i <= lineCount; i++) {
      lineNumbersHTML += i + '\n';
    }

    lineNumbers.textContent = lineNumbersHTML;
  }

  function updateCursorPosition() {
    const textarea = codeEditor;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;

    const textBeforeCursor = text.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const lineNumber = lines.length;
    const columnNumber = lines[lines.length - 1].length + 1;

    currentLine.textContent = lineNumber;
    currentCol.textContent = columnNumber;
  }

  function insertTemplate() {
    if (confirm('現在のコードをテンプレートで置き換えますか？')) {
      codeEditor.value = initialTemplate;
      updatePreview();
      updateLineNumbers();
      updateCursorPosition();
    }
  }

  // キーボードショートカット
  codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;

      codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;

      if (settings.livePreview) {
        updatePreview();
      }
      updateLineNumbers();
    }

    // Ctrl+S で保存（プレビュー更新）
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      updatePreview();
    }
  });

  // モーダル外クリックで閉じる
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings();
    }
  });

  // ESCキーでモーダル閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
      closeSettings();
    }
  });

  // 初期化実行
  init();