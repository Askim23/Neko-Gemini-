(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const pet = $('pet');
  const speech = $('speech');
  const startButton = $('start-button');
  const soundButton = $('sound-button');
  const notice = $('notice');
  const meterFill = $('meter-fill');
  const volumeValue = $('volume-value');
  const statusDot = $('status-dot');
  const statusLabel = $('status-label');
  const particles = $('particles');

  const SPRITES = {
    idle: ['./assets/idle_1.png', './assets/idle_2.png'],
    sleep: ['./assets/sleep_1.png', './assets/sleep_2.png'],
    curious: ['./assets/curious.png'],
    love: ['./assets/love.png'],
    surprised: ['./assets/surprised.png'],
    angry: ['./assets/angry_1.png', './assets/angry_2.png'],
    purr: ['./assets/purr_1.png', './assets/purr_2.png'],
    blink: ['./assets/blink.png']
  };

  const config = {
    softThreshold: 0.035,
    mediumThreshold: 0.105,
    loudThreshold: 0.23,
    calmDelay: 4500,
    surpriseDuration: 3000,
    angerDuration: 4000,
    purrDuration: 2400
  };

  let audioContext = null;
  let analyser = null;
  let microphone = null;
  let data = null;
  let audioEnabled = true;
  let currentMood = 'sleep';
  let lastActivity = Date.now();
  let surpriseUntil = 0;
  let angerUntil = 0;
  let purrUntil = 0;
  let frame = 0;
  let blinkUntil = 0;
  let lastParticle = 0;
  let smoothedLevel = 0;
  let wakeLock = null;
  let oscillator = null;
  let gainNode = null;
  let purrOsc = null;
  let purrGain = null;

  function setStatus(label, color) {
    statusLabel.textContent = label;
    statusDot.style.background = color;
    statusDot.style.color = color;
  }

  function setMood(mood, message, color, emoji) {
    if (currentMood !== mood) {
      currentMood = mood;
      frame = 0;
      pet.src = SPRITES[mood][0];
      pet.alt = `PixelBot : ${mood}`;
    }
    speech.textContent = message;
    speech.style.borderColor = color;
    speech.style.color = '#1a2441';
    if (emoji) spawnParticles(emoji, mood === 'angry' ? 5 : 2);
    const labels = {
      sleep: ['EN SOMMEIL', '#7785a8'],
      idle: ['AU REPOS', '#8b9ac0'],
      curious: ['EN ÉCOUTE', '#69e9f5'],
      love: ['CONTENT', '#ff83c2'],
      surprised: ['SURPRIS', '#ffdc46'],
      angry: ['TROP DE BRUIT', '#ff6674'],
      purr: ['RONRON', '#74edaa']
    };
    setStatus(...labels[mood]);
  }

  function spawnParticles(symbol, count = 2) {
    const now = Date.now();
    if (now - lastParticle < 280) return;
    lastParticle = now;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'particle';
      el.textContent = symbol;
      el.style.left = `${25 + Math.random() * 50}%`;
      el.style.top = `${38 + Math.random() * 28}%`;
      particles.appendChild(el);
      setTimeout(() => el.remove(), 1900);
    }
  }

  function playTone(frequency = 660, duration = 0.09, type = 'square', volume = 0.045) {
    if (!audioEnabled || !audioContext) return;
    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      osc.connect(gain).connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + duration);
    } catch (_) {}
  }

  function startPurrSound() {
    if (!audioEnabled || !audioContext || purrOsc) return;
    purrOsc = audioContext.createOscillator();
    purrGain = audioContext.createGain();
    purrOsc.type = 'triangle';
    purrOsc.frequency.setValueAtTime(48, audioContext.currentTime);
    purrOsc.frequency.linearRampToValueAtTime(58, audioContext.currentTime + 0.25);
    purrGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    purrGain.gain.linearRampToValueAtTime(0.035, audioContext.currentTime + 0.12);
    purrOsc.connect(purrGain).connect(audioContext.destination);
    purrOsc.start();
    const stopAt = purrUntil;
    const check = () => {
      if (!purrOsc) return;
      if (Date.now() >= purrUntil) {
        purrGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
        const old = purrOsc;
        purrOsc = null; purrGain = null;
        setTimeout(() => { try { old.stop(); } catch (_) {} }, 350);
      } else {
        purrOsc.frequency.setTargetAtTime(48 + Math.random() * 10, audioContext.currentTime, 0.18);
        setTimeout(check, 180);
      }
    };
    setTimeout(check, 180);
  }

  function stopPurrSound() {
    if (!purrOsc || !purrGain) return;
    try {
      purrGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.06);
      const old = purrOsc;
      purrOsc = null; purrGain = null;
      setTimeout(() => { try { old.stop(); } catch (_) {} }, 300);
    } catch (_) { purrOsc = null; purrGain = null; }
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (_) { /* Le navigateur peut refuser le Wake Lock. */ }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
  });

  async function activateMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      notice.textContent = 'Micro indisponible : ouvre PixelBot en HTTPS dans un navigateur compatible.';
      return;
    }
    startButton.disabled = true;
    startButton.textContent = 'OUVERTURE...';
    try {
      microphone = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false
      });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      await audioContext.resume();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.72;
      data = new Uint8Array(analyser.fftSize);
      const source = audioContext.createMediaStreamSource(microphone);
      source.connect(analyser);
      await requestWakeLock();
      startButton.textContent = '✓ MICRO ACTIF';
      startButton.classList.add('active');
      notice.textContent = 'Micro actif : tout est analysé sur ce téléphone, rien n’est enregistré.';
      playTone(740, 0.08);
      requestAnimationFrame(analyseAudio);
    } catch (error) {
      startButton.disabled = false;
      startButton.textContent = '▶ ACTIVER LE MICRO';
      notice.textContent = error.name === 'NotAllowedError'
        ? 'Autorisation refusée. Autorise le micro dans les paramètres du navigateur puis réessaie.'
        : 'Impossible d’activer le micro. Vérifie les permissions et réessaie.';
    }
  }

  function analyseAudio() {
    if (!analyser || !data) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = (data[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / data.length);
    smoothedLevel = smoothedLevel * 0.72 + rms * 0.28;
    const level = Math.min(1, smoothedLevel * 3.6);
    const percent = Math.round(level * 100);
    meterFill.style.width = `${percent}%`;
    volumeValue.textContent = `${percent}%`;

    const now = Date.now();
    if (smoothedLevel >= config.loudThreshold) {
      angerUntil = now + config.angerDuration;
      surpriseUntil = 0;
      lastActivity = now;
      playTone(150, 0.22, 'sawtooth', 0.035);
    } else if (smoothedLevel >= config.mediumThreshold) {
      if (now > angerUntil && now > surpriseUntil) {
        surpriseUntil = now + config.surpriseDuration;
        playTone(880, 0.12);
        playTone(1040, 0.12);
      }
      lastActivity = now;
    } else if (smoothedLevel >= config.softThreshold) {
      lastActivity = now;
    }
    updateMood(now);
    requestAnimationFrame(analyseAudio);
  }

  function updateMood(now = Date.now()) {
    // Priorité stricte : colère > surprise > caresses > écoute > sommeil.
    if (now < angerUntil) {
      stopPurrSound();
      setMood('angry', 'Trop de bruit !', '#ff6674', '💢');
      return;
    }
    if (now < surpriseUntil) {
      stopPurrSound();
      setMood('surprised', 'Oh ?!', '#ffdc46', '❗');
      return;
    }
    if (now < purrUntil) {
      setMood('purr', 'Ronron... ^w^', '#74edaa', '✨');
      startPurrSound();
      return;
    }
    stopPurrSound();
    const active = now - lastActivity < config.calmDelay;
    if (active) {
      // Alterne entre curiosité et affection, sans changer à chaque frame.
      const affection = Math.floor(now / 5200) % 2 === 1;
      if (affection) setMood('love', 'Coucou Justine <3', '#ff83c2', '❤️');
      else setMood('curious', 'En écoute !', '#69e9f5', '🎵');
    } else {
      setMood('sleep', 'Zzz...', '#8ca0c7', '💤');
    }
  }

  function petAction(event) {
    event.preventDefault();
    const now = Date.now();
    purrUntil = now + config.purrDuration;
    lastActivity = now;
    try { navigator.vibrate?.([25, 35, 25]); } catch (_) {}
    playTone(520, 0.06);
    updateMood(now);
  }

  $('pet-button').addEventListener('pointerdown', petAction);
  startButton.addEventListener('click', activateMicrophone);
  soundButton.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    soundButton.textContent = audioEnabled ? '♫ SON ON' : '♫ SON OFF';
    soundButton.setAttribute('aria-pressed', String(audioEnabled));
    if (!audioEnabled) stopPurrSound();
    else playTone(660, 0.07);
  });

  // Animation rétro : changement de pose environ toutes les 450 ms.
  setInterval(() => {
    frame++;
    if (currentMood === 'idle' || currentMood === 'sleep' || currentMood === 'angry' || currentMood === 'purr') {
      const frames = SPRITES[currentMood];
      pet.src = frames[frame % frames.length];
    }
    if (Math.random() < 0.035 && !['angry','surprised','purr'].includes(currentMood)) {
      const previous = pet.src;
      pet.src = SPRITES.blink[0];
      blinkUntil = Date.now() + 140;
      setTimeout(() => { if (Date.now() >= blinkUntil) pet.src = previous; }, 150);
    }
    updateMood();
  }, 450);

  // Démarrage en mode sommeil. Le micro ne démarre qu'après une action explicite.
  setMood('sleep', 'Zzz...', '#8ca0c7', '💤');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
