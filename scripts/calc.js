const input = document.getElementById('mathInput');
const history = document.getElementById('history');
const liveResult = document.getElementById('liveResult');

let lastResult = null;

// 暗黙の乗算に対応
function insertExplicitMultiplication(expr) {
  return expr
    .replace(/(\d)\s*\(/g, '$1*(')         // 4(2+1) → 4*(2+1)
    .replace(/\)\s*(\d|\()/g, ')*$1');     // (2)(3) → (2)*(3)
}

// ans 置換
function replaceAns(expr) {
  if (expr.includes('ans')) {
    if (lastResult === null) throw new Error("ansは未定義です");
    return expr.replace(/\bans\b/g, `(${lastResult})`);
  }
  return expr;
}

// 末尾の不要な0と小数点を削る関数
function trimTrailingZeros(str) {
  return str
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
}

// ライブ結果表示
function updateLiveResult(expr) {
  if (!expr.trim()) {
    liveResult.textContent = '';
    return;
  }

  try {
    let fixedExpr = insertExplicitMultiplication(expr);
    fixedExpr = replaceAns(fixedExpr);
    const result = math.evaluate(fixedExpr);

    const raw = math.format(result, { precision: 14, notation: 'fixed' });
    const formatted = trimTrailingZeros(raw);

    const latex = math.parse(fixedExpr).toTex({ parenthesis: 'auto' }) + ' = ' + formatted;

    katex.render(latex, liveResult, { throwOnError: false });
  } catch {
    liveResult.textContent = 'エラー';
  }
}

// 入力が変更されたとき
input.addEventListener('input', () => {
  updateLiveResult(input.value);
});

// Enterキーで実行
input.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    let expr = input.value.trim();
    if (!expr) return;

    try {
      let fixedExpr = insertExplicitMultiplication(expr);
      fixedExpr = replaceAns(fixedExpr);

      const result = math.evaluate(fixedExpr);

      const raw = math.format(result, { precision: 14, notation: 'fixed' });
      const resultText = trimTrailingZeros(raw);

      lastResult = resultText;  // ans に保存
      input.value = resultText;

      const latex = math.parse(fixedExpr).toTex({ parenthesis: 'auto' }) + ' = ' + resultText;

      const entry = document.createElement('div');
      entry.className = 'history-entry';
      entry.dataset.result = resultText;

      katex.render(latex, entry, { throwOnError: false });

      // クリックでコピー
      entry.addEventListener('click', function () {
        navigator.clipboard.writeText(entry.dataset.result).then(() => {
          entry.classList.add('copied');
          setTimeout(() => entry.classList.remove('copied'), 800);
        });
      });

      history.prepend(entry);
      liveResult.textContent = '';
    } catch (err) {
      input.value = 'エラー: ' + err.message;
    }
  }
});

// バックスラッシュキーで入力欄にフォーカス移動
document.addEventListener('keydown', (e) => {
  if (e.key === '\\') {
    e.preventDefault();
    input.focus();
  }
});