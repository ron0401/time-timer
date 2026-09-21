import './style.css';
import { apple, caterpillar, core, flower, icons } from './art.ts';
import { formatTime, MAX_MINUTES, MINUTE, SnackTimer } from './timer.ts';

const timer = new SnackTimer(5);
let soundEnabled = true;
let audioContext: AudioContext | undefined;
let lastScene = '';
let lastStatus = '';
let lastEaten = 0;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="もぐもぐタイマー ホーム">
      <span class="brand-mark">${apple('brand')}</span>
      <span>もぐもぐタイマー<small>MOGU MOGU TIMER</small></span>
    </a>
    <button class="sound-button" id="sound" type="button" aria-label="お知らせの音" aria-pressed="true">${icons.sound}<span>おと ON</span></button>
  </header>
  <main>
    <section class="setup-screen" id="setup-screen" aria-labelledby="setup-heading">
      <div class="setup-intro">
        <h1 id="setup-heading" tabindex="-1">時間を設定</h1>
        <p>青虫が1分でリンゴを1つ食べます。</p>
      </div>
      <div class="setup-card">
        <fieldset id="settings"><legend>時間（1〜${MAX_MINUTES}分）</legend>
          <div class="stepper"><button id="minus" type="button" aria-label="1分減らす">−</button><label class="minutes-label"><input id="minutes" type="number" min="1" max="${MAX_MINUTES}" step="1" value="5" inputmode="numeric" aria-label="タイマーの分数"/><span>分</span></label><button id="plus" type="button" aria-label="1分増やす">＋</button></div>
          <div class="presets" aria-label="分数を選択">${[1, 3, 5, 10].map((minutes) => `<button type="button" data-minutes="${minutes}" aria-label="${minutes}分" aria-pressed="${minutes === 5}">${minutes}<span>分</span></button>`).join('')}</div>
        </fieldset>
        <button class="primary-button" id="start" type="button">${icons.play}<span>開始</span></button>
      </div>
    </section>
    <section class="timer-screen" id="timer-screen" aria-labelledby="timer-heading" hidden>
      <h1 class="sr-only" id="timer-heading" tabindex="-1">タイマー</h1>
      <div class="run-toolbar">
        <button class="back-button" id="reset" type="button"><span aria-hidden="true">←</span> 時間を変更</button>
        <div class="remaining"><span class="status" id="status">実行中</span><div class="clock" id="clock" role="timer" aria-live="off" aria-label="残り5分">05:00</div></div>
      </div>
      <section class="garden" aria-label="あおむしがりんごを食べる様子">
        <div class="garden-heading"><h2>${icons.leaf} リンゴ</h2><span class="minute-badge">1 りんご = 1 分</span></div>
        <div class="garden-scene" id="garden-scene">
          <div class="sun" aria-hidden="true"><svg viewBox="0 0 74 74"><g stroke="#ead49a" stroke-width="2.5" stroke-linecap="round"><path d="M37 4v6m0 54v6M4 37h6m54 0h6M14 14l4 4m38 38 4 4M14 60l4-4m38-38 4-4"/></g><circle cx="37" cy="37" r="21" fill="#f2dfa4"/><g fill="#b29960"><circle cx="30" cy="36" r="1.5"/><circle cx="44" cy="36" r="1.5"/></g><path d="M33 42q4 4 8 0" fill="none" stroke="#b29960" stroke-width="1.4" stroke-linecap="round"/></svg></div>
          <div class="cloud cloud-one" aria-hidden="true"></div><div class="cloud cloud-two" aria-hidden="true"></div>
          <div class="apple-field" id="apple-field">
            <div class="apple-tray" id="apple-tray">
              <ol class="apples" id="apples" aria-label="1つ1分のりんご"></ol>
              <div class="caterpillar" id="caterpillar">${caterpillar}</div>
            </div>
          </div>
          <div class="garden-bottom" aria-hidden="true"><span class="flower flower-one">${flower}</span><span class="flower flower-two">${flower}</span><span class="sprout sprout-one"></span><span class="sprout sprout-two"></span></div>
          <div class="confetti" id="confetti" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--i:${i};--x:${7 + i * 5.8}%"></i>`).join('')}</div>
        </div>
        <div class="garden-progress">
          <div class="progress-label"><span>食べたリンゴ <strong id="eaten">0</strong> / <span id="total">5</span> 個</span></div>
          <div class="progress-track" id="progress" role="progressbar" aria-label="タイマーの進み具合" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="progress-fill"></div></div>
        </div>
      </section>
      <div class="run-controls"><button class="primary-button" id="primary" type="button">${icons.pause}<span>一時停止</span></button></div>
    </section>
    <div class="sr-only" id="announcement" role="status" aria-live="polite" aria-atomic="true"></div>
  </main>
