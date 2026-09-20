// ════════════════════════════════════════════════
//  POMODORO TIMER (floating widget, works across the whole site)
// ════════════════════════════════════════════════
let pomodoroWorkSec = 25 * 60;
let pomodoroBreakSec = 5 * 60;
let pomodoroRemaining = pomodoroWorkSec;
let pomodoroIsBreak = false;
let pomodoroRunning = false;
let pomodoroInterval = null;

function pomodoroPlayAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Classic "ring-ring" alarm clock: repeated short beeps at a fixed pitch
    const beepFreq = 1000;
    const beepDur = 0.12;
    const gapDur = 0.1;
    const totalBeeps = 8;
    for (let i = 0; i < totalBeeps; i++) {
      const start = ctx.currentTime + i * (beepDur + gapDur);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = beepFreq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + beepDur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + beepDur + 0.02);
    }
  } catch (e) { /* Web Audio unsupported — silently skip */ }
  if (navigator.vibrate) navigator.vibrate([150, 80, 150, 80, 150]);
}
function pomodoroTogglePanel() {
  document.getElementById('pomodoroPanel').classList.toggle('open');
}
function pomodoroFormatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function pomodoroRender() {
  document.getElementById('pomodoroTimeDisplay').textContent = pomodoroFormatTime(pomodoroRemaining);
  document.getElementById('pomodoroModeLabel').textContent = pomodoroIsBreak ? '☕ وقت استراحة' : '🎯 وقت تركيز';
  document.getElementById('pomodoroStartBtn').textContent = pomodoroRunning ? '⏸️ إيقاف مؤقت' : '▶️ ابدأ';
}
function pomodoroApplySettings() {
  if (pomodoroRunning) return; // don't shift a running timer
  pomodoroWorkSec = Math.max(1, Number(document.getElementById('pomodoroWorkMin').value) || 25) * 60;
  pomodoroBreakSec = Math.max(1, Number(document.getElementById('pomodoroBreakMin').value) || 5) * 60;
  pomodoroRemaining = pomodoroIsBreak ? pomodoroBreakSec : pomodoroWorkSec;
  pomodoroRender();
}
function pomodoroStartPause() {
  pomodoroRunning = !pomodoroRunning;
  if (pomodoroRunning) {
    pomodoroInterval = setInterval(() => {
      pomodoroRemaining--;
      if (pomodoroRemaining <= 0) {
        pomodoroPlayAlarm();
        pomodoroIsBreak = !pomodoroIsBreak;
        pomodoroRemaining = pomodoroIsBreak ? pomodoroBreakSec : pomodoroWorkSec;
        showToast(pomodoroIsBreak ? '☕ خلصت جولة تركيز — خذلك استراحة!' : '🎯 خلصت الاستراحة — يلا نرجع نركّز');
      }
      pomodoroRender();
    }, 1000);
  } else {
    clearInterval(pomodoroInterval);
  }
  pomodoroRender();
}
function pomodoroReset() {
  clearInterval(pomodoroInterval);
  pomodoroRunning = false;
  pomodoroIsBreak = false;
  pomodoroRemaining = pomodoroWorkSec;
  pomodoroRender();
}

