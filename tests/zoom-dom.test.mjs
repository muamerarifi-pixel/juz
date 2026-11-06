import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Simulated font pinch scaling state transitions, CSS variable updates, and anchor stabilization', () => {
  const cssVars = {};
  const settings = { size: 30, trSize: 17 };
  let savedSettings = null;

  const root = {
    style: {
      setProperty: (k, v) => { cssVars[k] = v; },
      getPropertyValue: (k) => cssVars[k] || '',
    },
  };

  let scrollByAmount = 0;
  let pagedScrollTop = 0;
  let isPaged = false;

  const pgEl = {
    get scrollTop() { return pagedScrollTop; },
    set scrollTop(v) { pagedScrollTop = v; },
  };

  const anchorEl = {
    isConnected: true,
    top: 150,
    getBoundingClientRect: () => ({ top: anchorEl.top }),
    closest: (sel) => (sel === '.pg' ? pgEl : null),
  };

  const FSZ = {
    pinching: false,
    startDist: 0,
    startSize: 30,
    startTrSize: 17,
    anchorEl: null,
    anchorTop: 0,
    moved: false,
    lastAt: 0,
  };

  function updateFontPinch(targetSize, targetTrSize) {
    targetSize = Math.max(22, Math.min(50, targetSize));
    targetTrSize = Math.max(14, Math.min(26, targetTrSize));

    root.style.setProperty('--ar-size', `${targetSize.toFixed(1)}px`);
    root.style.setProperty('--tr-size', `${targetTrSize.toFixed(1)}px`);

    if (FSZ.anchorEl && FSZ.anchorEl.isConnected) {
      const curTop = FSZ.anchorEl.getBoundingClientRect().top;
      const diff = curTop - FSZ.anchorTop;
      if (Math.abs(diff) > 0.5) {
        if (isPaged) {
          const pg = FSZ.anchorEl.closest('.pg');
          if (pg) pg.scrollTop += diff;
        } else {
          scrollByAmount += diff;
        }
      }
    }
  }

  function commitFontPinch() {
    const rawSize = parseFloat(root.style.getPropertyValue('--ar-size')) || settings.size;
    const rawTr = parseFloat(root.style.getPropertyValue('--tr-size')) || settings.trSize;
    settings.size = Math.round(Math.max(22, Math.min(50, rawSize)));
    settings.trSize = Math.round(Math.max(14, Math.min(26, rawTr)));
    savedSettings = { ...settings };
  }

  // 1. Initial State
  assert.equal(FSZ.pinching, false);
  assert.equal(settings.size, 30);
  assert.equal(settings.trSize, 17);

  // 2. Touchstart with 2 fingers
  FSZ.pinching = true;
  FSZ.moved = false;
  FSZ.startDist = 100;
  FSZ.startSize = settings.size;
  FSZ.startTrSize = settings.trSize;
  FSZ.anchorEl = anchorEl;
  FSZ.anchorTop = anchorEl.getBoundingClientRect().top; // 150
  FSZ.lastAt = Date.now();

  assert.equal(FSZ.pinching, true);
  assert.equal(FSZ.startSize, 30);
  assert.equal(FSZ.anchorTop, 150);

  // 3. Touchmove: fingers spread to 120px (ratio = 1.2)
  const dist1 = 120;
  const ratio1 = dist1 / FSZ.startDist; // 1.2
  const targetSize1 = Math.max(22, Math.min(50, FSZ.startSize * ratio1)); // 36
  const targetTrSize1 = Math.max(14, Math.min(26, FSZ.startTrSize + (targetSize1 - FSZ.startSize) * 0.5)); // 20

  // Anchor element displaced downwards due to larger font
  anchorEl.top = 175; // displaced by +25px
  updateFontPinch(targetSize1, targetTrSize1);

  assert.equal(cssVars['--ar-size'], '36.0px');
  assert.equal(cssVars['--tr-size'], '20.0px');
  assert.equal(scrollByAmount, 25); // corrected by +25px

  // 4. Touchend: commit
  FSZ.pinching = false;
  commitFontPinch();

  assert.equal(settings.size, 36);
  assert.equal(settings.trSize, 20);
  assert.deepEqual(savedSettings, { size: 36, trSize: 20 });

  // 5. Test in Paged Mode
  isPaged = true;
  FSZ.pinching = true;
  FSZ.startDist = 100;
  FSZ.startSize = settings.size; // 36
  FSZ.startTrSize = settings.trSize; // 20
  FSZ.anchorTop = 150;
  anchorEl.top = 130; // displaced by -20px (pinching smaller)

  const dist2 = 80; // ratio = 0.8
  const ratio2 = dist2 / FSZ.startDist;
  const targetSize2 = FSZ.startSize * ratio2; // 28.8
  const targetTrSize2 = FSZ.startTrSize + (targetSize2 - FSZ.startSize) * 0.5; // ~16.4
  updateFontPinch(targetSize2, targetTrSize2);

  assert.equal(pagedScrollTop, -20); // page scrollTop compensated by -20px
  commitFontPinch();

  assert.equal(settings.size, 29);
  assert.equal(settings.trSize, 16);
});
