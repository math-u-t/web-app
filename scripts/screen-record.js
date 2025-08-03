const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const audioToggle = document.getElementById('audioToggle');
const preview = document.getElementById('preview');
const statusIndicator = document.getElementById('statusIndicator');

let mediaRecorder;
let recordedChunks = [];

startBtn.onclick = async () => {
  const withAudio = audioToggle.checked;

  try {
    // 画面キャプチャを開始
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: {
          ideal: 1920
        },
        height: {
          ideal: 1080
        },
        frameRate: {
          ideal: 30
        }
      },
      audio: withAudio
    });

    // プレビューに表示
    preview.srcObject = stream;

    // 録画データをリセット
    recordedChunks = [];

    // MediaRecorderを設定
    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    };

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm;codecs=vp8';
    }

    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm'
      });
      const url = URL.createObjectURL(blob);

      // ダウンロードリンクを作成
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // メモリ解放
      URL.revokeObjectURL(url);

      // ステータス更新
      statusIndicator.classList.remove('recording');
    };

    // 録画開始
    mediaRecorder.start(1000); // 1秒ごとにデータを取得

    // UI更新
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusIndicator.classList.add('recording');

    // 画面共有が終了した時の処理
    stream.getVideoTracks()[0].onended = () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
      }
    };

  } catch (error) {
    console.error('録画開始エラー:', error);

    let errorMessage = '画面録画を開始できませんでした。';
    if (error.name === 'NotAllowedError') {
      errorMessage = '画面共有が拒否されました。ブラウザの設定を確認してください。';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'お使いのブラウザは画面録画をサポートしていません。';
    }

    alert(errorMessage);
  }
};

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  // ストリームを停止
  if (preview.srcObject) {
    preview.srcObject.getTracks().forEach(track => track.stop());
    preview.srcObject = null;
  }

  // UI更新
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

stopBtn.onclick = stopRecording;

// ページを離れる前に録画を停止
window.addEventListener('beforeunload', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  }
});