`;

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const clock = element('clock');
const input = element<HTMLInputElement>('minutes');
const primary = element<HTMLButtonElement>('primary');
const startButton = element<HTMLButtonElement>('start');
const setupScreen = element('setup-screen');
const timerScreen = element('timer-screen');
const setupUrl = `${location.pathname}${location.search}`;
history.replaceState({ timerScreen: 'setup' }, '', setupUrl);
const reset = element<HTMLButtonElement>('reset');
const settings = element<HTMLFieldSetElement>('settings');
const worm = element('caterpillar');
const apples = element('apples');
const scene = element('garden-scene');
const tray = element('apple-tray');

function announce(message: string): void {
  element('announcement').textContent = message;
}

function positionWorm(): void {
  const index = Math.min(timer.eaten(Date.now()), timer.minutes - 1);
  const target = apples.children[index] as HTMLElement | undefined;
  if (!target) return;
  const art = target.querySelector<HTMLElement>('.apple-art')!;
  const bounds = art.getBoundingClientRect();
  const trayBounds = tray.getBoundingClientRect();
  const center = bounds.left + bounds.width / 2 - trayBounds.left;
  const faceLeft = center < apples.clientWidth / 2;
  worm.dataset.facing = faceLeft ? 'left' : 'right';
  const wormWidth = worm.offsetWidth;
  worm.style.left = `${center - (faceLeft ? wormWidth * 0.11 : wormWidth * 0.89)}px`;
  worm.style.top = `${bounds.bottom - trayBounds.top - worm.offsetHeight * 0.65}px`;
}

function layoutApples(): void {
  if (timer.status === 'idle' || !tray.clientWidth || !tray.clientHeight) return;
  const columns = timer.minutes <= 3 ? timer.minutes : Math.ceil(timer.minutes / 2);
  const rows = Math.ceil(timer.minutes / columns);
  apples.style.setProperty('--columns', String(columns));
  apples.style.setProperty('--rows', String(rows));
  const style = getComputedStyle(apples);
  const cellWidth = (tray.clientWidth - parseFloat(style.columnGap) * (columns - 1)) / columns;
  const cellHeight = (tray.clientHeight - parseFloat(style.rowGap) * (rows - 1)) / rows;
  // Leave space for each number and for the caterpillar below the apple.
  const size = Math.max(1, Math.min(70, cellWidth - 8, (cellHeight - 22) / 1.45));
  tray.style.setProperty('--apple-size', `${size}px`);
  positionWorm();
}

function renderScene(now: number): void {
  if (timer.status === 'idle') {
    if (lastScene) apples.replaceChildren();
    lastScene = '';
    lastEaten = 0;
    return;
  }
  const eaten = timer.eaten(now);
  const bite = Math.floor((timer.elapsed(now) % MINUTE) / 6_000);
  const key = `${timer.minutes}:${eaten}:${bite}:${timer.status}`;
  if (key === lastScene) return;
  const advanced = eaten !== lastEaten;
  lastScene = key;
  lastEaten = eaten;
  apples.innerHTML = Array.from({ length: timer.minutes }, (_, index) => {
    const isEaten = index < eaten;
    const active = index === eaten && timer.status !== 'idle';
    const appleBite = active ? bite : 0;
    return `<li class="apple-slot${isEaten ? ' is-eaten' : ''}${active ? ' is-active' : ''}" aria-label="${index + 1}個目：${isEaten ? '食べ終わり' : active ? '食事中' : '未着手'}"><span class="apple-number" aria-hidden="true">${isEaten ? '✓' : String(index + 1).padStart(2, '0')}</span><span class="apple-art">${isEaten ? core : apple(String(index), appleBite)}</span>${active ? '<span class="apple-crumbs" aria-hidden="true">· ·</span>' : ''}</li>`;
  }).join('');
  scene.dataset.state = timer.status;
  element('eaten').textContent = String(eaten);
  element('total').textContent = String(timer.minutes);
  layoutApples();
  if (advanced && timer.status === 'running') announce(`${eaten}個食べました。残り${timer.minutes - eaten}個です。`);
}

function render(now = Date.now()): void {
  const isSetup = timer.status === 'idle';
  const screenChanged = setupScreen.hidden === isSetup;
  setupScreen.hidden = !isSetup;
  timerScreen.hidden = isSetup;
  settings.disabled = !isSetup;

  const remaining = timer.remaining(now);
  const formatted = formatTime(remaining);
  clock.textContent = formatted;
  const totalSeconds = Math.ceil(remaining / 1000);
  clock.setAttribute('aria-label', `残り${Math.floor(totalSeconds / 60)}分${totalSeconds % 60}秒`);
  const percentage = (timer.elapsed(now) / timer.duration) * 100;
  element('progress-fill').style.width = `${percentage}%`;
  element('progress').setAttribute('aria-valuenow', String(Math.round(percentage)));
  document.title = isSetup ? 'もぐもぐタイマー' : `${formatted} · もぐもぐタイマー`;
  renderScene(now);

  if (lastStatus !== timer.status) {
    lastStatus = timer.status;
    const content = {
      idle: { status: '', button: '一時停止' },
      running: { status: '実行中', button: '一時停止' },
      paused: { status: '一時停止中', button: '再開' },
      finished: { status: '終了', button: 'もう一度' },
    }[timer.status];
    element('status').textContent = content.status;
    element('status').dataset.state = timer.status;
    element('timer-heading').textContent = timer.status === 'finished' ? 'タイマー終了' : 'タイマー';
    primary.innerHTML = `${timer.status === 'running' ? icons.pause : timer.status === 'finished' ? icons.reset : icons.play}<span>${content.button}</span>`;
    primary.classList.toggle('is-running', timer.status === 'running');
  }
  element<HTMLButtonElement>('minus').disabled = timer.minutes <= 1;
  element<HTMLButtonElement>('plus').disabled = timer.minutes >= MAX_MINUTES;
  document.querySelectorAll<HTMLButtonElement>('[data-minutes]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.minutes) === timer.minutes)));
  if (screenChanged) {
    window.scrollTo(0, 0);
    element(isSetup ? 'setup-heading' : 'timer-heading').focus({ preventScroll: true });
    if (!isSetup) layoutApples();
  }
}

function setMinutes(value: number): void {
  timer.setMinutes(value);
  input.value = String(timer.minutes);
  render();
}

async function prepareAudio(): Promise<void> {
  if (!soundEnabled) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();
  } catch {
    // The visual completion message works even when audio is unavailable.
  }
}

function playCompletion(): void {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    const start = audioContext!.currentTime + index * 0.2;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
    oscillator.connect(gain);
    gain.connect(audioContext!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.6);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}

function tick(): void {
  const now = Date.now();
  if (timer.tick(now)) {
    playCompletion();
    announce(`${timer.minutes}分のタイマーが終了しました。`);
  }
  render(now);
}

function startTimer(): void {
  const fromSetup = timer.status === 'idle';
  void prepareAudio();
  if (timer.status === 'finished') timer.reset();
  if (fromSetup) {
    setMinutes(input.valueAsNumber);
    history.pushState({ timerScreen: 'timer' }, '', `${setupUrl}#timer`);
  }
  timer.start(Date.now());
  render();
  announce('タイマーを開始しました。');
}

