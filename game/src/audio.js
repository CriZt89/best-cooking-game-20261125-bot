// Rush Kitchen — synthesized sound. One clear job: every sound effect is
// made with WebAudio oscillators and filtered noise, so the game ships no
// audio files at all.
(function (global) {
  'use strict';

  function AudioEngine() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  AudioEngine.prototype.ensure = function () {
    if (!this.ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  };

  AudioEngine.prototype.tone = function (freq, dur, type, vol, slideTo) {
    if (this.muted || !this.ensure()) return;
    var t = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  AudioEngine.prototype.noise = function (dur, vol, filterFreq) {
    if (this.muted || !this.ensure()) return;
    var t = this.ctx.currentTime;
    var len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 1800;
    filter.Q.value = 0.8;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  };

  // Named game sounds, each one a tiny composition of the two primitives.
  AudioEngine.prototype.pickup = function () { this.tone(520, 0.09, 'triangle', 0.16, 760); };
  AudioEngine.prototype.place = function () { this.tone(340, 0.08, 'triangle', 0.14, 260); };
  AudioEngine.prototype.chop = function () { this.noise(0.09, 0.28, 2400); this.tone(180, 0.06, 'square', 0.06, 120); };
  AudioEngine.prototype.chopDone = function () { this.tone(660, 0.08, 'triangle', 0.14); this.tone(880, 0.12, 'triangle', 0.14); };
  AudioEngine.prototype.cookDone = function () { this.tone(740, 0.1, 'sine', 0.16); this.tone(988, 0.16, 'sine', 0.16); };
  AudioEngine.prototype.serve = function () {
    var self = this;
    [523, 659, 784, 1047].forEach(function (f, i) {
      setTimeout(function () { self.tone(f, 0.14, 'triangle', 0.16); }, i * 70);
    });
  };
  AudioEngine.prototype.reject = function () { this.tone(220, 0.16, 'sawtooth', 0.1, 140); };
  AudioEngine.prototype.expire = function () { this.tone(392, 0.12, 'sine', 0.12, 311); this.tone(311, 0.2, 'sine', 0.12, 233); };
  AudioEngine.prototype.tick = function () { this.tone(980, 0.05, 'square', 0.05); };
  AudioEngine.prototype.levelUp = function () {
    var self = this;
    [440, 554, 659, 880].forEach(function (f, i) {
      setTimeout(function () { self.tone(f, 0.16, 'triangle', 0.15); }, i * 80);
    });
  };
  AudioEngine.prototype.gameOver = function () {
    var self = this;
    [392, 330, 262, 196].forEach(function (f, i) {
      setTimeout(function () { self.tone(f, 0.28, 'triangle', 0.15); }, i * 160);
    });
  };
  AudioEngine.prototype.click = function () { this.tone(700, 0.05, 'sine', 0.1); };

  // A looping sizzle while something cooks on the stove.
  AudioEngine.prototype.startSizzle = function () {
    if (this.muted || !this.ensure() || this.sizzleNodes) return;
    var len = this.ctx.sampleRate;
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    var filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    var gain = this.ctx.createGain();
    gain.gain.value = 0.045;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this.sizzleNodes = { src: src, gain: gain };
  };

  AudioEngine.prototype.stopSizzle = function () {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.src.stop(); } catch (e) { /* already stopped */ }
    this.sizzleNodes = null;
  };

  global.RK_AUDIO = new AudioEngine();
})(typeof window !== 'undefined' ? window : globalThis);
