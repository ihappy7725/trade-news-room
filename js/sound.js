/* 소리: 공부용 잔잔한 배경음악(브라우저에서 직접 합성)과 '딸깍' 효과음.
   음원 파일 없이 Web Audio API로 만들어서 저작권 걱정이 없어요. */
(function () {
  var PREF_KEY = "trade-news-room-sound";
  var pref = { bgm: false, sfx: true, vol: 0.5 };
  try { var raw = localStorage.getItem(PREF_KEY); if (raw) { var o = JSON.parse(raw); pref.bgm = !!o.bgm; if (typeof o.vol === "number") pref.vol = Math.min(1, Math.max(0, o.vol)); } } catch (e) {}
  function savePref() { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch (e) {} }

  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, sfxBus = null, musicBus = null, reverb = null, delay = null;
  function ensure() {
    if (!AC) return null;
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.35; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    reverb = ctx.createConvolver(); reverb.buffer = impulse(3.2, 2.6);
    var wet = ctx.createGain(); wet.gain.value = 0.55; reverb.connect(wet); wet.connect(musicBus);
    delay = ctx.createDelay(1.5); delay.delayTime.value = 0.42;
    var fb = ctx.createGain(); fb.gain.value = 0.32; delay.connect(fb); fb.connect(delay);
    var dl = ctx.createGain(); dl.gain.value = 0.35; delay.connect(dl); dl.connect(reverb); dl.connect(musicBus);
    return ctx;
  }
  function impulse(seconds, decay) {
    var len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function level() { return 1.1 * pref.vol; }
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  /* ---------- 딸깍 ---------- */
  function click() {
    if (!pref.sfx || !ensure()) return;
    var t = ctx.currentTime;
    tick(t, 2100, 0.9); tick(t + 0.055, 1500, 0.6);
  }
  function tick(t, freq, vol) {
    var len = Math.floor(ctx.sampleRate * 0.012), nb = ctx.createBuffer(1, len, ctx.sampleRate), d = nb.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var noise = ctx.createBufferSource(); noise.buffer = nb;
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq * 1.6; bp.Q.value = 3;
    var ng = ctx.createGain(); ng.gain.value = vol * 0.8;
    noise.connect(bp); bp.connect(ng); ng.connect(sfxBus); noise.start(t);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.04);
    g.gain.setValueAtTime(vol * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.06);
  }

  /* ---------- 배경음악 ---------- */
  // 느린 코드 진행 (Fmaj7 → Em7 → Dm7 → Cmaj7)과 오르골 같은 펜타토닉 멜로디
  var CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  var MELODY = [72, 74, 76, 79, 81, 84];
  var CHORD_LEN = 6.4, timer = null, nextChord = 0, chordIdx = 0, nextNote = 0, playing = false;

  function pad(t, notes) {
    notes.forEach(function (m, i) {
      [-6, 6].forEach(function (cents, k) {
        var o = ctx.createOscillator(); o.type = k ? "sine" : "triangle";
        o.frequency.value = hz(m); o.detune.value = cents;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
        var g = ctx.createGain(); var peak = 0.05 / (1 + i * 0.15);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 1.8);
        g.gain.setValueAtTime(peak, t + CHORD_LEN - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + CHORD_LEN + 1.6);
        o.connect(lp); lp.connect(g); g.connect(musicBus); g.connect(reverb);
        o.start(t); o.stop(t + CHORD_LEN + 1.8);
      });
    });
    var b = ctx.createOscillator(), bg = ctx.createGain(); b.type = "sine"; b.frequency.value = hz(notes[0] - 12);
    bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(0.06, t + 1.2); bg.gain.linearRampToValueAtTime(0.0001, t + CHORD_LEN + 0.8);
    b.connect(bg); bg.connect(musicBus); b.start(t); b.stop(t + CHORD_LEN + 1);
  }
  function pluck(t, m) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = hz(m); o2.type = "sine"; o2.frequency.value = hz(m) * 2.01;
    var g2 = ctx.createGain(); g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(musicBus); g.connect(delay); g.connect(reverb);
    o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7);
  }
  function schedule() {
    var ahead = ctx.currentTime + 1.2;
    while (nextChord < ahead) { pad(nextChord, CHORDS[chordIdx % CHORDS.length]); chordIdx++; nextChord += CHORD_LEN; }
    while (nextNote < ahead) {
      if (Math.random() < 0.55) pluck(nextNote, MELODY[Math.floor(Math.random() * MELODY.length)]);
      nextNote += [0.8, 1.2, 1.6][Math.floor(Math.random() * 3)];
    }
  }
  function startBgm() {
    if (playing || !ensure()) return;
    playing = true;
    var t = ctx.currentTime + 0.1; nextChord = t; nextNote = t + 1.5;
    musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value, t); musicBus.gain.linearRampToValueAtTime(level(), t + 3);
    schedule(); timer = setInterval(schedule, 250);
  }
  function stopBgm() {
    if (!playing) return;
    playing = false; clearInterval(timer);
    var t = ctx.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value, t); musicBus.gain.linearRampToValueAtTime(0, t + 1.5);
  }
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  // 배경음악을 켜 둔 사람은 다음 방문 때 첫 클릭에서 다시 시작돼요 (브라우저가 자동 재생을 막기 때문)
  if (pref.bgm) {
    var resume = function () { startBgm(); document.removeEventListener("pointerdown", resume, true); document.removeEventListener("keydown", resume, true); };
    document.addEventListener("pointerdown", resume, true); document.addEventListener("keydown", resume, true);
  }

  /* ---------- 상단바 확성기 버튼: 배경음악 켜기/끄기 (효과음은 항상 켜짐) ---------- */
  function wire() {
    var bb = document.getElementById("bgmBtn");
    if (!bb) return;
    if (!AC) { bb.hidden = true; return; }
    function paint() {
      bb.classList.toggle("on", pref.bgm);
      bb.setAttribute("aria-pressed", String(pref.bgm));
      var label = pref.bgm ? "배경음악 끄기" : "배경음악 켜기";
      bb.setAttribute("aria-label", label); bb.title = label;
    }
    bb.addEventListener("click", function () { window.Sound.toggleBgm(); paint(); });
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();

  window.Sound = {
    supported: !!AC,
    click: click,
    get bgm() { return pref.bgm; },
    get sfx() { return pref.sfx; },
    toggleBgm: function () { pref.bgm = !pref.bgm; savePref(); if (pref.bgm) startBgm(); else stopBgm(); return pref.bgm; },
    toggleSfx: function () { pref.sfx = !pref.sfx; savePref(); if (pref.sfx) click(); return pref.sfx; }
  };
})();
