// 設定ポップアップのJavaScript

// デフォルト設定
const DEFAULT_SETTINGS = {
  meditationDuration: 5,  // 分
  reminderInterval: 60,   // 分
  soundVolume: 30         // パーセント
};

// DOMエレメント
const meditationSlider = document.getElementById('meditationDuration');
const intervalSlider = document.getElementById('reminderInterval');
const volumeSlider = document.getElementById('soundVolume');
const meditationValue = document.getElementById('meditationValue');
const intervalValue = document.getElementById('intervalValue');
const volumeValue = document.getElementById('volumeValue');
const saveButton = document.getElementById('saveButton');
const startButton = document.getElementById('startButton');
const testSoundButton = document.getElementById('testSoundButton');
const status = document.getElementById('status');

// AudioContext for test sound
let audioContext = null;

// スライダーの値を表示更新
function updateDisplayValues() {
  meditationValue.textContent = `${meditationSlider.value}分`;
  intervalValue.textContent = `${intervalSlider.value}分`;
  volumeValue.textContent = `${volumeSlider.value}%`;
}

// 設定を読み込み
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    meditationSlider.value = result.meditationDuration;
    intervalSlider.value = result.reminderInterval;
    volumeSlider.value = result.soundVolume;
    updateDisplayValues();
  } catch (error) {
    console.error('設定の読み込みに失敗:', error);
  }
}

// 設定を保存
async function saveSettings() {
  try {
    const settings = {
      meditationDuration: parseInt(meditationSlider.value),
      reminderInterval: parseInt(intervalSlider.value),
      soundVolume: parseInt(volumeSlider.value)
    };
    
    await chrome.storage.sync.set(settings);
    
    // バックグラウンドにアラームを更新するよう通知
    chrome.runtime.sendMessage({ type: 'updateAlarm', interval: settings.reminderInterval });
    
    status.textContent = '保存しました！';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } catch (error) {
    console.error('設定の保存に失敗:', error);
    status.textContent = 'エラーが発生しました';
  }
}

// テスト音を再生
function playTestSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const volume = parseInt(volumeSlider.value) / 100;
    const now = audioContext.currentTime;
    
    // 開始音と同じベル音をテスト
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const gains = [0.4, 0.3, 0.2];
    
    frequencies.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(volume * gains[i], now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 1.5);
    });
  } catch (error) {
    console.error('テスト音の再生に失敗:', error);
  }
}

// 今すぐ瞑想を開始
function startMeditation() {
  chrome.runtime.sendMessage({ type: 'startMeditation' });
  window.close();
}

// イベントリスナー
meditationSlider.addEventListener('input', updateDisplayValues);
intervalSlider.addEventListener('input', updateDisplayValues);
volumeSlider.addEventListener('input', updateDisplayValues);
saveButton.addEventListener('click', saveSettings);
startButton.addEventListener('click', startMeditation);
testSoundButton.addEventListener('click', playTestSound);

// 初期化
document.addEventListener('DOMContentLoaded', loadSettings);
