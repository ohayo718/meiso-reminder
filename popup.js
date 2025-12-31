// 設定ポップアップのJavaScript

// デフォルト設定
const DEFAULT_SETTINGS = {
  meditationDuration: 5,  // 分
  reminderInterval: 60    // 分
};

// DOMエレメント
const meditationSlider = document.getElementById('meditationDuration');
const intervalSlider = document.getElementById('reminderInterval');
const meditationValue = document.getElementById('meditationValue');
const intervalValue = document.getElementById('intervalValue');
const saveButton = document.getElementById('saveButton');
const startButton = document.getElementById('startButton');
const status = document.getElementById('status');

// スライダーの値を表示更新
function updateDisplayValues() {
  meditationValue.textContent = `${meditationSlider.value}分`;
  intervalValue.textContent = `${intervalSlider.value}分`;
}

// 設定を読み込み
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    meditationSlider.value = result.meditationDuration;
    intervalSlider.value = result.reminderInterval;
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
      reminderInterval: parseInt(intervalSlider.value)
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

// 今すぐ瞑想を開始
function startMeditation() {
  chrome.runtime.sendMessage({ type: 'startMeditation' });
  window.close();
}

// イベントリスナー
meditationSlider.addEventListener('input', updateDisplayValues);
intervalSlider.addEventListener('input', updateDisplayValues);
saveButton.addEventListener('click', saveSettings);
startButton.addEventListener('click', startMeditation);

// 初期化
document.addEventListener('DOMContentLoaded', loadSettings);
