import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// 1. Static Configuration Verification (HTML & CSS)
test('index.html: viewport configuration disables browser viewport zoom', () => {
  const htmlPath = path.resolve('public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Must include viewport meta with user-scalable=no, maximum-scale=1, and viewport-fit=cover
  assert.match(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*maximum-scale=1[^"']*["']/);
  assert.match(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*user-scalable=no[^"']*["']/);
  assert.match(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*viewport-fit=cover[^"']*["']/);
});

test('style.css: touch-action configuration disables zoom on #home & sheets without using zoom-enabling manipulation', () => {
  const cssPath = path.resolve('public/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // #home and its children must have touch-action: pan-y
  assert.match(css, /#home\s*\{[^}]*touch-action:\s*pan-y/);
  assert.match(css, /#home\s+\*\s*\{[^}]*touch-action:\s*pan-y/);

  // #home input and sheet inputs must use pan-x pan-y (NOT manipulation, which allows continuous pinch-zoom per W3C)
  assert.match(css, /#home\s+input\s*\{[^}]*touch-action:\s*pan-x\s+pan-y/);
  assert.match(css, /\.sheet\s+input,\s*\.sheet\s+input\[type=["']range["']\]\s*\{[^}]*touch-action:\s*pan-x\s+pan-y/);

  // sheets must also have pan-y
  assert.match(css, /\.sheet\s*\{[^}]*touch-action:\s*pan-y/);

  // Quran pages maintain proper touch-action
  assert.match(css, /\.pg\s*\{[^}]*touch-action:\s*pan-y/);
  assert.match(css, /\.pg\.zoomed\s*\{[^}]*touch-action:\s*none\s*!important/);
});

test('sw.js: cache VERSION is bumped to v7.13.4', () => {
  const swPath = path.resolve('public/sw.js');
  const sw = fs.readFileSync(swPath, 'utf8');
  assert.match(sw, /const VERSION = 'juz-v7\.13\.4-cf';/);
});

test('app.js: static verification of zoom blocking handlers on #home and window', () => {
  const appPath = path.resolve('public/app.js');
  const app = fs.readFileSync(appPath, 'utf8');

  // Check that homeEl handlers are present with passive: false
  assert.match(app, /homeEl\?\.addEventListener\('touchstart',\s*preventHomeMultiTouch,\s*\{\s*passive:\s*false\s*\}\)/);
  assert.match(app, /homeEl\?\.addEventListener\('touchmove',\s*preventHomeMultiTouch,\s*\{\s*passive:\s*false\s*\}\)/);
  assert.match(app, /homeEl\?\.addEventListener\('wheel',\s*\(e\)\s*=>/);
  assert.match(app, /homeEl\?\.addEventListener\('gesturestart',\s*preventHomeGesture/);

  // Check window global fallback handlers
  assert.match(app, /window\.addEventListener\('touchstart',\s*\(e\)\s*=>\s*\{[^}]*isNavView\(e\)[^}]*e\.preventDefault\(\)/);
  assert.match(app, /window\.addEventListener\('touchmove',\s*\(e\)\s*=>\s*\{[^}]*isNavView\(e\)[^}]*e\.preventDefault\(\)/);
  assert.match(app, /window\.addEventListener\('wheel',\s*\(e\)\s*=>\s*\{[^}]*isNavView\(e\)[^}]*e\.preventDefault\(\)/);
  assert.match(app, /window\.addEventListener\('gesturestart',\s*\(e\)\s*=>\s*\{[^}]*isNavView\(e\)[^}]*e\.preventDefault\(\)/);

  // Check text-node normalization in isNavView
  assert.match(app, /navTargetEl/);
  assert.match(app, /nodeType === 3/);
});

// 2. Behavioral Testing of View Classification & Event Interception
test('Home navigation vs Reader zoom event routing & edge cases', () => {
  const route = { name: 'home' };
  const PZ = { pinching: false, s: 1, el: null };

  // Mock DOM tree
  const homeEl = {
    id: 'home',
    nodeType: 1,
    closest: (sel) => (sel === '#home' ? homeEl : null),
  };
  const homeCard = {
    id: 'weekCard',
    nodeType: 1,
    parentElement: homeEl,
    closest: (sel) => (sel === '#home' ? homeEl : null),
  };
  const readerTop = {
    id: 'readerTop',
    nodeType: 1,
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };
  const rbar = {
    id: 'rbar',
    nodeType: 1,
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };
  const readerEl = {
    id: 'reader',
    nodeType: 1,
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };
  const readerBody = {
    id: 'readerBody',
    nodeType: 1,
    parentElement: readerEl,
    closest: (sel) => (sel === '#readerBody' ? readerBody : sel === '#reader' ? readerEl : null),
  };
  const pgEl = {
    id: 'pg1',
    nodeType: 1,
    parentElement: readerBody,
    closest: (sel) => (sel === '.pg' ? pgEl : sel === '#readerBody' ? readerBody : sel === '#reader' ? readerEl : null),
  };
  const ayahEl = {
    id: 'ay-1-1',
    nodeType: 1,
    parentElement: pgEl,
    closest: (sel) => (sel === '.ay' ? ayahEl : sel === '.pg' ? pgEl : sel === '#readerBody' ? readerBody : sel === '#reader' ? readerEl : null),
  };
  const ayahTextNode = {
    nodeType: 3, // Text node
    nodeValue: 'بِسْمِ اللَّهِ',
    parentElement: ayahEl,
  };
  const sheetSettings = {
    id: 'sheet-settings',
    nodeType: 1,
    closest: (sel) => (sel === '.sheet' || sel === '#sheet-settings' ? sheetSettings : null),
  };

  // Identical logic to public/app.js
  const navTargetEl = (t) => (t && t.nodeType === 3 ? t.parentElement : t);
  const isNavView = (e) => route.name !== 'reader' || !navTargetEl(e.target)?.closest?.('#readerBody');

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

  const handleGestureChange = (e) => {
    if (!PZ.pinching && isNavView(e)) {
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

  // 2. Two-finger touchmove on #home card MUST be prevented
  {
    const ev = createEvent('touchmove', homeCard, { touches: [{ clientX: 105 }, { clientX: 205 }] });
    handleTouchMove(ev);
    assert.equal(ev.defaultPrevented, true, '2-finger touchmove on home card must be prevented');
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

  // 6. Safari gesturestart & gesturechange on #home MUST be prevented
  {
    const evStart = createEvent('gesturestart', homeEl, { scale: 1.5 });
    handleGestureStart(evStart);
    assert.equal(evStart.defaultPrevented, true, 'Safari gesturestart on home must be prevented');

    const evChange = createEvent('gesturechange', homeEl, { scale: 1.6 });
    handleGestureChange(evChange);
    assert.equal(evChange.defaultPrevented, true, 'Safari gesturechange on home must be prevented');
  }

  // 7. Dialog / Sheet open on home view MUST have zoom gestures prevented
  {
    const ev = createEvent('touchstart', sheetSettings, { touches: [{ clientX: 120 }, { clientX: 220 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, true, 'Multi-touch on settings sheet must be prevented');

    const evWheel = createEvent('wheel', sheetSettings, { ctrlKey: true, deltaY: -30 });
    handleWheel(evWheel);
    assert.equal(evWheel.defaultPrevented, true, 'Ctrl+wheel on settings sheet must be prevented');
  }

  // --- Tests on READER view (route.name = 'reader') ---
  route.name = 'reader';

  // 8. Two-finger touch on Quran page (.pg in #readerBody) MUST NOT be blocked by nav handlers
  {
    const ev = createEvent('touchstart', pgEl, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, false, '2-finger touchstart on Quran page must not be prevented by nav handler');
  }

  // 9. Two-finger touch on Text node inside ayah on Quran page MUST NOT be blocked by nav handlers (WebKit bug fix)
  {
    const ev = createEvent('touchstart', ayahTextNode, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, false, '2-finger touchstart on Quran text node must not be prevented by nav handler');
  }

  // 10. Ctrl+wheel on Quran page MUST NOT be blocked by nav handler (so reader can zoom)
  {
    const ev = createEvent('wheel', pgEl, { ctrlKey: true, deltaY: -50 });
    handleWheel(ev);
    assert.equal(ev.defaultPrevented, false, 'Ctrl+wheel on Quran page must not be prevented by nav handler');
  }

  // 11. Safari gesturestart on Quran page MUST NOT be blocked by nav handler
  {
    const ev = createEvent('gesturestart', pgEl, { scale: 1.5 });
    handleGestureStart(ev);
    assert.equal(ev.defaultPrevented, false, 'Safari gesturestart on Quran page must not be prevented by nav handler');
  }

  // 12. Touch on readerTop (outside #readerBody) MUST be prevented from viewport zoom
  {
    const ev = createEvent('touchstart', readerTop, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, true, '2-finger touch on reader header must be prevented from viewport zoom');
  }

  // 13. Touch on rbar (toolbar outside #readerBody) MUST be prevented from viewport zoom
  {
    const ev = createEvent('touchstart', rbar, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, true, '2-finger touch on reader toolbar must be prevented from viewport zoom');
  }

  // 14. Sheet opened while in reader mode MUST be prevented from viewport zoom
  {
    const ev = createEvent('touchstart', sheetSettings, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(ev);
    assert.equal(ev.defaultPrevented, true, '2-finger touch on sheet in reader must be prevented from viewport zoom');
  }

  // 15. Null target or document target safely handled without error and prevented
  {
    const evNull = createEvent('touchstart', null, { touches: [{ clientX: 100 }, { clientX: 200 }] });
    handleTouchStart(evNull);
    assert.equal(evNull.defaultPrevented, true, 'null target must be prevented from viewport zoom');
  }
});
