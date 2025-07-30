// メモリ内データストレージ
let savedContent = '';

const STORAGE_KEY = 'markdownEditorContent';

const container = document.getElementById('container');
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const saveIndicator = document.getElementById('saveIndicator');
const resizer = document.getElementById('resizer');

let isResizing = false;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  loadFromMemory();
  updatePreview();
  // 初期の幅を設定（任意）
  editor.style.width = '50%';
  preview.style.width = '50%';
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

// メモリ & localStorageへ保存
function saveToMemory() {
  savedContent = editor.value;
  localStorage.setItem(STORAGE_KEY, savedContent);
  showSaveIndicator();
}

// localStorageから読み込み
function loadFromMemory() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    savedContent = cached;
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
    switch(e.key.toLowerCase()) {
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

// プレビューエリアのリサイズ機能
resizer.addEventListener('mousedown', function(e) {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
});

document.addEventListener('mousemove', function(e) {
  if (!isResizing) return;
  const containerRect = container.getBoundingClientRect();
  let newEditorWidth = e.clientX - containerRect.left;
  if (newEditorWidth < 100) newEditorWidth = 100; // 最小幅
  if (newEditorWidth > containerRect.width - 100) newEditorWidth = containerRect.width - 100; // 最大幅
  
  editor.style.width = newEditorWidth + 'px';
  preview.style.width = (containerRect.width - newEditorWidth - resizer.offsetWidth) + 'px';
});

document.addEventListener('mouseup', function(e) {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = 'default';
  }
});

// ウィンドウサイズ変更時の調整（必要に応じて）
window.addEventListener('resize', function() {
  updatePreview();
});
