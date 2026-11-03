import { test } from 'node:test';
import assert from 'node:assert/strict';

// Test simulated DOM pinch and wheel gestures
test('Simulated pinch zoom state transitions', () => {
  // Mock element
  const style = {};
  const classes = new Set();
  const el = {
    classList: {
      add: (c) => classes.add(c),
      remove: (...cs) => cs.forEach((c) => classes.delete(c)),
      contains: (c) => classes.has(c),
    },
    style,
    getBoundingClientRect: () => ({ left: 20, top: 60, width: 360, height: 600 }),
    scrollHeight: 800,
  };

  const PZ = {
    el: null,
    s: 1,
    tx: 0,
    ty: 0,
    pinching: false,
    panning: false,
    dragged: false,
    d0: 0,
    s0: 1,
    tx0: 0,
    ty0: 0,
    lx: 0,
    ly: 0,
    L0: 0,
    T0: 0,
    W0: 0,
    H0: 0,
    px: 0,
    py: 0,
    lastAt: 0,
  };

  function initPZ(targetEl, cx, cy) {
    PZ.el = targetEl;
    const rect = targetEl.getBoundingClientRect();
    PZ.L0 = rect.left - PZ.tx;
    PZ.T0 = rect.top - PZ.ty;
    PZ.W0 = rect.width / PZ.s;
    PZ.H0 = Math.max(rect.height / PZ.s, targetEl.scrollHeight || 0);
    PZ.s0 = PZ.s;
    PZ.tx0 = PZ.tx;
    PZ.ty0 = PZ.ty;
    PZ.lx = (cx - PZ.L0 - PZ.tx) / PZ.s;
    PZ.ly = (cy - PZ.T0 - PZ.ty) / PZ.s;
  }

  function applyTransform() {
    if (!PZ.el) return;
    if (PZ.s > 1.02) {
      PZ.el.classList.add('zoomed');
      PZ.el.style.transform = `translate3d(${PZ.tx.toFixed(1)}px, ${PZ.ty.toFixed(1)}px, 0) scale(${PZ.s.toFixed(4)})`;
    } else {
      PZ.el.classList.remove('zoomed', 'panning');
      PZ.el.style.transform = '';
      PZ.el = null;
    }
  }

  function resetZoom() {
    if (!PZ.el && PZ.s <= 1.02) return;
    PZ.s = 1;
    PZ.tx = 0;
    PZ.ty = 0;
    applyTransform();
  }

  // 1. Initial state
  assert.equal(PZ.s, 1);
  assert.equal(PZ.el, null);

  // 2. Touchstart with 2 fingers at cx=200, cy=300
  initPZ(el, 200, 300);
  PZ.d0 = 100;
  PZ.pinching = true;

  assert.equal(PZ.el, el);
  assert.equal(PZ.L0, 20);
  assert.equal(PZ.T0, 60);
  assert.equal(PZ.lx, 180);
  assert.equal(PZ.ly, 240);

  // 3. Touchmove: fingers spread to d=200 (2x zoom)
  const d = 200;
  const ratio = d / PZ.d0;
  PZ.s = PZ.s0 * ratio; // 2.0
  const cx = 200, cy = 300;
  PZ.tx = cx - PZ.L0 - PZ.lx * PZ.s; // 200 - 20 - 180*2 = 180 - 360 = -180
  PZ.ty = cy - PZ.T0 - PZ.ly * PZ.s; // 300 - 60 - 240*2 = 240 - 480 = -240
  applyTransform();

  assert.equal(PZ.s, 2);
  assert.equal(PZ.tx, -180);
  assert.equal(PZ.ty, -240);
  assert.equal(el.classList.contains('zoomed'), true);
  assert.equal(style.transform, 'translate3d(-180.0px, -240.0px, 0) scale(2.0000)');

  // 4. One-finger pan while zoomed: move by dx=+30, dy=+40
  PZ.tx += 30;
  PZ.ty += 40;
  applyTransform();

  assert.equal(PZ.tx, -150);
  assert.equal(PZ.ty, -200);
  assert.equal(style.transform, 'translate3d(-150.0px, -200.0px, 0) scale(2.0000)');

  // 5. Touchpad pinch (wheel with ctrlKey) to zoom in further
  const deltaY = -50;
  const factor = Math.exp(-deltaY * 0.008);
  const newScale = PZ.s * factor;
  PZ.s = newScale;
  PZ.tx = cx - PZ.L0 - PZ.lx * newScale;
  PZ.ty = cy - PZ.T0 - PZ.ly * newScale;
  applyTransform();

  assert.ok(PZ.s > 2.0);
  assert.equal(el.classList.contains('zoomed'), true);

  // 6. Reset zoom (e.g. Escape or double-tap)
  resetZoom();
  assert.equal(PZ.s, 1);
  assert.equal(PZ.el, null);
  assert.equal(el.classList.contains('zoomed'), false);
  assert.equal(style.transform, '');
});
