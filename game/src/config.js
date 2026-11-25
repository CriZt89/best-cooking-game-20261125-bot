// Rush Kitchen — shared constants: canvas, stations, recipes, tuning.
// One clear job: every number the rest of the game agrees on lives here.
(function (global) {
  'use strict';

  var W = 960;
  var H = 640;

  // --- layout -------------------------------------------------------------
  var HUD_H = 56;            // top bar: score, timer, level
  var BOARD_Y = 64;          // order board strip
  var BOARD_H = 72;
  var FLOOR_Y = 148;         // kitchen floor starts here
  var FLOOR_H = 440;
  var BAR_Y = 596;           // bottom bar: hands, plate, hints

  // Stations are rectangles the chef walks up to. `cx, cy` is the
  // interaction point; `x, y, w, h` is the drawn counter.
  var STATIONS = [
    { id: 'bin-tomato', kind: 'bin', item: 'tomato', label: 'TOMATO',
      x: 24, y: 168, w: 110, h: 76, cx: 79, cy: 206 },
    { id: 'bin-lettuce', kind: 'bin', item: 'lettuce', label: 'LETTUCE',
      x: 24, y: 268, w: 110, h: 76, cx: 79, cy: 306 },
    { id: 'bin-bun', kind: 'bin', item: 'bun', label: 'BUN',
      x: 24, y: 368, w: 110, h: 76, cx: 79, cy: 406 },
    { id: 'bin-patty', kind: 'bin', item: 'patty_raw', label: 'PATTY',
      x: 826, y: 168, w: 110, h: 76, cx: 881, cy: 206 },
    { id: 'bin-cheese', kind: 'bin', item: 'cheese', label: 'CHEESE',
      x: 826, y: 268, w: 110, h: 76, cx: 881, cy: 306 },
    { id: 'board', kind: 'board', label: 'CHOP',
      x: 190, y: 492, w: 150, h: 84, cx: 265, cy: 534 },
    { id: 'stove', kind: 'stove', label: 'STOVE',
      x: 405, y: 492, w: 150, h: 84, cx: 480, cy: 534 },
    { id: 'plate', kind: 'plate', label: 'PLATE',
      x: 620, y: 492, w: 150, h: 84, cx: 695, cy: 534 },
    { id: 'window', kind: 'window', label: 'SERVE',
      x: 380, y: 168, w: 200, h: 76, cx: 480, cy: 206 },
  ];

  var REACH = 92;            // px from a station centre to interact
  var CHEF_SPEED = 265;      // px per second
  var CHEF_R = 20;

  // --- items ---------------------------------------------------------------
  // Every item: what it looks like, what it can become, how it is drawn.
  var ITEMS = {
    tomato:         { name: 'Tomato',        color: '#e5484d', chop: 'tomato_chopped' },
    lettuce:        { name: 'Lettuce',       color: '#57b25e', chop: 'lettuce_chopped' },
    bun:            { name: 'Bun',           color: '#e8b25c' },
    patty_raw:      { name: 'Raw Patty',     color: '#c98a7a', cook: 'patty_cooked' },
    cheese:         { name: 'Cheese',        color: '#f5c542' },
    tomato_chopped: { name: 'Chopped Tomato', color: '#ef6a5e' },
    lettuce_chopped:{ name: 'Chopped Lettuce', color: '#7cc47f' },
    patty_cooked:   { name: 'Cooked Patty',  color: '#8a5a3b' },
  };

  // --- recipes --------------------------------------------------------------
  var RECIPES = [
    { id: 'salad',   name: 'Salad Segar',     needs: ['tomato_chopped', 'lettuce_chopped'], value: 30 },
    { id: 'veggie',  name: 'Veggie Sandwich', needs: ['bun', 'tomato_chopped', 'lettuce_chopped'], value: 40 },
    { id: 'burger',  name: 'Burger Klasik',   needs: ['bun', 'patty_cooked', 'cheese'], value: 50 },
    { id: 'cheese',  name: 'Cheese Burger',   needs: ['bun', 'patty_cooked', 'cheese', 'tomato_chopped'], value: 70 },
  ];

  // --- tuning ----------------------------------------------------------------
  var SHIFT_OPTIONS = [
    { id: 'quick',    label: 'QUICK 60s',    seconds: 60 },
    { id: 'standard', label: 'STANDARD 120s', seconds: 120 },
    { id: 'marathon', label: 'MARATHON 180s', seconds: 180 },
  ];
  var CHOP_SECONDS = 1.4;    // hold-to-chop time
  var COOK_SECONDS = 3.2;    // patty on the stove
  var SPAWN_FIRST = 2.0;     // first order appears after this many seconds
  var SPAWN_BASE = 13;       // seconds between orders at level 1
  var SPAWN_MIN = 7;
  var PATIENCE_BASE = 52;    // seconds an order waits at level 1
  var PATIENCE_MIN = 30;
  var MAX_ORDERS = 3;
  var LEVEL_EVERY = 4;       // orders served per level-up

  // --- palette ---------------------------------------------------------------
  var COLORS = {
    floor: '#3a2a1e', floorLine: '#2c1f15', wall: '#241812',
    counter: '#8a5a33', counterTop: '#b07a45', counterEdge: '#5f3d20',
    board: '#2e2118', boardEdge: '#57402a', ticket: '#fff3d6',
    hud: '#1e130c', hudLine: '#4a3220', text: '#f5e6c8', dim: '#c9a986',
    accent: '#ffb347', good: '#7ed491', bad: '#ff6b6b',
  };

  global.RK_CONFIG = {
    W: W, H: H, HUD_H: HUD_H, BOARD_Y: BOARD_Y, BOARD_H: BOARD_H,
    FLOOR_Y: FLOOR_Y, FLOOR_H: FLOOR_H, BAR_Y: BAR_Y,
    STATIONS: STATIONS, REACH: REACH, CHEF_SPEED: CHEF_SPEED, CHEF_R: CHEF_R,
    ITEMS: ITEMS, RECIPES: RECIPES, SHIFT_OPTIONS: SHIFT_OPTIONS,
    CHOP_SECONDS: CHOP_SECONDS, COOK_SECONDS: COOK_SECONDS,
    SPAWN_FIRST: SPAWN_FIRST, SPAWN_BASE: SPAWN_BASE, SPAWN_MIN: SPAWN_MIN,
    PATIENCE_BASE: PATIENCE_BASE, PATIENCE_MIN: PATIENCE_MIN,
    MAX_ORDERS: MAX_ORDERS, LEVEL_EVERY: LEVEL_EVERY, COLORS: COLORS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
