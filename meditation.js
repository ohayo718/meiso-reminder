// 瞑想画面のJavaScript
// 設定に基づいたカウントダウンタイマーと通知音

// デフォルト設定
const DEFAULT_SETTINGS = {
  meditationDuration: 5,
  reminderInterval: 60
};

// 音量設定（控えめ）
const SOUND_VOLUME = 0.3;

let remainingTime = 0;
let meditationDuration = 5;
let timerInterval = null;
let audioContext = null;

// DOMエレメント
const timerElement = document.getElementById('timer');
const endButton = document.getElementById('endButton');
const container = document.querySelector('.container');

// AudioContextを初期化
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// 開始音を再生（柔らかいベル音）
function playStartSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // 複数の正弦波を組み合わせてベル音を生成
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const gains = [0.4, 0.3, 0.2];
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(SOUND_VOLUME * gains[i], now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 1.5);
    });
  } catch (error) {
    console.log('開始音エラー:', error);
  }
}

// 完了音を再生（シンギングボウル風）
function playCompleteSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // 低めの周波数でシンギングボウル風
    const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4
    const gains = [0.4, 0.3, 0.25];
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      // ゆっくり減衰
      gainNode.gain.setValueAtTime(SOUND_VOLUME * gains[i], now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 3);
    });
  } catch (error) {
    console.log('完了音エラー:', error);
  }
}

// 設定を読み込み
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    meditationDuration = settings.meditationDuration;
    remainingTime = meditationDuration * 60;
  } catch (error) {
    console.log('設定読み込みエラー:', error);
    remainingTime = DEFAULT_SETTINGS.meditationDuration * 60;
  }
}

// タイマーを開始
function startTimer() {
  // 開始音を再生
  playStartSound();
  
  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();
    
    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      onMeditationComplete();
    }
  }, 1000);
}

// タイマー表示を更新
function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// 瞑想完了時の処理
function onMeditationComplete() {
  // 完了音を再生
  playCompleteSound();
  
  container.classList.add('completed');
  
  // 落ち着いたトーンの文言に変更
  timerElement.textContent = '完了';
  document.querySelector('.title').textContent = '静かな時間を過ごせましたね';
  document.querySelector('.instruction').textContent = `${meditationDuration}分間の瞑想を完了しました`;
  
  // 「残り時間」ラベルを非表示に
  const timerLabel = document.querySelector('.timer-label');
  if (timerLabel) {
    timerLabel.style.display = 'none';
  }
  
  endButton.textContent = '閉じる';
}

// 瞑想を終了（タブを閉じる）
function endMeditation() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  window.close();
}

// イベントリスナー
endButton.addEventListener('click', endMeditation);

// ボタンの自動フェード機能（5秒間操作がない場合）
let fadeTimeout = null;
const FADE_DELAY = 5000; // 5秒

function fadeButton() {
  endButton.classList.add('faded');
}

function showButton() {
  endButton.classList.remove('faded');
  resetFadeTimer();
}

function resetFadeTimer() {
  if (fadeTimeout) {
    clearTimeout(fadeTimeout);
  }
  fadeTimeout = setTimeout(fadeButton, FADE_DELAY);
}

// マウス移動でボタンを表示
document.addEventListener('mousemove', showButton);
document.addEventListener('touchstart', showButton);

// ページ読み込み時に設定を読み込んでタイマー開始
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  updateTimerDisplay();
  startTimer();
  // 初期フェードタイマーを開始
  resetFadeTimer();
});