function showSetup(): void {
  timer.reset();
  render();
  announce('時間設定に戻りました。');
}

startButton.addEventListener('click', startTimer);
primary.addEventListener('click', () => {
  if (timer.status === 'running') {
    const now = Date.now();
    timer.pause(now);
    if (timer.remaining(now) === 0) playCompletion();
    render(now);
    announce(timer.remaining(now) === 0 ? 'タイマーが終了しました。' : 'タイマーを一時停止しました。');
  } else {
    startTimer();
  }
});
reset.addEventListener('click', () => {
  if (history.state?.timerScreen === 'timer') history.back();
  else showSetup();
});
window.addEventListener('popstate', () => {
  // Forward navigation must not restart a timer that was already stopped.
  if (location.hash === '#timer') history.replaceState({ timerScreen: 'setup' }, '', setupUrl);
  showSetup();
});
input.addEventListener('change', () => setMinutes(input.valueAsNumber));
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { setMinutes(input.valueAsNumber); startButton.focus(); } });
element('minus').addEventListener('click', () => setMinutes(timer.minutes - 1));
element('plus').addEventListener('click', () => setMinutes(timer.minutes + 1));
document.querySelectorAll<HTMLButtonElement>('[data-minutes]').forEach((button) => button.addEventListener('click', () => setMinutes(Number(button.dataset.minutes))));
element('sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  element('sound').innerHTML = `${soundEnabled ? icons.sound : icons.mute}<span>おと ${soundEnabled ? 'ON' : 'OFF'}</span>`;
  element('sound').setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled) void prepareAudio();
});
new ResizeObserver(layoutApples).observe(tray);
document.addEventListener('visibilitychange', tick);
window.addEventListener('pageshow', tick);
setInterval(tick, 250);
render();
