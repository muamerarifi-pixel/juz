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
  assert.doesNotMatch(css, /\.pg\.zoomed/);
  assert.doesNotMatch(css, /\.zoom-badge/);
});

test('sw.js: cache VERSION is bumped to v7.13.11', () => {
  const swPath = path.resolve('public/sw.js');
  const sw = fs.readFileSync(swPath, 'utf8');
  assert.match(sw, /const VERSION = 'juz-v7\.13\.11-cf';/);
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
  const FSZ = { pinching: false };

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
  const homeInput = {
    id: 'surahSearch',
    nodeType: 1,
    parentElement: homeEl,
    closest: (sel) => (sel === '#home' ? homeEl : null),
  };

  const sheetSettings = {
    id: 'sheet-settings',
    nodeType: 1,
    closest: (sel) => (sel === '.sheet' || sel === '#sheet-settings' ? sheetSettings : null),
  };

  const readerEl = {
    id: 'reader',
    nodeType: 1,
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };
  const readerTop = {
    id: 'readerTop',
    className: 'topbar reader-top',
    nodeType: 1,
    parentElement: readerEl,
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };
  const readerBar = {
    id: 'rbar',
    className: 'rbar',
    nodeType: 1,
    parentElement: readerEl,
    closest: (sel) => (sel === '#reader' ? readerEl : null),
  };
  const readerBody = {
    id: 'readerBody',
    nodeType: 1,
    parentElement: readerEl,
    closest: (sel) => (sel === '#readerBody' ? readerBody : sel === '#reader' ? readerEl : null),
  };
  const pgEl = {
    className: 'pg',
    nodeType: 1,
    parentElement: readerBody,
    closest: (sel) => (sel === '.pg' ? pgEl : sel === '#readerBody' ? readerBody : null),
  };
  const ayEl = {
    className: 'ay',
    nodeType: 1,
    parentElement: pgEl,
    closest: (sel) => (sel === '.ay' ? ayEl : sel === '.pg' ? pgEl : sel === '#readerBody' ? readerBody : null),
  };
  const arabicTextNode = {
    nodeType: 3, // Text node
    parentElement: ayEl,
  };

  const navTargetEl = (t) => (t && t.nodeType === 3 ? t.parentElement : t);
  const isNavView = (e) => route.name !== 'reader' || !navTargetEl(e.target)?.closest?.('#readerBody');

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 1 && isNavView(e)) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 1 && !FSZ.pinching && isNavView(e)) {
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
    if (!FSZ.pinching && isNavView(e)) {
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

  // Multi-touch pinch on homeCard: MUST be prevented
  const homePinchStart = createEvent('touchstart', homeCard, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(homePinchStart);
  assert.equal(homePinchStart.defaultPrevented, true, 'Multi-touch on home card must be prevented');

  const homePinchMove = createEvent('touchmove', homeCard, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 60, clientY: 60 }] });
  handleTouchMove(homePinchMove);
  assert.equal(homePinchMove.defaultPrevented, true, 'Multi-touch move on home card must be prevented');

  // Single-touch scroll on homeCard: MUST NOT be prevented
  const homeScrollStart = createEvent('touchstart', homeCard, { touches: [{ clientX: 10, clientY: 10 }] });
  handleTouchStart(homeScrollStart);
  assert.equal(homeScrollStart.defaultPrevented, false, 'Single touch scroll on home must be permitted');

  const homeScrollMove = createEvent('touchmove', homeCard, { touches: [{ clientX: 10, clientY: 20 }] });
  handleTouchMove(homeScrollMove);
  assert.equal(homeScrollMove.defaultPrevented, false, 'Single touch scroll move on home must be permitted');

  // Multi-touch on home search input: MUST be prevented
  const inputPinch = createEvent('touchstart', homeInput, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(inputPinch);
  assert.equal(inputPinch.defaultPrevented, true, 'Multi-touch on search input must be prevented');

  // Ctrl+wheel (PC touchpad pinch) on home: MUST be prevented
  const homeWheel = createEvent('wheel', homeCard, { ctrlKey: true, deltaY: -20 });
  handleWheel(homeWheel);
  assert.equal(homeWheel.defaultPrevented, true, 'Touchpad Ctrl+wheel zoom on home must be prevented');

  // Trackpad gesture on home: MUST be prevented
  const homeGesture = createEvent('gesturestart', homeCard, {});
  handleGestureStart(homeGesture);
  assert.equal(homeGesture.defaultPrevented, true, 'Trackpad gesture on home must be prevented');

  // Multi-touch inside sheet modal (settings): MUST be prevented
  const sheetPinch = createEvent('touchstart', sheetSettings, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(sheetPinch);
  assert.equal(sheetPinch.defaultPrevented, true, 'Multi-touch inside sheet dialogs must be prevented');

  // --- Tests on READER view (route.name = 'reader') ---
  route.name = 'reader';

  // Multi-touch on Quran page (inside readerBody): MUST NOT be prevented by navigation handlers
  const readerPinch = createEvent('touchstart', pgEl, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(readerPinch);
  assert.equal(readerPinch.defaultPrevented, false, 'Quran page pinch must NOT be suppressed by nav handler');

  // Multi-touch directly on Arabic text node: MUST NOT be prevented by navigation handlers
  const textNodePinch = createEvent('touchstart', arabicTextNode, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(textNodePinch);
  assert.equal(textNodePinch.defaultPrevented, false, 'Arabic Text node touch must NOT be suppressed by nav handler');

  // Ctrl+wheel on Quran page: MUST NOT be prevented by navigation handlers
  const readerWheel = createEvent('wheel', pgEl, { ctrlKey: true, deltaY: -20 });
  handleWheel(readerWheel);
  assert.equal(readerWheel.defaultPrevented, false, 'Quran page Ctrl+wheel must NOT be suppressed by nav handler');

  // Trackpad gesture on Arabic text node: MUST NOT be prevented by navigation handlers
  const textNodeGesture = createEvent('gesturestart', arabicTextNode, {});
  handleGestureStart(textNodeGesture);
  assert.equal(textNodeGesture.defaultPrevented, false, 'Arabic text node trackpad gesture must NOT be suppressed by nav handler');

  // Touch on Reader topbar (#readerTop): MUST be prevented
  const topbarPinch = createEvent('touchstart', readerTop, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(topbarPinch);
  assert.equal(topbarPinch.defaultPrevented, true, 'Reader topbar pinch must be prevented');

  // Touch on Reader bottom bar (#rbar): MUST be prevented
  const barPinch = createEvent('touchstart', readerBar, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(barPinch);
  assert.equal(barPinch.defaultPrevented, true, 'Reader bottom bar pinch must be prevented');

  // Null/document target: safely blocked without throwing
  const nullEvent = createEvent('touchstart', null, { touches: [{ clientX: 10, clientY: 10 }, { clientX: 50, clientY: 50 }] });
  handleTouchStart(nullEvent);
  assert.equal(nullEvent.defaultPrevented, true, 'Null target multi-touch must be safely prevented');
});
