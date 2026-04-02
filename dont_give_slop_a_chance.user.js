// ==UserScript==
// @name         Kill AI overviews (JP)
// @namespace    https://github.com/dropout-zzz/userscript_rm_google_ai_digest
// @version      0.0.0
// @author       ChatGPT
// @description  return clean exp when looking up jpn word on Google
// @match        https://www.google.com/search?*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // the highlighted text
  const markReLight = /^linear-gradient\(90deg, rgb\(211, 227, 253\) 50%, rgba\(0, 0, 0, 0\) 50%\) \d{1,2}(\.\d+)?% 0px \/ 200% 100% no-repeat$/;
  const markReDark = /^linear-gradient\(90deg, rgb\(52, 69, 127\) 50%, rgba\(0, 0, 0, 0\) 50%\) \d{1,2}(\.\d+)?% 0px \/ 200% 100% no-repeat$/;

  // the ✦ icon
  const pathD = "M235.5 471C235.5 438.423 229.22 407.807 216.66 379.155C204.492 350.503 187.811 325.579 166.616 304.384C145.421 283.189 120.498 266.508 91.845 254.34C63.1925 241.78 32.5775 235.5 0 235.5C32.5775 235.5 63.1925 229.416 91.845 217.249C120.498 204.689 145.421 187.811 166.616 166.616C187.811 145.421 204.492 120.497 216.66 91.845C229.22 63.1925 235.5 32.5775 235.5 0C235.5 32.5775 241.584 63.1925 253.751 91.845C266.311 120.497 283.189 145.421 304.384 166.616C325.579 187.811 350.503 204.689 379.155 217.249C407.807 229.416 438.423 235.5 471 235.5C438.423 235.5 407.807 241.78 379.155 254.34C350.503 266.508 325.579 283.189 304.384 304.384C283.189 325.579 266.311 350.503 253.751 379.155C241.584 407.807 235.5 438.423 235.5 471Z";

  // bg of the ✦ icon
  const fillLight = "rgb(49, 121, 237)";
  const fillDark = "rgb(122, 172, 255)";

  function isVisible(el) {
    if (!el) return false;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;

    return true;
  }

  function getMark() {
    const list = document.getElementsByTagName("mark");
    for (let i = 0; i < list.length; i++) {
      const el = list[i];

      // i think site tries to add it back but failed,
      // without this we trigger false positive alert.
      if (!isVisible(el)) continue;

      const bg = getComputedStyle(el).background;
      if (markReLight.test(bg) || markReDark.test(bg)) {
        return el;
      }
    }
    return null;
  }

  function getTitle() {
    const all = document.getElementsByTagName("div");
    for (let i = 0; i < all.length; i++) {
      if (all[i].textContent === "AI による概要") {
        return all[i];
      }
    }
    return null;
  }

  function getWarn() {
    const all = document.getElementsByTagName("div");
    for (let i = 0; i < all.length; i++) {
      if (all[i].textContent === "AI は不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください") {
        return all[i];
      }
    }
    return null;
  }

  function getIcon() {
    const svgs = document.getElementsByTagName("svg");
    for (let i = 0; i < svgs.length; i++) {
      const s = svgs[i];

      if (s.getAttribute("width") !== "24" || s.getAttribute("height") !== "24") {
        continue;
      }

      const children = s.children;
      for (let j = 0; j < children.length; j++) {
        const p = children[j];

        if (p.tagName !== "path") continue;
        if (p.getAttribute("d") !== pathD) continue;

        const fill = getComputedStyle(p).fill;
        if (fill !== fillLight && fill !== fillDark) continue;

        return s;
      }
    }
    return null;
  }

  function findCommonParent2(a, b) {
    let p = a;
    while (p) {
      if (p.contains(b)) {
        return p;
      }
      p = p.parentElement;
    }
    return null;
  }

  function findCommonParent3(a, b, c) {
    let p = a;
    while (p) {
      if (p.contains(b) && p.contains(c)) {
        return p;
      }
      p = p.parentElement;
    }
    return null;
  }

  function tryRemove() {
    const m = getMark();
    const t = getTitle();
    const i = getIcon();

    // main path
    if (m && t && i) {
      const p = findCommonParent3(m, t, i);
      if (p) {
        p.remove();
        return;
      }
    }

    // fallback path
    const w = getWarn();
    if (t && w) {
      const p = findCommonParent2(t, w);
      if (p) {
        p.remove();
        return;
      }
    }

    // debug case
    if (m && (!t || !i)) {
      alert("dropout: mark found but missing title or icon");
    }
  }

  function startObs() {
    const obs = new MutationObserver(() => {
      tryRemove();
    });

    obs.observe(document, {
      childList: true,
      subtree: true
    });
  }

  // run once at start
  tryRemove();

  // then keep watching
  startObs();
})();
