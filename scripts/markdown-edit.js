// メモリ内データストレージ
let savedContent = '';

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const saveIndicator = document.getElementById('saveIndicator');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  loadFromMemory();
  updatePreview();
});

// リアルタイム更新
editor.addEventListener('input', function() {
  updatePreview();
  saveToMemory();
});

// プレビュー更新
function updatePreview() {
  const markdown = editor.value;
  if (markdown.trim() === '') {
    preview.innerHTML = '<div class="empty-state"><div>左側にマークダウンを入力すると、ここにプレビューが表示されます</div></div>';
    return;
  }
  
  try {
    const html = marked.parse(markdown);
    preview.innerHTML = html;
  } catch (error) {
    preview.innerHTML = '<div style="color: #dc2626; padding: 20px;">マークダウンの解析でエラーが発生しました。</div>';
  }
}

// メモリへ保存
function saveToMemory() {
  savedContent = editor.value;
  showSaveIndicator();
}

// メモリから読み込み
function loadFromMemory() {
  if (savedContent) {
    editor.value = savedContent;
  }
}

// 保存インジケーター表示
function showSaveIndicator() {
  saveIndicator.classList.add('show');
  setTimeout(() => {
    saveIndicator.classList.remove('show');
  }, 2000);
}

// テキスト挿入
function insertText(before, after = '') {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selectedText = editor.value.substring(start, end);
  const newText = before + selectedText + after;
  
  editor.value = editor.value.substring(0, start) + newText + editor.value.substring(end);
  editor.focus();
  editor.setSelectionRange(start + before.length, start + before.length + selectedText.length);
  
  updatePreview();
  saveToMemory();
}

// エディターをクリア
function clearEditor() {
  if (confirm('編集内容をクリアしますか？')) {
    editor.value = '';
    updatePreview();
    saveToMemory();
    editor.focus();
  }
}

// ファイルに保存
function saveToFile() {
  const content = editor.value;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// キーボードショートカット
editor.addEventListener('keydown', function(e) {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'b':
        e.preventDefault();
        insertText('**', '**');
        break;
      case 'i':
        e.preventDefault();
        insertText('*', '*');
        break;
      case 's':
        e.preventDefault();
        saveToFile();
        break;
    }
  }
  
  // Tabキーでインデント
  if (e.key === 'Tab') {
    e.preventDefault();
    insertText('  ');
  }
});

// ウィンドウサイズ変更時の調整
window.addEventListener('resize', function() {
  updatePreview();
});