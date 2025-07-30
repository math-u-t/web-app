const fileInput = document.getElementById('fileInput');
const videoPlayer = document.getElementById('videoPlayer');
const volumeSlider = document.getElementById('volumeSlider');
const fileNameDisplay = document.getElementById('fileName');
const dropZone = document.getElementById('dropZone');
const stopButton = document.getElementById('stopButton');

let playlist = [];
let currentIndex = 0;

const allowedExtensions = ['.mp4', '.webm', '.mkv', '.mov'];

function isValidFile(file) {
  return allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

function handleFiles(files) {
  const validFiles = Array.from(files).filter(isValidFile);
  if (validFiles.length === 0) return;
  playlist = shuffleArray(validFiles);
  currentIndex = 0;
  playVideo(playlist[currentIndex]);
}

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

videoPlayer.addEventListener('ended', () => {
  currentIndex++;
  if (currentIndex >= playlist.length) {
    currentIndex = 0;
    playlist = shuffleArray(playlist);
  }
  playVideo(playlist[currentIndex]);
});

volumeSlider.addEventListener('input', () => {
  videoPlayer.volume = parseFloat(volumeSlider.value);
});

stopButton.addEventListener('click', () => {
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
});

function playVideo(file) {
  const url = URL.createObjectURL(file);
  videoPlayer.src = url;
  videoPlayer.volume = parseFloat(volumeSlider.value);
  fileNameDisplay.textContent = file.name;
  videoPlayer.play();
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// ドラッグ＆ドロップ対応
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('hover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('hover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('hover');
  handleFiles(e.dataTransfer.files);
});