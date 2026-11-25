// Rush Kitchen — rendering. One clear job: draw everything the player
// sees on the canvas, from the kitchen floor to the title screen. All art
// is drawn with canvas paths; the game ships no image files.
(function (global) {
  'use strict';

  var C = global.RK_CONFIG;
  var ITEMS = C.ITEMS;
  var COLORS = C.COLORS;

  // Button rectangles from the last frame, so main.js can hit-test clicks.
  var UI = { buttons: {} };
  global.RK_UI = UI;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, s, x, y, size, color, align, weight) {
    ctx.fillStyle = color || COLORS.text;
    ctx.font = (weight || 'bold') + ' ' + size + 'px Verdana, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // --- food icons ------------------------------------------------------------
  function drawItem(ctx, id, x, y, s) {
    var half = s / 2;
    ctx.save();
    ctx.translate(x, y);
    if (id === 'tomato' || id === 'tomato_chopped') {
      ctx.fillStyle = id === 'tomato' ? '#e5484d' : '#ef6a5e';
      ctx.beginPath(); ctx.arc(0, 2, half * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f9e4d';
      ctx.beginPath(); ctx.arc(-half * 0.25, -half * 0.55, half * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(half * 0.25, -half * 0.55, half * 0.22, 0, Math.PI * 2); ctx.fill();
      if (id === 'tomato_chopped') {
        ctx.strokeStyle = '#c93338'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-half * 0.5, 0); ctx.lineTo(half * 0.5, 0); ctx.stroke();
      }
    } else if (id === 'lettuce' || id === 'lettuce_chopped') {
      ctx.fillStyle = id === 'lettuce' ? '#57b25e' : '#7cc47f';
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(-half * 0.5 + i * half * 0.5, 0, half * 0.42, half * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -half * 0.5); ctx.lineTo(0, half * 0.5); ctx.stroke();
    } else if (id === 'bun') {
      ctx.fillStyle = '#e8b25c';
      ctx.beginPath(); ctx.arc(0, -1, half * 0.9, Math.PI, 0); ctx.fill();
      ctx.fillRect(-half * 0.9, -1, half * 1.8, half * 0.35);
      ctx.fillStyle = '#c98d3e';
      ctx.fillRect(-half * 0.9, half * 0.28, half * 1.8, half * 0.22);
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath(); ctx.arc(-half * 0.3, -half * 0.45, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(half * 0.3, -half * 0.45, 2, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'patty_raw' || id === 'patty_cooked') {
      ctx.fillStyle = id === 'patty_raw' ? '#c98a7a' : '#8a5a3b';
      rr(ctx, -half * 0.95, -half * 0.45, half * 1.9, half * 0.9, half * 0.4);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.arc(-half * 0.4, 0, half * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(half * 0.35, -half * 0.1, half * 0.16, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'cheese') {
      ctx.fillStyle = '#f5c542';
      ctx.beginPath();
      ctx.moveTo(-half * 0.9, half * 0.6); ctx.lineTo(half * 0.9, half * 0.6);
      ctx.lineTo(0, -half * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9a521';
      ctx.beginPath(); ctx.arc(-half * 0.2, half * 0.2, half * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(half * 0.25, half * 0.35, half * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // --- kitchen ---------------------------------------------------------------
  function drawFloor(ctx, game, t) {
    var i, j;
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, C.FLOOR_Y, C.W, C.FLOOR_H);
    ctx.strokeStyle = COLORS.floorLine;
    ctx.lineWidth = 1;
    for (i = 0; i < 12; i++) {
      ctx.beginPath(); ctx.moveTo(i * 80, C.FLOOR_Y); ctx.lineTo(i * 80, C.FLOOR_Y + C.FLOOR_H); ctx.stroke();
    }
    for (j = 0; j < 6; j++) {
      ctx.beginPath(); ctx.moveTo(0, C.FLOOR_Y + j * 80); ctx.lineTo(C.W, C.FLOOR_Y + j * 80); ctx.stroke();
    }
    // Rug in the middle of the room.
    ctx.fillStyle = '#4a2f22';
    rr(ctx, 300, 250, 360, 200, 18); ctx.fill();
    ctx.strokeStyle = '#6b4630'; ctx.lineWidth = 3;
    rr(ctx, 312, 262, 336, 176, 12); ctx.stroke();
    void t;
  }

  function drawStation(ctx, game, st, t) {
    var near = game.screen === 'playing' && game.nearestStation() === st;
    ctx.save();
    // Counter body.
    ctx.fillStyle = COLORS.counter;
    rr(ctx, st.x, st.y, st.w, st.h, 8); ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    rr(ctx, st.x + 4, st.y + 4, st.w - 8, 18, 6); ctx.fill();
    ctx.strokeStyle = COLORS.counterEdge;
    ctx.lineWidth = 2;
    rr(ctx, st.x, st.y, st.w, st.h, 8); ctx.stroke();
    if (near) {
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 3;
      rr(ctx, st.x - 3, st.y - 3, st.w + 6, st.h + 6, 10); ctx.stroke();
    }

    var cx = st.x + st.w / 2, cy = st.y + st.h / 2 + 8;
    if (st.kind === 'bin') {
      drawItem(ctx, st.item, cx, cy - 6, 34);
      text(ctx, st.label, cx, st.y + st.h - 12, 11, '#ffe9c4', 'center');
    } else if (st.kind === 'board') {
      // Wooden chopping board with a knife.
      ctx.fillStyle = '#d9b380';
      rr(ctx, st.x + 22, st.y + 16, st.w - 44, st.h - 34, 6); ctx.fill();
      ctx.strokeStyle = '#8a6a42'; ctx.lineWidth = 2;
      rr(ctx, st.x + 22, st.y + 16, st.w - 44, st.h - 34, 6); ctx.stroke();
      if (game.board.item) {
        drawItem(ctx, game.board.item, cx, cy - 6, 30);
        if (game.board.progress > 0 && game.board.progress < 1) {
          bar(ctx, st.x + 20, st.y + st.h - 14, st.w - 40, 8, game.board.progress, '#ffb347');
        }
        if (game.board.progress >= 1) {
          text(ctx, 'READY!', cx, st.y + st.h - 12, 11, '#7ed491', 'center');
        }
      } else {
        text(ctx, 'CHOP', cx, st.y + st.h - 12, 11, '#ffe9c4', 'center');
      }
    } else if (st.kind === 'stove') {
      // Two burners; flame flickers while something cooks.
      var cooking = game.stove.item && game.stove.progress < 1;
      var done = game.stove.item && game.stove.progress >= 1;
      for (var b = 0; b < 2; b++) {
        var bx = st.x + 38 + b * 74;
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(bx, cy - 4, 26, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, cy - 4, 26, 0, Math.PI * 2); ctx.stroke();
        if ((cooking || done) && b === 0) {
          var fl = cooking ? 10 + Math.sin(t * 9 + b) * 4 : 7;
          ctx.fillStyle = cooking ? '#ff9d2e' : '#7ed491';
          ctx.beginPath();
          ctx.moveTo(bx - 12, cy - 6);
          ctx.quadraticCurveTo(bx, cy - 6 - fl * 2, bx + 12, cy - 6);
          ctx.quadraticCurveTo(bx, cy + 2, bx - 12, cy - 6);
          ctx.fill();
        }
      }
      if (game.stove.item) {
        drawItem(ctx, game.stove.item, st.x + 38, cy - 4, 30);
        if (game.stove.progress > 0 && game.stove.progress < 1) {
          bar(ctx, st.x + 20, st.y + st.h - 14, st.w - 40, 8, game.stove.progress, '#ff9d2e');
        }
        if (done) text(ctx, 'READY!', cx, st.y + st.h - 12, 11, '#7ed491', 'center');
      } else {
        text(ctx, 'STOVE', cx, st.y + st.h - 12, 11, '#ffe9c4', 'center');
      }
    } else if (st.kind === 'plate') {
      // A white plate; items on it fan out in a row.
      ctx.fillStyle = '#f2ead8';
      ctx.beginPath(); ctx.ellipse(cx, cy - 2, 52, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b8ab8d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy - 2, 52, 20, 0, 0, Math.PI * 2); ctx.stroke();
      var items = game.carriedPlate ? [] : game.plate.items;
      for (var k = 0; k < items.length; k++) {
        drawItem(ctx, items[k], cx - 36 + k * 24, cy - 8, 22);
      }
      text(ctx, 'PLATE', cx, st.y + st.h - 12, 11, '#ffe9c4', 'center');
    } else if (st.kind === 'window') {
      // Serving window: warm light, a bell, and the word SERVE.
      ctx.fillStyle = '#3a2417';
      rr(ctx, st.x + 10, st.y + 10, st.w - 20, st.h - 30, 6); ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(cx, st.y + 30, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a33';
      ctx.fillRect(cx - 12, st.y + 38, 24, 5);
      text(ctx, 'SERVE  ▲', cx, st.y + st.h - 12, 12, '#ffe9c4', 'center');
    }
    ctx.restore();
  }

  function bar(ctx, x, y, w, h, frac, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = color;
    if (frac > 0.01) { rr(ctx, x, y, Math.max(h, w * frac), h, h / 2); ctx.fill(); }
  }

  function drawChef(ctx, game, t) {
    var chef = game.chef;
    var bob = chef.walking ? Math.sin(t * 14) * 2 : 0;
    var x = chef.x, y = chef.y + bob;
    ctx.save();
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, chef.y + 24, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Body (apron) and head.
    ctx.fillStyle = '#f2ead8';
    rr(ctx, x - 15, y - 6, 30, 30, 10); ctx.fill();
    ctx.fillStyle = '#e5484d';
    ctx.fillRect(x - 15, y + 8, 30, 6);
    ctx.fillStyle = '#f5c9a0';
    ctx.beginPath(); ctx.arc(x, y - 14, 13, 0, Math.PI * 2); ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x - 8, y - 24, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, y - 24, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 28, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 12, y - 26, 24, 6);
    // Eyes look the way the chef faces.
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(x + chef.dir * 4 - 4, y - 14, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + chef.dir * 4 + 4, y - 14, 2, 0, Math.PI * 2); ctx.fill();
    // Carried item floats above the hat; a carried plate rides on the head.
    if (chef.hands) drawItem(ctx, chef.hands, x, y - 46, 26);
    if (game.carriedPlate) {
      ctx.fillStyle = '#f2ead8';
      ctx.beginPath(); ctx.ellipse(x, y - 42, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
      for (var k = 0; k < game.carriedPlate.length; k++) {
        drawItem(ctx, game.carriedPlate[k], x - 16 + k * 16, y - 48, 15);
      }
    }
    ctx.restore();
  }

  function drawParticles(ctx, game) {
    for (var i = 0; i < game.particles.length; i++) {
      var p = game.particles[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var j = 0; j < game.floaters.length; j++) {
      var f = game.floaters[j];
      ctx.globalAlpha = Math.min(1, f.life);
      text(ctx, f.text, f.x, f.y, 20, f.color, 'center');
    }
    ctx.globalAlpha = 1;
  }

  // --- HUD and order board ----------------------------------------------------
  function drawHUD(ctx, game) {
    ctx.fillStyle = COLORS.hud;
    ctx.fillRect(0, 0, C.W, C.HUD_H);
    ctx.fillStyle = COLORS.hudLine;
    ctx.fillRect(0, C.HUD_H - 2, C.W, 2);
    text(ctx, 'SCORE  ' + game.score, 16, 20, 20, COLORS.text);
    text(ctx, 'SERVED ' + game.served + '   MISSED ' + game.missed, 16, 42, 13, COLORS.dim);
    // Timer: a bar plus big digits; it turns red in the last 10 seconds.
    var frac = game.timeLeft / game.shiftSeconds;
    var tColor = game.timeLeft <= 10 ? '#ff6b6b' : '#ffb347';
    text(ctx, 'TIME', 400, 16, 12, COLORS.dim, 'center');
    bar(ctx, 330, 24, 300, 14, frac, tColor);
    text(ctx, fmtTime(game.timeLeft), 480, 48, 16, tColor, 'center');
    text(ctx, 'LEVEL ' + game.level, 700, 20, 18, COLORS.accent, 'center');
    if (game.combo >= 2) text(ctx, 'COMBO x' + game.combo, 700, 42, 13, '#7ed491', 'center');
    // Pause and mute buttons (top-right corner).
    UI.buttons.pause = { x: 872, y: 10, w: 36, h: 36 };
    UI.buttons.mute = { x: 916, y: 10, w: 36, h: 36 };
    ctx.fillStyle = '#3a2a1e';
    rr(ctx, 872, 10, 36, 36, 6); ctx.fill();
    rr(ctx, 916, 10, 36, 36, 6); ctx.fill();
    ctx.strokeStyle = COLORS.hudLine; ctx.lineWidth = 2;
    rr(ctx, 872, 10, 36, 36, 6); ctx.stroke();
    rr(ctx, 916, 10, 36, 36, 6); ctx.stroke();
    text(ctx, 'II', 890, 29, 14, COLORS.text, 'center');
    text(ctx, game.audio.muted ? 'X' : '♪', 934, 29, 14, COLORS.text, 'center');
  }

  function drawBoard(ctx, game, t) {
    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, C.BOARD_Y, C.W, C.BOARD_H);
    ctx.fillStyle = COLORS.boardEdge;
    ctx.fillRect(0, C.BOARD_Y + C.BOARD_H - 3, C.W, 3);
    text(ctx, 'ORDERS', 16, C.BOARD_Y + 22, 13, '#d8b98a');
    text(ctx, 'serve before the ticket runs out!', 16, C.BOARD_Y + 48, 11, '#a98f68');
    if (game.orders.length === 0) {
      text(ctx, 'No orders yet — the rush is coming…', 480, C.BOARD_Y + 36, 15, '#c9a986', 'center');
      return;
    }
    for (var i = 0; i < game.orders.length; i++) {
      var o = game.orders[i];
      var x = 220 + i * 240, y = C.BOARD_Y + 6, w = 226, h = 60;
      var urgent = o.patience < 12;
      ctx.fillStyle = COLORS.ticket;
      rr(ctx, x, y, w, h, 6); ctx.fill();
      ctx.strokeStyle = urgent ? '#e5484d' : '#c9a86a';
      ctx.lineWidth = urgent ? 3 : 2;
      rr(ctx, x, y, w, h, 6); ctx.stroke();
      text(ctx, o.recipe.name + '  ·  $' + o.recipe.value, x + 10, y + 14, 13, '#3a2a1e');
      for (var k = 0; k < o.recipe.needs.length; k++) {
        drawItem(ctx, o.recipe.needs[k], x + 22 + k * 34, y + 38, 24);
      }
      var frac = Math.max(0, o.patience / o.maxPatience);
      var col = frac > 0.5 ? '#57b25e' : (frac > 0.25 ? '#ffb347' : '#e5484d');
      bar(ctx, x + 10, y + h - 10, w - 20, 6, frac, col);
      if (urgent && Math.sin(t * 8) > 0) {
        text(ctx, '!', x + w - 14, y + 14, 16, '#e5484d', 'center');
      }
    }
  }

  function drawBar(ctx, game) {
    ctx.fillStyle = COLORS.hud;
    ctx.fillRect(0, C.BAR_Y, C.W, C.H - C.BAR_Y);
    ctx.fillStyle = COLORS.hudLine;
    ctx.fillRect(0, C.BAR_Y, C.W, 2);
    // Hands.
    text(ctx, 'HANDS:', 16, C.BAR_Y + 22, 12, COLORS.dim);
    if (game.chef.hands) {
      drawItem(ctx, game.chef.hands, 96, C.BAR_Y + 22, 26);
      text(ctx, ITEMS[game.chef.hands].name, 118, C.BAR_Y + 22, 13, COLORS.text);
    } else {
      text(ctx, 'empty', 96, C.BAR_Y + 22, 13, COLORS.dim);
    }
    // Plate contents.
    text(ctx, 'PLATE:', 250, C.BAR_Y + 22, 12, COLORS.dim);
    var items = game.carriedPlate || game.plate.items;
    if (items.length === 0) {
      text(ctx, 'empty', 316, C.BAR_Y + 22, 13, COLORS.dim);
    } else {
      for (var i = 0; i < items.length; i++) {
        drawItem(ctx, items[i], 330 + i * 30, C.BAR_Y + 22, 24);
      }
    }
    text(ctx, 'Move WASD / arrows · E interact (hold E to chop) · P pause · M mute', 560, C.BAR_Y + 22, 12, COLORS.dim);
  }

  // --- screens ------------------------------------------------------------------
  function drawTitle(ctx, game, input, t) {
    // A warm kitchen backdrop behind the title card.
    drawFloor(ctx, game, t);
    for (var i = 0; i < C.STATIONS.length; i++) drawStation(ctx, game, C.STATIONS[i], t);
    ctx.fillStyle = 'rgba(20,12,8,0.72)';
    ctx.fillRect(0, 0, C.W, C.H);
    text(ctx, 'RUSH KITCHEN', 480, 110, 54, '#ffb347', 'center');
    text(ctx, '— DAPUR KILAT —', 480, 152, 18, COLORS.text, 'center');
    text(ctx, 'Take the order. Chop it. Cook it. Plate it. Serve it before the ticket runs out.', 480, 196, 15, COLORS.dim, 'center');
    text(ctx, 'WASD / arrows to move  ·  E to pick up, chop (hold), cook and serve  ·  Click a station to walk to it', 480, 222, 13, COLORS.dim, 'center');

    // Shift-length buttons.
    var bw = 190, bh = 44, gap = 20;
    var total = bw * 3 + gap * 2;
    var x0 = (C.W - total) / 2;
    for (var s = 0; s < C.SHIFT_OPTIONS.length; s++) {
      var bx = x0 + s * (bw + gap), by = 262;
      var sel = game.shiftIndex === s;
      ctx.fillStyle = sel ? '#ffb347' : '#3a2a1e';
      rr(ctx, bx, by, bw, bh, 8); ctx.fill();
      ctx.strokeStyle = sel ? '#ffd76a' : COLORS.hudLine; ctx.lineWidth = 2;
      rr(ctx, bx, by, bw, bh, 8); ctx.stroke();
      text(ctx, C.SHIFT_OPTIONS[s].label, bx + bw / 2, by + bh / 2 + 1, 15, sel ? '#241812' : COLORS.text, 'center');
      UI.buttons['shift' + s] = { x: bx, y: by, w: bw, h: bh };
    }
    // Start button.
    var sx = C.W / 2 - 110, sy = 336;
    var hover = input.mouseX >= sx && input.mouseX <= sx + 220 && input.mouseY >= sy && input.mouseY <= sy + 54;
    ctx.fillStyle = hover ? '#ffcf6e' : '#ffb347';
    rr(ctx, sx, sy, 220, 54, 10); ctx.fill();
    ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2;
    rr(ctx, sx, sy, 220, 54, 10); ctx.stroke();
    text(ctx, 'START COOKING', 480, sy + 28, 20, '#241812', 'center');
    UI.buttons.start = { x: sx, y: sy, w: 220, h: 54 };

    text(ctx, 'Recipes grow harder as the rush builds — combos pay extra.', 480, 430, 13, COLORS.dim, 'center');
    if (game.best > 0) text(ctx, 'Best score: ' + game.best, 480, 458, 15, '#7ed491', 'center');
    text(ctx, 'Original game · all art drawn in code · sounds synthesized live', 480, 500, 12, '#8a6f52', 'center');
  }

  function drawPaused(ctx, game) {
    ctx.fillStyle = 'rgba(20,12,8,0.7)';
    ctx.fillRect(0, 0, C.W, C.H);
    text(ctx, 'PAUSED', 480, 280, 44, COLORS.text, 'center');
    text(ctx, 'P or click to resume  ·  R to restart the shift', 480, 330, 15, COLORS.dim, 'center');
    UI.buttons.resume = { x: 380, y: 360, w: 200, h: 48 };
    ctx.fillStyle = '#ffb347';
    rr(ctx, 380, 360, 200, 48, 8); ctx.fill();
    text(ctx, 'RESUME', 480, 385, 18, '#241812', 'center');
  }

  function drawOver(ctx, game) {
    var r = game.result || { score: 0, served: 0, missed: 0, bestCombo: 0, level: 1, seconds: 120 };
    ctx.fillStyle = 'rgba(20,12,8,0.78)';
    ctx.fillRect(0, 0, C.W, C.H);
    text(ctx, 'SHIFT OVER!', 480, 140, 48, '#ffb347', 'center');
    text(ctx, 'The kitchen closes — here is how the rush went.', 480, 182, 15, COLORS.dim, 'center');
    var rows = [
      ['Score', '' + r.score],
      ['Dishes served', '' + r.served],
      ['Orders lost', '' + r.missed],
      ['Best combo', 'x' + r.bestCombo],
      ['Level reached', '' + r.level],
    ];
    var y = 232;
    for (var i = 0; i < rows.length; i++) {
      text(ctx, rows[i][0], 340, y, 18, COLORS.dim);
      text(ctx, rows[i][1], 620, y, 18, COLORS.text, 'right');
      y += 36;
    }
    text(ctx, 'Best score: ' + game.best, 480, y + 8, 15, '#7ed491', 'center');
    var sx = C.W / 2 - 110, sy = y + 40;
    ctx.fillStyle = '#ffb347';
    rr(ctx, sx, sy, 220, 54, 10); ctx.fill();
    text(ctx, 'COOK AGAIN  (R)', 480, sy + 28, 18, '#241812', 'center');
    UI.buttons.restart = { x: sx, y: sy, w: 220, h: 54 };
    text(ctx, 'Tip: serve dishes in a row without losing an order to build a combo.', 480, sy + 84, 13, COLORS.dim, 'center');
  }

  // --- top-level ---------------------------------------------------------------
  function render(ctx, game, input, t) {
    UI.buttons = {};
    ctx.clearRect(0, 0, C.W, C.H);
    if (game.screen === 'title') {
      drawTitle(ctx, game, input, t);
      return;
    }
    drawFloor(ctx, game, t);
    for (var i = 0; i < C.STATIONS.length; i++) drawStation(ctx, game, C.STATIONS[i], t);
    drawChef(ctx, game, t);
    drawParticles(ctx, game);
    drawHUD(ctx, game);
    drawBoard(ctx, game, t);
    drawBar(ctx, game);
    if (game.screen === 'paused') drawPaused(ctx, game);
    if (game.screen === 'over') drawOver(ctx, game);
  }

  global.RK_RENDER = { render: render, drawItem: drawItem, fmtTime: fmtTime };
})(typeof window !== 'undefined' ? window : globalThis);
