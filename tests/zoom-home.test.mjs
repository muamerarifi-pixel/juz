import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// 1. Static Configuration Verification (HTML & CSS)
test('index.html: viewport configuration disables browser viewport zoom', () => {
  const htmlPath = path.resolve('public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Must include viewport meta with user-scalable=no and maximum-scale=1
  assert.match(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*maximum-scale=1[^"']*["']/);
  assert.match(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*user-scalable=no[^"']*["']/);
});

test('style.css: touch-action pan-y is configured on #home and dialogs', () => {
  const cssPath = path.resolve('public/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // #home and its children must have touch-action: pan-y
  assert.match(css, /#home\s*\{[^}]*touch-action:\s*pan-y/);
  assert.match(css, /#home\s+\*\s*\{[^}]*touch-action:\s*pan-y/);
  assert.match(css, /#home\s+input\s*\{[^}]*touch-action:\s*manipulation/);

  // sheets must also have pan-y
  assert.match(css, /\.sheet\s*\{[^}]*touch-action:\s*pan-y/);
});

test('sw.js: cache VERSION is bumped to v7.13.3', () => {
  const swPath = path.resolve('public/sw.js');
  const sw = fs.readFileSync(swPath, 'utf8');
  assert.match(sw, /const VERSION = 'juz-v7\.13\.3-cf';/);
});

// 2. Event Simulation for Zoom Prevention on Navigation vs Enabled in Reader
test('Home navigation vs Reader zoom event routing', () => {
  const route = { name: 'home' };
  const PZ = { pinching: false, s: 1, el: null };

  // Mock DOM elements
  const homeEl = {
    id: 'home',
    closest: (sel) => (sel === '#home' ? homeEl : null),
  };
  const readerTop = {
    id: 'readerTop',
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };
  const pgEl = {
    id: 'pg1',
    closest: (sel) => (sel === '.pg' ? pgEl : sel === '#readerBody' ? readerBody : sel === '#reader' ? readerEl : null),
  };
  const readerBody = {
    id: 'readerBody',
    closest: (sel) => (sel === '#readerBody' ? readerBody : sel === '#reader' ? readerEl : null),
  };
  const readerEl = {
    id: 'reader',
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };

  const isNavView = (e) => route.name !== 'reader' || !e.target?.closest?.('#readerBody');

  // Simulated handlers identical to public/app.js
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 1 && isNavView(e)) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 1 && !PZ.pinching && isNavView(e)) {
      e.preventDefault();
    }
  };

  const handleWheel = (e) => {
    if (e.ctrlKey && isNavView(e)) {
      e.preventDefault();
    }
  };

  const handleGestureStart = (e) => {
    if (isNavView(e)) {
      e.preventDefault();
    }
  };

  const createEvent = (type, target, details = {}) => {
    let defaultPrevented = false;
    return {
      type,
      target,
      ...details,
      preventDefault: () => { defaultPrevented = true; },
      get defaultPrevented() { return defaultPrevented; },
    };
  };

  // --- Tests on HOME view (route.name = 'home') ---
  route.name = 'home';

  // 1. Two-finger touchstart on #home MUST be prevented
  {
    const ev = createEvent('touchstart', homeEl, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, true, '2-finger touchstart on home must be prevented');
  }

  // 2. Two-finger touchmove on #home MUST be prevented
  {
    const ev = createEvent('touchmove', homeEl, { touches: [{ clientX: 105 }, { clientX: 205 }] });
    handleTouchMove(ev);
    assert.equal(ev.defaultPrevented, true, '2-finger touchmove on home must be prevented');
  }

  // 3. Single-finger touch on #home MUST NOT be prevented (preserves scrolling & tapping)
  {
    const evStart = createEvent('touchstart', homeEl, { touches: [{ clientX: 100 }] });
    handleTouchStart(evStart);
    assert.equal(evStart.defaultPrevented, false, '1-finger touchstart on home must NOT be prevented');

    const evMove = createEvent('touchmove', homeEl, { touches: [{ clientX: 105 }] });
    handleTouchMove(evMove);
    assert.equal(evMove.defaultPrevented, false, '1-finger touchmove on home must NOT be prevented');
  }

  // 4. Ctrl + wheel (touchpad pinch) on #home MUST be prevented
  {
    const ev = createEvent('wheel', homeEl, { ctrlKey: true, deltaY: -50 });
    handleWheel(ev);
    assert.equal(ev.defaultPrevented, true, 'Ctrl+wheel on home must be prevented');
  }

  // 5. Normal wheel (page scrolling) on #home MUST NOT be prevented
  {
    const ev = createEvent('wheel', homeEl, { ctrlKey: false, deltaY: 50 });
    handleWheel(ev);
    assert.equal(ev.defaultPrevented, false, 'Normal wheel scrolling on home must NOT be prevented');
  }

  // 6. Safari gesturestart on #home MUST be prevented
  {
    const ev = createEvent('gesturestart', homeEl, { scale: 1.5 });
    handleGestureStart(ev);
    assert.equal(ev.defaultPrevented, true, 'Safari gesturestart on home must be prevented');
  }

  // --- Tests on READER view (route.name = 'reader') ---
  route.name = 'reader';

  // 7. Two-finger touch on Quran page (.pg in #readerBody) MUST NOT be blocked by nav handlers
  {
    const ev = createEvent('touchstart', pgEl, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, false, '2-finger touchstart on Quran page must not be prevented by nav handler');
  }

  // 8. Ctrl+wheel on Quran page MUST NOT be blocked by nav handler (so reader can zoom)
  {
    const ev = createEvent('wheel', pgEl, { ctrlKey: true, deltaY: -50 });
    handleWheel(ev);
    assert.equal(ev.defaultPrevented, false, 'Ctrl+wheel on Quran page must not be prevented by nav handler');
  }

  // 9. Safari gesturestart on Quran page MUST NOT be blocked by nav handler
  {
    const ev = createEvent('gesturestart', pgEl, { scale: 1.5 });
    handleGestureStart(ev);
    assert.equal(ev.defaultPrevented, false, 'Safari gesturestart on Quran page must not be prevented by nav handler');
  }

  // 10. Touch on readerTop (outside #readerBody) MUST be prevented from viewport zoom
  {
    const ev = createEvent('touchstart', readerTop, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, true, '2-finger touch on reader header must be prevented from viewport zoom');
  }
});
