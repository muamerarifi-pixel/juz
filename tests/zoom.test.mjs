import { test } from 'node:test';
import assert from 'node:assert/strict';

// Pure math functions for font size pinch scaling
export function calcFontPinchSize(startSize, startDist, curDist, min = 22, max = 50) {
  if (startDist <= 0) return startSize;
  const ratio = curDist / startDist;
  return Math.max(min, Math.min(max, startSize * ratio));
}

export function calcProportionalTrSize(startTrSize, startSize, targetSize, min = 14, max = 26) {
  const diff = targetSize - startSize;
  return Math.max(min, Math.min(max, Math.round(startTrSize + diff * 0.5)));
}

export function calcAnchorOffset(curTop, anchorTop) {
  return curTop - anchorTop;
}

test('calcFontPinchSize: scales proportionally and clamps to bounds', () => {
  assert.equal(calcFontPinchSize(30, 100, 100), 30);
  assert.equal(calcFontPinchSize(30, 100, 150), 45); // scales up
  assert.equal(calcFontPinchSize(30, 100, 200), 50); // clamps to max 50
  assert.equal(calcFontPinchSize(30, 100, 50), 22);  // clamps to min 22
  assert.equal(calcFontPinchSize(30, 0, 100), 30);   // safe with startDist = 0
});

test('calcProportionalTrSize: scales translation font size in harmony with Arabic text (2:1 ratio)', () => {
  // At default 30 -> 17
  assert.equal(calcProportionalTrSize(17, 30, 30), 17);
  // Scale up to 34 (+4 Arabic) -> +2 Albanian = 19
  assert.equal(calcProportionalTrSize(17, 30, 34), 19);
  // Scale down to 26 (-4 Arabic) -> -2 Albanian = 15
  assert.equal(calcProportionalTrSize(17, 30, 26), 15);
  // Max clamp
  assert.equal(calcProportionalTrSize(17, 30, 50), 26);
  // Min clamp
  assert.equal(calcProportionalTrSize(17, 30, 22), 14);
});

test('calcAnchorOffset: accurately detects vertical displacement of anchor element', () => {
  assert.equal(calcAnchorOffset(150, 120), 30);
  assert.equal(calcAnchorOffset(100, 120), -20);
  assert.equal(calcAnchorOffset(120, 120), 0);
});
