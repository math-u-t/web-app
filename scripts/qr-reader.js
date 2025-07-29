const startButton = document.getElementById('startButton');
const video = document.getElementById('video');
const outputText = document.getElementById('outputText');
const outputIcon = document.getElementById('outputIcon');

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

startButton.addEventListener('click', async () => {
  try {
    startButton.disabled = true;
    startButton.textContent = '画面共有中…';

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });
    video.srcObject = stream;
    video.play();

    stream.getVideoTracks()[0].addEventListener('ended', () => {
      startButton.disabled = false;
      startButton.textContent = '画面共有を開始';
      outputText.textContent = '画面共有が終了しました';
      outputText.classList.add('empty');
      outputIcon.textContent = '📷';
    });

    tick();
  } catch (err) {
    startButton.disabled = false;
    startButton.textContent = '画面共有を開始';
    outputText.textContent = '画面共有の取得に失敗しました: ' + err.message;
    outputText.classList.add('empty');
    outputIcon.textContent = '❌';
  }
});

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      outputText.textContent = code.data;
      outputText.classList.remove('empty');
      outputIcon.textContent = '✅';
    } else {
      outputText.textContent = 'QRコードが見つかりません';
      outputText.classList.add('empty');
      outputIcon.textContent = '❓';
    }
  }
  requestAnimationFrame(tick);
}