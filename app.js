const overlay = document.getElementById('overlay');
const botSprite = document.getElementById('bot-sprite');
const spriteContainer = document.getElementById('sprite-container');
const statusBadge = document.getElementById('status-badge');
const micBar = document.getElementById('mic-bar');
const particles = document.getElementById('particles');

let audioCtx = null;
let analyser = null;
let currentEmotion = 'sleep';
let frameToggle = false;
let sleepTimer = null;
let emotionTimer = null;

const THRESHOLD_LOW = 24;
const THRESHOLD_MEDIUM = 68;
const THRESHOLD_HIGH = 115;

const STATES = {
  sleep: {
    frames: ['assets/sleep_1.png', 'assets/sleep_2.png'],
    label: 'Zzz...',
    color: '#64748b',
    particle: '💤'
  },
  normal: {
    frames: ['assets/normal_1.png', 'assets/normal_2.png'],
    label: 'En écoute !',
    color: '#73eff7',
    particle: '🎵'
  },
  hearts: {
    frames: ['assets/hearts_1.png', 'assets/hearts_2.png'],
    label: 'Coucou Justine <3',
    color: '#ff0044',
    particle: '❤️'
  },
  surprised: {
    frames: ['assets/surprised.png', 'assets/normal_1.png'],
    label: 'Oh ?!',
    color: '#ffcd75',
    particle: '❗'
  },
  angry: {
    frames: ['assets/angry_1.png', 'assets/angry_2.png'],
    label: 'Trop de bruit !',
    color: '#ef4444',
    particle: '💢'
  },
  purr: {
    frames: ['assets/purr_1.png', 'assets/purr_2.png'],
    label: 'Ronron... ^w^',
    color: '#38b764',
    particle: '✨'
  }
};

setInterval(() => {
  frameToggle = !frameToggle;
  const state = STATES[currentEmotion];
  if (!state) return;

  if (currentEmotion === 'normal' && Math.random() < 0.18) {
    botSprite.src = 'assets/blink.png';
  } else {
    botSprite.src = frameToggle ? state.frames[0] : state.frames[1];
  }

  if (Math.random() < 0.35) {
    spawnParticle(state.particle);
  }
}, 450);

overlay.addEventListener('click', async () => {
  try {
    await initAudio();
    overlay.style.display = 'none';

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {});
    }
    setEmotion('normal', 4000);
  } catch (err) {
    alert("Erreur d'accès au micro : " + err.message);
  }
});

async function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioCtx.createMediaStreamSource(stream);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  listenLoop();
}

function listenLoop() {
  const buffer = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buffer);

  let sum = 0;
  let peak = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i];
    if (buffer[i] > peak) peak = buffer[i];
  }
  const avg = sum / buffer.length;

  const pct = Math.min(100, Math.round((peak / 140) * 100));
  micBar.style.width = pct + '%';
  micBar.style.backgroundColor = peak > THRESHOLD_HIGH ? '#ef4444' : (peak > THRESHOLD_MEDIUM ? '#ffcd75' : '#38b764');

  if (!isPetting) {
    if (peak > THRESHOLD_HIGH) {
      setEmotion('angry', 4000);
    } else if (peak > THRESHOLD_MEDIUM) {
      setEmotion('surprised', 3000);
    } else if (avg > THRESHOLD_LOW) {
      const next = Math.random() > 0.6 ? 'hearts' : 'normal';
      setEmotion(next, 5000);
    }
  }

  requestAnimationFrame(listenLoop);
}

function setEmotion(emotion, duration) {
  if (currentEmotion === 'angry' && emotion !== 'angry' && emotion !== 'purr') return;

  clearTimeout(sleepTimer);
  clearTimeout(emotionTimer);

  if (currentEmotion !== emotion) {
    currentEmotion = emotion;
    const state = STATES[emotion];
    botSprite.src = state.frames[0];
    statusBadge.textContent = state.label;
    statusBadge.style.borderColor = state.color;
    statusBadge.style.color = state.color;
    spawnParticle(state.particle);
    play8BitSound(emotion);
  }

  emotionTimer = setTimeout(() => {
    if (currentEmotion !== 'sleep' && !isPetting) {
      currentEmotion = 'normal';
      statusBadge.textContent = STATES.normal.label;
      statusBadge.style.borderColor = STATES.normal.color;
      statusBadge.style.color = STATES.normal.color;
    }
  }, duration);

  sleepTimer = setTimeout(() => {
    currentEmotion = 'sleep';
    statusBadge.textContent = STATES.sleep.label;
    statusBadge.style.borderColor = STATES.sleep.color;
    statusBadge.style.color = STATES.sleep.color;
  }, duration + 5000);
}

function spawnParticle(symbol) {
  const el = document.createElement('div');
  el.className = 'particle';
  el.textContent = symbol;
  el.style.left = (20 + Math.random() * 60) + '%';
  el.style.top = (10 + Math.random() * 30) + '%';
  particles.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

let isPetting = false;
let petTimer = null;
let purrOsc = null;
let purrGain = null;

window.addEventListener('pointerdown', () => {
  if (overlay.style.display !== 'none') return;
  triggerPet();
});

window.addEventListener('pointermove', (e) => {
  if (overlay.style.display !== 'none') return;
  if (e.buttons > 0) triggerPet();
});

window.addEventListener('pointerup', () => {
  clearTimeout(petTimer);
  petTimer = setTimeout(stopPetting, 700);
});

function triggerPet() {
  clearTimeout(petTimer);
  clearTimeout(sleepTimer);

  if (!isPetting) {
    isPetting = true;
    setEmotion('purr', 4000);
    startPurrAudio();
    if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
  }

  petTimer = setTimeout(stopPetting, 1200);
}

function stopPetting() {
  if (!isPetting) return;
  isPetting = false;
  stopPurrAudio();
  setEmotion('normal', 4000);
}

function play8BitSound(emotion) {
  if (!audioCtx || emotion === 'sleep' || emotion === 'purr') return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (emotion === 'angry') {
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(110, now + 0.1);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.26);
  } else if (emotion === 'surprised') {
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(1040, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.19);
  } else if (emotion === 'hearts') {
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.09);
    osc.frequency.setValueAtTime(783.99, now + 0.18);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.32);
    osc.start(now);
    osc.stop(now + 0.33);
  } else {
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.08);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.16);
    osc.start(now);
    osc.stop(now + 0.17);
  }
}

function startPurrAudio() {
  if (!audioCtx || purrOsc) return;
  const now = audioCtx.currentTime;
  purrOsc = audioCtx.createOscillator();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  purrGain = audioCtx.createGain();

  purrOsc.type = 'sawtooth';
  purrOsc.frequency.setValueAtTime(50, now);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(4.5, now);
  lfoGain.gain.setValueAtTime(16, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(135, now);

  purrGain.gain.setValueAtTime(0, now);
  purrGain.gain.linearRampToValueAtTime(0.12, now + 0.2);

  lfo.connect(lfoGain);
  lfoGain.connect(purrOsc.frequency);
  purrOsc.connect(filter);
  filter.connect(purrGain);
  purrGain.connect(audioCtx.destination);

  lfo.start(now);
  purrOsc.start(now);
  purrOsc._lfo = lfo;
}

function stopPurrAudio() {
  if (!purrOsc || !purrGain) return;
  const now = audioCtx.currentTime;
  purrGain.gain.linearRampToValueAtTime(0, now + 0.25);
  setTimeout(() => {
    if (purrOsc) {
      purrOsc.stop();
      purrOsc._lfo.stop();
      purrOsc.disconnect();
      purrOsc = null;
      purrGain = null;
    }
  }, 260);
}
