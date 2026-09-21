import './style.css';
import { apple, caterpillar, core, flower, icons } from './art.ts';
import { formatTime, MINUTE, SnackTimer } from './timer.ts';

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
    <div class="intro">
      <p class="eyebrow"><span></span> あおむしと、ひとつずつ。</p>
      <h1 id="headline">きょうは、何分がんばる？</h1>
      <p id="intro-text">1分かけて、りんごを1つ。いっしょに進もう。</p>
    </div>
    <div class="workspace">
      <section class="garden" aria-label="あおむしがりんごを食べる様子">
        <div class="garden-heading"><h2>${icons.leaf} ちいさな りんごばたけ</h2><span class="minute-badge">1 りんご = 1 分</span></div>
        <div class="garden-scene" id="garden-scene">
          <div class="sun" aria-hidden="true"><svg viewBox="0 0 74 74"><g stroke="#ead49a" stroke-width="2.5" stroke-linecap="round"><path d="M37 4v6m0 54v6M4 37h6m54 0h6M14 14l4 4m38 38 4 4M14 60l4-4m38-38 4-4"/></g><circle cx="37" cy="37" r="21" fill="#f2dfa4"/><g fill="#b29960"><circle cx="30" cy="36" r="1.5"/><circle cx="44" cy="36" r="1.5"/></g><path d="M33 42q4 4 8 0" fill="none" stroke="#b29960" stroke-width="1.4" stroke-linecap="round"/></svg></div>
          <div class="cloud cloud-one" aria-hidden="true"></div><div class="cloud cloud-two" aria-hidden="true"></div>
          <div class="apple-scroll" id="apple-scroll" tabindex="0" aria-label="りんごばたけ。長いタイマーではスクロールできます">
            <div class="apple-tray" id="apple-tray">
              <ol class="apples" id="apples" aria-label="1つ1分のりんご"></ol>
              <div class="caterpillar" id="caterpillar">${caterpillar}<span class="munch" aria-hidden="true">もぐもぐ</span></div>
            </div>
          </div>
          <div class="garden-bottom" aria-hidden="true"><span class="flower flower-one">${flower}</span><span class="flower flower-two">${flower}</span><span class="sprout sprout-one"></span><span class="sprout sprout-two"></span></div>
          <div class="worm-message" id="worm-message">おなか、ぺこぺこ！</div>
          <div class="confetti" id="confetti" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--i:${i};--x:${7 + i * 5.8}%"></i>`).join('')}</div>
        </div>
        <div class="garden-progress">
          <div class="progress-label"><span>りんごを <strong id="eaten">0</strong> / <span id="total">5</span> こ たべたよ</span><span id="progress-note">いただきます、の準備中</span></div>
          <div class="progress-track" id="progress" role="progressbar" aria-label="タイマーの進み具合" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="progress-fill"></div></div>
        </div>
      </section>
      <section class="timer-card" aria-label="タイマーの設定と操作">
        <div class="timer-card-heading"><h2>タイマー</h2><span class="status" id="status">じゅんび中</span></div>
        <div class="clock-wrap"><div class="clock" id="clock" role="timer" aria-live="off" aria-label="残り5分">05:00</div><p id="clock-caption">あなただけの、こつこつ時間</p></div>
        <fieldset id="settings"><legend>じかんをきめる</legend>
          <div class="stepper"><button id="minus" type="button" aria-label="1分減らす">−</button><label class="minutes-label"><input id="minutes" type="number" min="1" max="60" step="1" value="5" inputmode="numeric" aria-label="タイマーの分数"/><span>分</span></label><button id="plus" type="button" aria-label="1分増やす">＋</button></div>
          <div class="presets" aria-label="おすすめの分数">${[5, 10, 15, 25].map((minutes) => `<button type="button" data-minutes="${minutes}" aria-pressed="${minutes === 5}">${minutes}<span>分</span></button>`).join('')}</div>
          <p class="setting-hint" id="setting-hint">1〜60分でえらべるよ</p>
        </fieldset>
        <button class="primary-button" id="primary" type="button">${icons.play}<span>はじめる</span></button>
        <button class="reset-button" id="reset" type="button" disabled>${icons.reset}<span>はじめにもどす</span></button>
      </section>
    </div>
    <p class="gentle-note">${icons.leaf}<span>ちいさなひとくちが、おおきな一歩。</span></p>
    <div class="sr-only" id="announcement" role="status" aria-live="polite" aria-atomic="true"></div>
  </main>
  <footer><span>りんごと、あおむしと、あなたの時間。</span><span class="footer-dots" aria-hidden="true"><i></i><i></i><i></i></span></footer>
