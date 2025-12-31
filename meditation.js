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
async function onMeditationComplete() {
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
  
  // 履歴を保存して統計を表示
  await saveMeditationHistory();
  await displayStats();
  
  endButton.textContent = '閉じる';
}

// 瞑想履歴を保存
async function saveMeditationHistory() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
    const result = await chrome.storage.sync.get({ meditationHistory: {} });
    const history = result.meditationHistory;
    
    // 今日の記録を更新
    if (!history[today]) {
      history[today] = { count: 0, totalMinutes: 0 };
    }
    history[today].count++;
    history[today].totalMinutes += meditationDuration;
    
    await chrome.storage.sync.set({ meditationHistory: history });
  } catch (error) {
    console.log('履歴保存エラー:', error);
  }
}

// 統計を計算して表示
async function displayStats() {
  try {
    const result = await chrome.storage.sync.get({ meditationHistory: {} });
    const history = result.meditationHistory;
    
    // 連続日数を計算
    const streak = calculateStreak(history);
    
    // 今月の合計時間を計算
    const monthlyTotal = calculateMonthlyTotal(history);
    
    // 統計を表示
    const streakElement = document.getElementById('statsStreak');
    const totalElement = document.getElementById('statsTotal');
    
    if (streak > 0) {
      if (streak === 1) {
        streakElement.textContent = '🌱 今日から新しいスタート';
      } else {
        streakElement.textContent = `🔥 ${streak}日連続で瞑想中`;
      }
    }
    
    if (monthlyTotal > 0) {
      totalElement.textContent = `📊 今月の合計: ${monthlyTotal}分`;
    }
  } catch (error) {
    console.log('統計表示エラー:', error);
  }
}

// 連続日数を計算
function calculateStreak(history) {
  const dates = Object.keys(history).sort().reverse();
  if (dates.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // 今日か昨日に記録がなければ連続は途切れている
  if (!history[today] && !history[yesterday]) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  
  // 今日に記録がなければ昨日から開始
  if (!history[today]) {
    currentDate = new Date(Date.now() - 86400000);
  }
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (history[dateStr]) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 86400000);
    } else {
      break;
    }
  }
  
  return streak;
}

// 今月の合計時間を計算
function calculateMonthlyTotal(history) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let total = 0;
  for (const [date, data] of Object.entries(history)) {
    if (date.startsWith(yearMonth)) {
      total += data.totalMinutes;
    }
  }
  
  return total;
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
