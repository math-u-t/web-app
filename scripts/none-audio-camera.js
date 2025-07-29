const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapBtn = document.getElementById('snapBtn');
const qualitySelect = document.getElementById('qualitySelect');
const startBtn = document.getElementById('startBtn');

let stream = null;

startBtn.addEventListener('click', async () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
  }

  const quality = qualitySelect.value;
  let constraints;

  if (quality === 'high') {
    constraints = {
      video: {
        width: 1920,
        height: 1080
      },
      audio: false
    };
  } else {
    constraints = {
      video: {
        width: 640,
        height: 480
      },
      audio: false
    };
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (err) {
    alert('カメラにアクセスできません: ' + err);
  }
});

snapBtn.addEventListener('click', () => {
  if (!video.srcObject) {
    alert('先にカメラを起動してください');
    return;
  }
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `photo_${Date.now()}.png`;
    link.click();
  }, 'image/png');
});