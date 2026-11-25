// Rush Kitchen — game state and rules. One clear job: everything that
// changes while playing (chef, orders, stations, plate, score) and the
// rules for interacting with the kitchen.
(function (global) {
  'use strict';

  var C = global.RK_CONFIG;
  var ITEMS = C.ITEMS;
  var RECIPES = C.RECIPES;

  function sameMultiset(a, b) {
    if (a.length !== b.length) return false;
    var counts = {};
    a.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    for (var i = 0; i < b.length; i++) {
      if (!counts[b[i]]) return false;
      counts[b[i]] -= 1;
    }
    return true;
  }

  function pickRecipe(level) {
    // Early levels only serve the two quickest dishes; harder recipes
    // unlock as the rush grows.
    var pool = level >= 3 ? RECIPES : (level >= 2 ? RECIPES.slice(0, 3) : RECIPES.slice(0, 2));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function Game(audio) {
    this.audio = audio;
    this.screen = 'title';   // title | playing | paused | over
    this.shiftIndex = 1;     // STANDARD 120s by default
    this.shiftSeconds = 120;
    this.timeLeft = 120;
    this.elapsed = 0;
    this.score = 0;
    this.served = 0;
    this.missed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.level = 1;
    this.orders = [];
    this.nextOrderId = 1;
    this.spawnIn = C.SPAWN_FIRST;
    this.chef = { x: 480, y: 350, dir: 1, hands: null, walking: false, target: null };
    this.board = { item: null, progress: 0, chopping: false };
    this.stove = { item: null, progress: 0 };
    this.plate = { items: [] };
    this.carriedPlate = null; // plate items while the chef carries the plate
    this.particles = [];
    this.floaters = [];       // floating score text
    this.lastTickSecond = -1;
    this.result = null;      // filled when the shift ends
    this.best = 0;
  }

  Game.prototype.startShift = function (shiftIndex) {
    this.shiftIndex = shiftIndex;
    this.shiftSeconds = C.SHIFT_OPTIONS[shiftIndex].seconds;
    this.timeLeft = this.shiftSeconds;
    this.elapsed = 0;
    this.score = 0;
    this.served = 0;
    this.missed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.level = 1;
    this.orders = [];
    this.spawnIn = C.SPAWN_FIRST;
    this.chef = { x: 480, y: 350, dir: 1, hands: null, walking: false, target: null };
    this.board = { item: null, progress: 0, chopping: false };
    this.stove = { item: null, progress: 0 };
    this.plate = { items: [] };
    this.carriedPlate = null;
    this.particles = [];
    this.floaters = [];
    this.result = null;
    this.screen = 'playing';
  };

  Game.prototype.spawnInterval = function () {
    return Math.max(C.SPAWN_MIN, C.SPAWN_BASE - (this.level - 1) * 2);
  };

  Game.prototype.patience = function () {
    return Math.max(C.PATIENCE_MIN, C.PATIENCE_BASE - (this.level - 1) * 6);
  };

  Game.prototype.addOrder = function () {
    var recipe = pickRecipe(this.level);
    this.orders.push({
      id: this.nextOrderId++,
      recipe: recipe,
      patience: this.patience(),
      maxPatience: this.patience(),
      born: this.elapsed,
    });
  };

  Game.prototype.levelFor = function (served) {
    return 1 + Math.floor(served / C.LEVEL_EVERY);
  };

  Game.prototype.burst = function (x, y, color, n) {
    for (var i = 0; i < (n || 10); i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 120;
      this.particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.5 + Math.random() * 0.4, max: 0.9, color: color, r: 2 + Math.random() * 3,
      });
    }
  };

  Game.prototype.floater = function (x, y, text, color) {
    this.floaters.push({ x: x, y: y, text: text, color: color || '#ffe9a8', life: 1.1 });
  };

  // --- interaction ---------------------------------------------------------
  Game.prototype.nearestStation = function () {
    var best = null, bestD = Infinity;
    for (var i = 0; i < C.STATIONS.length; i++) {
      var s = C.STATIONS[i];
      var dx = this.chef.x - s.cx, dy = this.chef.y - s.cy;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = s; }
    }
    return bestD <= C.REACH ? best : null;
  };

  // Interact with the station the chef was sent to (a click's intent wins
  // over proximity), or with the nearest station for a keyboard press.
  Game.prototype.interact = function (station) {
    var st = station || this.nearestStation();
    if (!st) return;
    var chef = this.chef;
    var audio = this.audio;

    if (st.kind === 'bin') {
      if (chef.hands) return; // hands full
      chef.hands = st.item;
      audio.pickup();
      this.burst(st.cx, st.cy - 20, ITEMS[st.item].color, 6);
      return;
    }

    if (st.kind === 'board') {
      if (this.board.item) {
        // A finished chop waits on the board until hands are free.
        if (this.board.progress >= 1 && !chef.hands) {
          chef.hands = this.board.item;
          this.board.item = null;
          this.board.progress = 0;
          audio.pickup();
        }
        // Otherwise holding E chops it (see update()).
        return;
      }
      if (chef.hands && ITEMS[chef.hands].chop) {
        this.board.item = chef.hands;
        this.board.progress = 0;
        chef.hands = null;
        audio.place();
      }
      return;
    }

    if (st.kind === 'stove') {
      if (this.stove.item) {
        // A finished patty waits on the stove until hands are free.
        if (this.stove.progress >= 1 && !chef.hands) {
          chef.hands = this.stove.item;
          this.stove.item = null;
          this.stove.progress = 0;
          audio.pickup();
        }
        return;
      }
      if (chef.hands && ITEMS[chef.hands].cook) {
        this.stove.item = chef.hands;
        this.stove.progress = 0;
        chef.hands = null;
        audio.place();
        audio.startSizzle();
      }
      return;
    }

    if (st.kind === 'plate') {
      // Pick up a finished plate, or add the carried item to it.
      if (this.carriedPlate) {
        if (this.plate.items.length === 0) {
          this.plate.items = this.carriedPlate;
          this.carriedPlate = null;
          audio.place();
        }
        return;
      }
      if (chef.hands) {
        if (this.plate.items.length < 4) {
          this.plate.items.push(chef.hands);
          chef.hands = null;
          audio.place();
        }
        return;
      }
      if (this.plate.items.length > 0) {
        this.carriedPlate = this.plate.items;
        this.plate.items = [];
        audio.pickup();
      }
      return;
    }

    if (st.kind === 'window') {
      if (!this.carriedPlate || this.carriedPlate.length === 0) return;
      var match = null;
      for (var i = 0; i < this.orders.length; i++) {
        if (sameMultiset(this.carriedPlate, this.orders[i].recipe.needs)) {
          match = this.orders[i];
          break;
        }
      }
      if (match) {
        var timeBonus = Math.round(match.patience * 0.5);
        var comboBonus = this.combo * 5;
        var gained = match.recipe.value + timeBonus + comboBonus;
        this.score += gained;
        this.served += 1;
        this.combo += 1;
        if (this.combo > this.bestCombo) this.bestCombo = this.combo;
        this.orders.splice(this.orders.indexOf(match), 1);
        this.floater(st.cx, st.cy - 30, '+' + gained, '#7ed491');
        this.burst(st.cx, st.cy - 10, '#ffd76a', 16);
        audio.serve();
        var newLevel = this.levelFor(this.served);
        if (newLevel > this.level) {
          this.level = newLevel;
          this.floater(480, 200, 'LEVEL ' + newLevel + ' — RUSH!', '#ffb347');
          audio.levelUp();
        }
      } else {
        this.combo = 0;
        this.floater(st.cx, st.cy - 30, 'WRONG DISH!', '#ff6b6b');
        audio.reject();
      }
      this.carriedPlate = null;
    }
  };

  // --- per-frame update ------------------------------------------------------
  Game.prototype.update = function (dt, input) {
    if (this.screen !== 'playing') return;

    this.elapsed += dt;
    this.timeLeft = Math.max(0, this.shiftSeconds - this.elapsed);

    // Last-ten-seconds tick.
    var whole = Math.ceil(this.timeLeft);
    if (this.timeLeft <= 10.5 && whole !== this.lastTickSecond && this.timeLeft > 0) {
      this.lastTickSecond = whole;
      this.audio.tick();
    }
    if (this.timeLeft <= 0) { this.endShift(); return; }

    // Orders spawn and age.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      if (this.orders.length < C.MAX_ORDERS) this.addOrder();
      this.spawnIn = this.spawnInterval();
    }
    for (var i = this.orders.length - 1; i >= 0; i--) {
      var o = this.orders[i];
      o.patience -= dt;
      if (o.patience <= 0) {
        this.orders.splice(i, 1);
        this.missed += 1;
        this.combo = 0;
        this.floater(480, 160, 'ORDER LOST!', '#ff6b6b');
        this.audio.expire();
      }
    }

    // Chopping: hold E/Space near the board while an item sits on it.
    var near = this.nearestStation();
    var holding = input.keys['e'] || input.keys[' '];
    if (this.board.item && this.board.progress < 1 && near && near.kind === 'board' && holding) {
      this.board.progress += dt / C.CHOP_SECONDS;
      this.board.chopping = true;
      if (Math.random() < dt * 6) this.audio.chop();
      if (Math.random() < dt * 8) {
        this.burst(near.cx, near.cy - 10, '#fff3d6', 2);
      }
      if (this.board.progress >= 1) {
        var done = ITEMS[this.board.item].chop;
        this.board.progress = 1;
        this.board.chopping = false;
        this.audio.chopDone();
        if (!this.chef.hands) {
          this.chef.hands = done;
          this.board.item = null;
          this.board.progress = 0;
          this.burst(near.cx, near.cy - 10, ITEMS[done].color, 8);
        } else {
          // Hands full: the chopped item waits on the board.
          this.board.item = done;
        }
      }
    } else {
      this.board.chopping = false;
    }

    // Cooking: a raw patty cooks on its own once placed. A finished
    // patty stays on the stove (progress 1) until the chef picks it up.
    if (this.stove.item && ITEMS[this.stove.item].cook && this.stove.progress < 1) {
      this.stove.progress += dt / C.COOK_SECONDS;
      if (this.stove.progress >= 1) {
        var cooked = ITEMS[this.stove.item].cook;
        this.stove.progress = 1;
        this.audio.stopSizzle();
        this.audio.cookDone();
        if (!this.chef.hands) {
          this.chef.hands = cooked;
          this.stove.item = null;
          this.stove.progress = 0;
          this.burst(480, 500, '#ffb347', 8);
        } else {
          this.stove.item = cooked;
        }
      }
    }

    // Chef movement: keys, or click-to-walk.
    var mv = input.moveVector();
    var chef = this.chef;
    if (mv.x !== 0 || mv.y !== 0) {
      chef.target = null;
      chef.x += mv.x * C.CHEF_SPEED * dt;
      chef.y += mv.y * C.CHEF_SPEED * dt;
      chef.dir = mv.x < 0 ? -1 : (mv.x > 0 ? 1 : chef.dir);
      chef.walking = true;
    } else if (chef.target) {
      var dx = chef.target.x - chef.x, dy = chef.target.y - chef.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 6) {
        chef.target = null;
        chef.walking = false;
      } else {
        chef.x += (dx / dist) * C.CHEF_SPEED * dt;
        chef.y += (dy / dist) * C.CHEF_SPEED * dt;
        chef.dir = dx < 0 ? -1 : 1;
        chef.walking = true;
      }
    } else {
      chef.walking = false;
    }
    // Keep the chef inside the kitchen floor.
    chef.x = Math.max(150, Math.min(810, chef.x));
    chef.y = Math.max(170, Math.min(560, chef.y));

    // Particles and floaters age out.
    for (var p = this.particles.length - 1; p >= 0; p--) {
      var pt = this.particles[p];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 260 * dt;
      if (pt.life <= 0) this.particles.splice(p, 1);
    }
    for (var f = this.floaters.length - 1; f >= 0; f--) {
      var fl = this.floaters[f];
      fl.life -= dt;
      fl.y -= 34 * dt;
      if (fl.life <= 0) this.floaters.splice(f, 1);
    }
  };

  Game.prototype.endShift = function () {
    this.screen = 'over';
    this.audio.stopSizzle();
    this.audio.gameOver();
    this.result = {
      score: this.score,
      served: this.served,
      missed: this.missed,
      bestCombo: this.bestCombo,
      level: this.level,
      seconds: this.shiftSeconds,
    };
    if (this.score > this.best) this.best = this.score;
  };

  Game.prototype.togglePause = function () {
    if (this.screen === 'playing') {
      this.screen = 'paused';
      this.audio.stopSizzle();
    } else if (this.screen === 'paused') {
      this.screen = 'playing';
    }
  };

  global.RK_Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
