// 瞑想リマインダー - Background Service Worker
// 設定に基づいて瞑想画面を表示する

const ALARM_NAME = 'meditationReminder';

// デフォルト設定
const DEFAULT_SETTINGS = {
  meditationDuration: 5,
  reminderInterval: 60
};

// 拡張機能インストール時にアラームを設定
chrome.runtime.onInstalled.addListener(async () => {
  console.log('瞑想リマインダーがインストールされました');
  await setupAlarmFromSettings();
});

// ブラウザ起動時にアラームを設定
chrome.runtime.onStartup.addListener(async () => {
  console.log('ブラウザが起動しました');
  await setupAlarmFromSettings();
});

// 設定からアラームを設定する関数
async function setupAlarmFromSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    const interval = settings.reminderInterval;
    
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: interval,
      periodInMinutes: interval
    });
    console.log(`アラームを設定しました: ${interval}分間隔`);
  } catch (error) {
    console.error('アラーム設定エラー:', error);
    // デフォルト値でアラームを設定
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: DEFAULT_SETTINGS.reminderInterval,
      periodInMinutes: DEFAULT_SETTINGS.reminderInterval
    });
  }
}

// アラームが発火した時の処理
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('瞑想の時間です！');
    openMeditationPage();
  }
});

// 瞑想画面を新しいタブで開く
function openMeditationPage() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('meditation.html'),
    active: true
  });
}

// ポップアップからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateAlarm') {
    // アラームを再設定
    chrome.alarms.clear(ALARM_NAME, () => {
      chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: message.interval,
        periodInMinutes: message.interval
      });
      console.log(`アラームを更新しました: ${message.interval}分間隔`);
    });
  } else if (message.type === 'startMeditation') {
    openMeditationPage();
  }
});
