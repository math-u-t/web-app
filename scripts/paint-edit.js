const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');

const colorPicker = document.getElementById('colorPicker');
const sizeRange = document.getElementById('sizeRange');
const sizeDisplay = document.getElementById('sizeDisplay');
const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvasSize = document.getElementById('canvasSize');
const zoomLevel = document.getElementById('zoomLevel');

let penColor = colorPicker.value;
let penSize = sizeRange.value;
let mode = 'pen';
let drawing = false;
let lastX = 0,
  lastY = 0;
let img = null;

let scale = 1;
let minScale = 0.2;
let maxScale = 5;
let startTouches = [];

let undoStack = [];
let redoStack = [];
const maxHistory = 50;

function updateUI() {
  sizeDisplay.textContent = penSize;
  canvasSize.textContent = `${canvas.width} × ${canvas.height}`;
  zoomLevel.textContent = `${Math.round(scale * 100)}%`;
}

function saveHistory() {
  if (undoStack.length >= maxHistory) undoStack.shift();
  undoStack.push(canvas.toDataURL());
  redoStack = [];
}

function restoreImage(dataUrl) {
  const image = new Image();
  image.onload = () => {
    resetTransform();
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    updateUI();
  };
  image.src = dataUrl;
}

function undo() {
  if (undoStack.length > 1) {
    redoStack.push(undoStack.pop());
    restoreImage(undoStack[undoStack.length - 1]);
  }
}

function redo() {
  if (redoStack.length > 0) {
    const data = redoStack.pop();
    undoStack.push(data);
    restoreImage(data);
  }
}

function initializeCanvas(width = 800, height = 600) {
  canvas.width = width;
  canvas.height = height;
  resetTransform();
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveHistory();
  updateUI();
}

function drawResizedImage(img) {
  const newWidth = 800;
  const ratio = img.height / img.width;
  const newHeight = Math.round(newWidth * ratio);

  canvas.width = newWidth;
  canvas.height = newHeight;

  resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  saveHistory();
  updateUI();
}

function resetTransform() {
  scale = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  updateUI();
}

function applyTransform() {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  updateUI();
}

function startDraw(x, y) {
  drawing = true;
  [lastX, lastY] = [x / scale, y / scale];
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = penSize;
  ctx.globalCompositeOperation = mode === 'pen' ? 'source-over' : 'destination-out';
  ctx.strokeStyle = penColor;
  saveHistory();
}

function drawLine(x, y) {
  if (!drawing) return;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x / scale, y / scale);
  ctx.stroke();
  [lastX, lastY] = [x / scale, y / scale];
}

function endDraw() {
  drawing = false;
}

// 初期化
initializeCanvas();

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    img = new Image();
    img.onload = () => drawResizedImage(img);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// マウス描画
canvas.addEventListener('mousedown', e => {
  applyTransform();
  startDraw(e.offsetX, e.offsetY);
});
canvas.addEventListener('mousemove', e => {
  if (drawing) drawLine(e.offsetX, e.offsetY);
});
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseout', endDraw);

// タッチ対応 + ピンチズーム
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    applyTransform();
    startDraw(t.clientX - rect.left, t.clientY - rect.top);
  } else if (e.touches.length === 2) {
    startTouches = e.touches;
  }
}, {
  passive: false
});

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && drawing) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    drawLine(t.clientX - rect.left, t.clientY - rect.top);
  } else if (e.touches.length === 2) {
    e.preventDefault();
    const d1 = getDistance(startTouches[0], startTouches[1]);
    const d2 = getDistance(e.touches[0], e.touches[1]);
    const zoomFactor = d2 / d1;
    scale = Math.min(maxScale, Math.max(minScale, scale * zoomFactor));
    applyTransform();
    startTouches = e.touches;
  }
}, {
  passive: false
});

canvas.addEventListener('touchend', endDraw);

function getDistance(p1, p2) {
  return Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
}

// ホイールズーム
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(maxScale, Math.max(minScale, scale + delta));
  applyTransform();
}, {
  passive: false
});

// UI イベント
colorPicker.addEventListener('input', e => {
  penColor = e.target.value;
  updateUI();
});

sizeRange.addEventListener('input', e => {
  penSize = e.target.value;
  updateUI();
});

penBtn.addEventListener('click', () => {
  mode = 'pen';
  penBtn.classList.add('active');
  eraserBtn.classList.remove('active');
  penBtn.setAttribute('aria-pressed', 'true');
  eraserBtn.setAttribute('aria-pressed', 'false');
});

eraserBtn.addEventListener('click', () => {
  mode = 'eraser';
  eraserBtn.classList.add('active');
  penBtn.classList.remove('active');
  penBtn.setAttribute('aria-pressed', 'false');
  eraserBtn.setAttribute('aria-pressed', 'true');
});

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

resetBtn.addEventListener('click', () => {
  if (img) drawResizedImage(img);
  else initializeCanvas();
});

downloadBtn.addEventListener('click', () => {
  // 一時的にズームをリセットして元の画像をダウンロード
  const currentScale = scale;
  const currentTransform = ctx.getTransform();

  // ズームをリセット
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  try {
    const link = document.createElement('a');
    link.download = 'painted_image_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
    link.href = canvas.toDataURL('image/png', 1.0);

    // リンクを一時的にDOMに追加してクリック
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('画像をダウンロードしました');
  } catch (error) {
    console.error('ダウンロードエラー:', error);
    alert('ダウンロードに失敗しました。もう一度お試しください。');
  } finally {
    // 元のズーム状態を復元
    ctx.setTransform(currentTransform);
  }
});

// 初期UI更新
updateUI();