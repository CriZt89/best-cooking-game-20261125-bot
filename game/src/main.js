// Rush Kitchen — main loop and wiring. One clear job: own the frame
// loop, route clicks and keys to the game, and start everything up.
(function (global) {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var input = new global.RK_Input(canvas);
  var game = new global.RK_Game(global.RK_AUDIO);
  var render = global.RK_RENDER.render;

  function inside(b, x, y) {
    return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  function stationAt(x, y) {
    var best = null, bestD = Infinity;
    var stations = global.RK_CONFIG.STATIONS;
    for (var i = 0; i < stations.length; i++) {
      var s = stations[i];
      var dx = x - s.cx, dy = y - s.cy;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = s; }
    }
    return bestD <= 110 ? best : null;
  }

  function handleClick(p) {
    var b = global.RK_UI.buttons;
    global.RK_AUDIO.ensure();
    if (game.screen === 'title') {
      for (var s = 0; s < 3; s++) {
        if (inside(b['shift' + s], p.x, p.y)) {
          game.shiftIndex = s;
          global.RK_AUDIO.click();
          return;
        }
      }
      if (inside(b.start, p.x, p.y)) {
        global.RK_AUDIO.click();
        game.startShift(game.shiftIndex);
      }
      return;
    }
    if (game.screen === 'paused') {
      if (inside(b.resume, p.x, p.y)) game.togglePause();
      return;
    }
    if (game.screen === 'over') {
      if (inside(b.restart, p.x, p.y)) {
        global.RK_AUDIO.click();
        game.startShift(game.shiftIndex);
      }
      return;
    }
    // Playing: pause / mute buttons first, then the kitchen.
    if (inside(b.pause, p.x, p.y)) { game.togglePause(); return; }
    if (inside(b.mute, p.x, p.y)) {
      global.RK_AUDIO.muted = !global.RK_AUDIO.muted;
      if (global.RK_AUDIO.muted) global.RK_AUDIO.stopSizzle();
      return;
    }
    var st = stationAt(p.x, p.y);
    if (st) {
      var dx = st.cx - game.chef.x, dy = st.cy - game.chef.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= global.RK_CONFIG.REACH) {
        game.interact(st);
      } else {
        // Walk to the station; a second click there interacts on arrival.
        game.chef.target = { x: st.cx, y: st.cy, station: st };
      }
      return;
    }
    // Otherwise walk to the clicked floor point.
    if (p.y > global.RK_CONFIG.FLOOR_Y && p.y < global.RK_CONFIG.BAR_Y) {
      game.chef.target = { x: p.x, y: p.y, station: null };
    }
  }

  function handleKeys() {
    if (input.wasPressed('p') || input.wasPressed('Escape')) {
      if (game.screen === 'playing' || game.screen === 'paused') game.togglePause();
    }
    if (input.wasPressed('m')) {
      global.RK_AUDIO.muted = !global.RK_AUDIO.muted;
      if (global.RK_AUDIO.muted) global.RK_AUDIO.stopSizzle();
    }
    if (input.wasPressed('Enter')) {
      if (game.screen === 'title') game.startShift(game.shiftIndex);
      else if (game.screen === 'over') game.startShift(game.shiftIndex);
    }
    if (input.wasPressed('r')) {
      if (game.screen === 'over' || game.screen === 'paused') game.startShift(game.shiftIndex);
    }
    if (input.wasPressed('e') || input.wasPressed(' ')) {
      if (game.screen === 'playing') game.interact();
    }
  }

  var last = 0;
  function frame(ts) {
    var now = ts / 1000;
    var dt = last ? Math.min(0.05, now - last) : 0.016;
    last = now;

    handleKeys();
    if (input.clicked) handleClick(input.clicked);

    // Click-to-walk arrival: interact with the station we walked to.
    var target = game.chef.target;
    if (game.screen === 'playing' && target && target.station) {
      var dx = target.station.cx - game.chef.x, dy = target.station.cy - game.chef.y;
      if (Math.sqrt(dx * dx + dy * dy) <= global.RK_CONFIG.REACH) {
        game.chef.target = null;
        game.interact(target.station);
      }
    }

    game.update(dt, input);
    render(ctx, game, input, now);
    input.endFrame();
    global.requestAnimationFrame(frame);
  }

  // Expose the live game for play-testing hooks (screenshots, debugging).
  global.RK_GAME = game;
  global.requestAnimationFrame(frame);
})(typeof window !== 'undefined' ? window : globalThis);
