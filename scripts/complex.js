const originalCanvas = document.getElementById('originalCanvas');
const transformedCanvas = document.getElementById('transformedCanvas');
const originalCtx = originalCanvas.getContext('2d');
const transformedCtx = transformedCanvas.getContext('2d');

const functionInput = document.getElementById('functionInput');
const applyFunctionBtn = document.getElementById('applyFunction');
const imageInput = document.getElementById('imageInput');
const generatePatternBtn = document.getElementById('generatePattern');
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const errorMessage = document.getElementById('errorMessage');
const currentFormula = document.getElementById('currentFormula');
const presetButtons = document.querySelectorAll('.preset-btn');

let sourceImageData = null;
let currentFunction = '1/z';

// Configure math.js for complex numbers
math.config({
  number: 'BigNumber',
  precision: 64
});

function showError(message) {
  errorMessage.textContent = message;
  setTimeout(() => {
    errorMessage.textContent = '';
  }, 5000);
}

function evaluateComplexFunction(funcStr, z) {
  try {
    // Replace common mathematical notation
    let processedFunc = funcStr
      .replace(/\^/g, '^')
      .replace(/sqrt/g, 'sqrt')
      .replace(/exp/g, 'exp')
      .replace(/log/g, 'log')
      .replace(/sin/g, 'sin')
      .replace(/cos/g, 'cos')
      .replace(/tan/g, 'tan')
      .replace(/pi/g, 'pi')
      .replace(/e(?![x])/g, 'e');

    // Create scope with the complex number z
    const scope = {
      z: math.complex(z.re, z.im),
      i: math.complex(0, 1),
      pi: math.pi,
      e: math.e
    };

    const result = math.evaluate(processedFunc, scope);

    if (math.typeOf(result) === 'Complex') {
      return {
        re: result.re,
        im: result.im
      };
    } else if (typeof result === 'number') {
      return {
        re: result,
        im: 0
      };
    } else {
      return {
        re: 0,
        im: 0
      };
    }
  } catch (error) {
    return {
      re: 0,
      im: 0
    };
  }
}

function generateTestPattern() {
  const imageData = originalCtx.createImageData(400, 400);
  const data = imageData.data;

  for (let y = 0; y < 400; y++) {
    for (let x = 0; x < 400; x++) {
      const index = (y * 400 + x) * 4;

      const centerX = 200,
        centerY = 200;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const angle = Math.atan2(y - centerY, x - centerX);

      // Create concentric circles and radial pattern
      const r = (Math.sin(dist * 0.05) * 0.5 + 0.5) * 255;
      const g = (Math.sin(angle * 4) * 0.5 + 0.5) * 255;
      const b = (Math.sin((x + y) * 0.01) * 0.5 + 0.5) * 255;

      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  originalCtx.putImageData(imageData, 0, 0);
  sourceImageData = imageData;
  applyTransformation();
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      originalCtx.clearRect(0, 0, 400, 400);

      const scale = Math.min(400 / img.width, 400 / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (400 - scaledWidth) / 2;
      const offsetY = (400 - scaledHeight) / 2;

      originalCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      sourceImageData = originalCtx.getImageData(0, 0, 400, 400);
      applyTransformation();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function applyTransformation() {
  if (!sourceImageData) return;

  const scale = parseFloat(scaleSlider.value);
  scaleValue.textContent = scale.toFixed(1);

  try {
    const transformedImageData = transformedCtx.createImageData(400, 400);
    const sourceData = sourceImageData.data;
    const targetData = transformedImageData.data;

    const centerX = 200,
      centerY = 200;
    const coordScale = scale * 80;

    for (let y = 0; y < 400; y++) {
      for (let x = 0; x < 400; x++) {
        // Convert pixel coordinates to complex plane
        const zx = (x - centerX) / coordScale;
        const zy = (centerY - y) / coordScale;

        // Apply complex function transformation
        const w = evaluateComplexFunction(currentFunction, {
          re: zx,
          im: zy
        });

        // Convert back to pixel coordinates
        const sourceX = Math.round(w.re * coordScale + centerX);
        const sourceY = Math.round(centerY - w.im * coordScale);

        const targetIndex = (y * 400 + x) * 4;

        // Check bounds and sample
        if (sourceX >= 0 && sourceX < 400 && sourceY >= 0 && sourceY < 400) {
          const sourceIndex = (sourceY * 400 + sourceX) * 4;

          targetData[targetIndex] = sourceData[sourceIndex];
          targetData[targetIndex + 1] = sourceData[sourceIndex + 1];
          targetData[targetIndex + 2] = sourceData[sourceIndex + 2];
          targetData[targetIndex + 3] = sourceData[sourceIndex + 3];
        } else {
          // Fill with black for out-of-bounds
          targetData[targetIndex] = 0;
          targetData[targetIndex + 1] = 0;
          targetData[targetIndex + 2] = 0;
          targetData[targetIndex + 3] = 255;
        }
      }
    }

    transformedCtx.putImageData(transformedImageData, 0, 0);
    showError(''); // Clear any previous errors
  } catch (error) {
    showError('変換エラー: ' + error.message);
  }
}

function updateFunction() {
  const funcStr = functionInput.value.trim();
  if (!funcStr) {
    showError('関数を入力してください');
    return;
  }

  // Test the function with a simple input
  try {
    evaluateComplexFunction(funcStr, {
      re: 1,
      im: 0
    });
    currentFunction = funcStr;
    currentFormula.textContent = `w = ${funcStr}`;
    applyTransformation();
  } catch (error) {
    showError('無効な関数です: ' + error.message);
  }
}

// Event listeners
applyFunctionBtn.addEventListener('click', updateFunction);
functionInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') updateFunction();
});

presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    functionInput.value = btn.dataset.func;
    updateFunction();
  });
});

imageInput.addEventListener('change', function(e) {
  if (e.target.files[0]) {
    loadImage(e.target.files[0]);
  }
});

generatePatternBtn.addEventListener('click', generateTestPattern);
scaleSlider.addEventListener('input', applyTransformation);

// Initialize
generateTestPattern();