`;

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const clock = element('clock');
const input = element<HTMLInputElement>('minutes');
const primary = element<HTMLButtonElement>('primary');
const reset = element<HTMLButtonElement>('reset');
const settings = element<HTMLFieldSetElement>('settings');
const worm = element('caterpillar');
const apples = element('apples');
const scene = element('garden-scene');
const scroll = element('apple-scroll');

function announce(message: string): void {
  element('announcement').textContent = message;
}

function positionWorm(shouldScroll = false): void {
  const index = Math.min(timer.eaten(Date.now()), timer.minutes - 1);
  const target = apples.children[index] as HTMLElement | undefined;
  if (!target) return;
  const center = target.offsetLeft + target.offsetWidth / 2;
  const faceLeft = center < apples.clientWidth / 2;
  worm.dataset.facing = faceLeft ? 'left' : 'right';
  worm.style.left = `${center - (faceLeft ? 36 : 109)}px`;
  worm.style.top = `${target.offsetTop + 43}px`;
  if (shouldScroll) {
    const bottom = target.offsetTop + 170;
    if (bottom > scroll.scrollTop + scroll.clientHeight || target.offsetTop < scroll.scrollTop) {
      scroll.scrollTop = Math.max(0, target.offsetTop - 32);
    }
  }
}

function renderScene(now: number): void {
  const eaten = timer.eaten(now);
  const bite = timer.status === 'idle' ? 0 : Math.floor((timer.elapsed(now) % MINUTE) / 6_000);
  const key = `${timer.minutes}:${eaten}:${bite}:${timer.status}`;
  if (key === lastScene) return;
  const advanced = eaten !== lastEaten;
  lastScene = key;
  lastEaten = eaten;
  apples.innerHTML = Array.from({ length: timer.minutes }, (_, index) => {
    const isEaten = index < eaten;
    const active = index === eaten && timer.status !== 'idle';
    const appleBite = active ? bite : 0;
    return `<li class="apple-slot${isEaten ? ' is-eaten' : ''}${active ? ' is-active' : ''}" aria-label="${index + 1}個目：${isEaten ? 'たべたよ' : active ? '食べているよ' : 'これから'}"><span class="apple-number" aria-hidden="true">${isEaten ? '✓' : String(index + 1).padStart(2, '0')}</span><span class="apple-art">${isEaten ? core : apple(String(index), appleBite)}</span>${active ? '<span class="apple-crumbs" aria-hidden="true">· ·</span>' : ''}</li>`;
  }).join('');
  scene.dataset.state = timer.status;
  scene.classList.toggle('many-apples', timer.minutes > 5);
  element('eaten').textContent = String(eaten);
  element('total').textContent = String(timer.minutes);
  positionWorm(advanced);
  if (advanced && timer.status === 'running') announce(`${eaten}個たべたよ。あと${timer.minutes - eaten}個。`);
}

function render(now = Date.now()): void {
  const remaining = timer.remaining(now);
  const formatted = formatTime(remaining);
  clock.textContent = formatted;
  const totalSeconds = Math.ceil(remaining / 1000);
  clock.setAttribute('aria-label', `残り${Math.floor(totalSeconds / 60)}分${totalSeconds % 60}秒`);
  const percentage = (timer.elapsed(now) / timer.duration) * 100;
  element('progress-fill').style.width = `${percentage}%`;
  element('progress').setAttribute('aria-valuenow', String(Math.round(percentage)));
  document.title = timer.status === 'idle' ? 'もぐもぐタイマー — あおむしと、ひとつずつ。' : `${formatted} · もぐもぐタイマー`;
  renderScene(now);

  if (lastStatus !== timer.status) {
    lastStatus = timer.status;
    document.querySelector('main')!.dataset.state = timer.status;
    const content = {
      idle: { headline: 'きょうは、何分がんばる？', intro: '1分かけて、りんごを1つ。いっしょに進もう。', status: 'じゅんび中', caption: 'あなただけの、こつこつ時間', button: 'はじめる', message: 'おなか、ぺこぺこ！', note: 'いただきます、の準備中' },
      running: { headline: 'ひとくちずつ、進んでる。', intro: 'あおむしも、あなたといっしょにがんばっているよ。', status: 'もぐもぐ中', caption: 'のこりのじかん', button: 'ひとやすみ', message: 'もぐもぐ。おいしいな。', note: 'いいペース、その調子' },
      paused: { headline: 'ひとやすみも、たいせつ。', intro: '準備ができたら、またいっしょに始めよう。', status: 'ひとやすみ', caption: 'ここから、またつづけよう', button: 'つづける', message: 'ちょっと、ひとやすみ。', note: 'あおむしも休けい中' },
      finished: { headline: 'ぜんぶ食べたよ。おつかれさま！', intro: 'がんばったあなたに、はなまる。ゆっくりひとやすみしよう。', status: 'できた！', caption: 'すてきな時間を、ありがとう', button: 'もういちど', message: 'ごちそうさまでした！', note: 'おなかいっぱい、ありがとう' },
    }[timer.status];
    element('headline').textContent = content.headline;
    element('intro-text').textContent = content.intro;
    element('status').textContent = content.status;
    element('status').dataset.state = timer.status;
    element('clock-caption').textContent = content.caption;
    element('worm-message').textContent = content.message;
    element('progress-note').textContent = content.note;
    primary.innerHTML = `${timer.status === 'running' ? icons.pause : timer.status === 'finished' ? icons.reset : icons.play}<span>${content.button}</span>`;
    primary.classList.toggle('is-running', timer.status === 'running');
    reset.disabled = timer.status === 'idle';
    settings.disabled = timer.status !== 'idle';
    element('setting-hint').textContent = timer.status === 'idle' ? '1〜60分でえらべるよ' : '「はじめにもどす」で時間を変更';
  }
  element<HTMLButtonElement>('minus').disabled = timer.minutes <= 1;
  element<HTMLButtonElement>('plus').disabled = timer.minutes >= 60;
  document.querySelectorAll<HTMLButtonElement>('[data-minutes]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.minutes) === timer.minutes)));
}

function setMinutes(value: number): void {
  timer.setMinutes(value);
  input.value = String(timer.minutes);
  scroll.scrollTop = 0;
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
    announce(`${timer.minutes}分のタイマーが終わりました。りんごをぜんぶ食べたよ。おつかれさま！`);
  }
  render(now);
}

primary.addEventListener('click', () => {
  const now = Date.now();
  if (timer.status === 'running') {
    timer.pause(now);
    if (timer.remaining(now) === 0) playCompletion();
    announce(timer.remaining(now) === 0 ? 'タイマーが終わりました。おつかれさま！' : 'タイマーを一時停止しました。');
  } else {
    void prepareAudio();
    if (timer.status === 'finished') timer.reset();
    if (timer.status === 'idle') setMinutes(input.valueAsNumber);
    timer.start(now);
    announce('タイマーを開始しました。');
  }
  render(now);
});
reset.addEventListener('click', () => {
  timer.reset();
  scroll.scrollTop = 0;
  render();
  announce('タイマーをはじめにもどしました。');
});
input.addEventListener('change', () => setMinutes(input.valueAsNumber));
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { setMinutes(input.valueAsNumber); primary.focus(); } });
element('minus').addEventListener('click', () => setMinutes(timer.minutes - 1));
element('plus').addEventListener('click', () => setMinutes(timer.minutes + 1));
document.querySelectorAll<HTMLButtonElement>('[data-minutes]').forEach((button) => button.addEventListener('click', () => setMinutes(Number(button.dataset.minutes))));
element('sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  element('sound').innerHTML = `${soundEnabled ? icons.sound : icons.mute}<span>おと ${soundEnabled ? 'ON' : 'OFF'}</span>`;
  element('sound').setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled) void prepareAudio();
});
new ResizeObserver(() => positionWorm()).observe(apples);
document.addEventListener('visibilitychange', tick);
window.addEventListener('pageshow', tick);
setInterval(tick, 250);
render();
