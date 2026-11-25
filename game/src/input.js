// Rush Kitchen — input. One clear job: turn keyboard and mouse events
// into a small state object the game loop reads each frame.
(function (global) {
  'use strict';

  function Input(canvas) {
    this.keys = {};
    this.pressed = {};      // keys pressed since the last frame was read
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.clicked = null;    // {x, y} of the last click, cleared each frame
    this.canvas = canvas;
    this.attach(canvas);
  }

  Input.prototype.attach = function (canvas) {
    var self = this;
    global.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) {
        e.preventDefault();
      }
      if (!self.keys[k]) self.pressed[k] = true;
      self.keys[k] = true;
    });
    global.addEventListener('keyup', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      self.keys[k] = false;
    });
    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      self.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      self.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', function (e) {
      var r = canvas.getBoundingClientRect();
      self.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      self.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
      self.mouseDown = true;
      self.clicked = { x: self.mouseX, y: self.mouseY };
    });
    global.addEventListener('mouseup', function () { self.mouseDown = false; });
    // Keep the chef from drifting when the window loses focus.
    global.addEventListener('blur', function () { self.keys = {}; });
  };

  // Movement vector from WASD or the arrow keys, normalised.
  Input.prototype.moveVector = function () {
    var x = 0, y = 0;
    if (this.keys['a'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['d'] || this.keys['ArrowRight']) x += 1;
    if (this.keys['w'] || this.keys['ArrowUp']) y -= 1;
    if (this.keys['s'] || this.keys['ArrowDown']) y += 1;
    if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
    return { x: x, y: y };
  };

  Input.prototype.wasPressed = function (k) { return !!this.pressed[k]; };

  // Called at the end of every frame: one-shot presses and clicks clear.
  Input.prototype.endFrame = function () {
    this.pressed = {};
    this.clicked = null;
  };

  global.RK_Input = Input;
})(typeof window !== 'undefined' ? window : globalThis);
