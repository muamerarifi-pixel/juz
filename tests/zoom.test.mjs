import { test } from 'node:test';
import assert from 'node:assert/strict';

// Import pure math functions for pinch to zoom
export function calcPinchScale(s0, d0, d, min = 0.75, max = 4.5) {
  if (d0 <= 0) return s0;
  const ratio = d / d0;
  return Math.max(min, Math.min(max, s0 * ratio));
}

export function calcFocalPoint(cx, cy, L0, T0, s, tx, ty) {
  return {
    lx: (cx - L0 - tx) / s,
    ly: (cy - T0 - ty) / s,
  };
}

export function calcTranslate(cx, cy, L0, T0, lx, ly, s) {
  return {
    tx: cx - L0 - lx * s,
    ty: cy - T0 - ly * s,
  };
}

export function clampTranslate(tx, ty, s, W0, H0, L0, T0, cRect) {
  const Ws = W0 * s;
  const Hs = H0 * s;
  let minX, maxX, minY, maxY;

  if (Ws > cRect.width) {
    minX = cRect.right - L0 - Ws;
    maxX = cRect.left - L0;
  } else {
    minX = maxX = cRect.left - L0 + (cRect.width - Ws) / 2;
  }

  if (Hs > cRect.height) {
    minY = cRect.bottom - T0 - Hs;
    maxY = cRect.top - T0;
  } else {
    minY = maxY = cRect.top - T0 + Math.max(0, (cRect.height - Hs) / 2);
  }

  return {
    tx: Math.max(minX, Math.min(maxX, tx)),
    ty: Math.max(minY, Math.min(maxY, ty)),
    minX,
    maxX,
    minY,
    maxY,
  };
}

test('calcPinchScale: scales proportionally and clamps to bounds', () => {
  assert.equal(calcPinchScale(1.0, 100, 200), 2.0);
  assert.equal(calcPinchScale(2.0, 100, 50), 1.0);
  assert.equal(calcPinchScale(1.0, 100, 1000), 4.5); // clamps max
  assert.equal(calcPinchScale(1.0, 100, 10), 0.75); // clamps min
  assert.equal(calcPinchScale(1.5, 0, 100), 1.5); // safe with d0=0
});

test('calcFocalPoint and calcTranslate: keeps focal point stationary during zoom', () => {
  const L0 = 50, T0 = 60, s0 = 1.0, tx0 = 0, ty0 = 0;
  const cx = 250, cy = 360;

  // Focal point in local coordinates at scale 1
  const { lx, ly } = calcFocalPoint(cx, cy, L0, T0, s0, tx0, ty0);
  assert.equal(lx, 200);
  assert.equal(ly, 300);

  // Scale to 2.5x
  const s1 = 2.5;
  const { tx: tx1, ty: ty1 } = calcTranslate(cx, cy, L0, T0, lx, ly, s1);

  // Screen coordinate of (lx, ly) at new scale and translation
  const screenX = L0 + tx1 + lx * s1;
  const screenY = T0 + ty1 + ly * s1;

  assert.equal(Math.round(screenX), cx);
  assert.equal(Math.round(screenY), cy);
});

test('clampTranslate: bounds in paged mode when scaled content exceeds container', () => {
  const cRect = { left: 0, top: 64, right: 380, bottom: 750, width: 380, height: 686 };
  const L0 = 0, T0 = 64, W0 = 380, H0 = 686;
  const s = 2.0;

  // With s=2, Ws = 760, Hs = 1372
  const bounds = clampTranslate(-200, -300, s, W0, H0, L0, T0, cRect);
  assert.equal(bounds.maxX, 0);
  assert.equal(bounds.minX, -380);
  assert.equal(bounds.maxY, 0);
  assert.equal(bounds.minY, -686);
  assert.equal(bounds.tx, -200);
  assert.equal(bounds.ty, -300);

  // Overscroll right/bottom clamped
  const overRight = clampTranslate(-500, -800, s, W0, H0, L0, T0, cRect);
  assert.equal(overRight.tx, -380);
  assert.equal(overRight.ty, -686);

  // Overscroll left/top clamped
  const overLeft = clampTranslate(100, 100, s, W0, H0, L0, T0, cRect);
  assert.equal(overLeft.tx, 0);
  assert.equal(overLeft.ty, 0);
});

test('clampTranslate: centers content when scaled content is smaller than container', () => {
  const cRect = { left: 0, top: 60, right: 1200, bottom: 800, width: 1200, height: 740 };
  const L0 = 210, T0 = 60, W0 = 780, H0 = 600;
  const s = 1.2;
  // Ws = 936 < 1200
  const bounds = clampTranslate(0, 0, s, W0, H0, L0, T0, cRect);
  // centered horizontally: left at (1200 - 936)/2 = 132, so tx = 132 - 210 = -78
  assert.equal(bounds.tx, -78);
  assert.equal(L0 + bounds.tx, 132);
});
