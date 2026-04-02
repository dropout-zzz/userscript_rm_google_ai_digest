// ==UserScript==
// @name         Kill AI overviews (JP)
// @namespace    https://github.com/dropout-zzz/userscript_rm_google_ai_digest
// @version      0.0.0
// @author       ChatGPT
// @description  return clean exp when looking up jpn word on Google
// @match        https://www.google.com/search?*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
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

  function findDivText(txt) {
    const all = document.getElementsByTagName("div");
    for (let i = 0; i < all.length; i++) {
      if (all[i].textContent === txt) {
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
      if (p.contains(b)) { return p; }
      p = p.parentElement;
    }
    return null;
  }

  function findCommonParent3(a, b, c) {
    let p = a;
    while (p) {
      if (p.contains(b) && p.contains(c)) { return p; }
      p = p.parentElement;
    }
    return null;
  }

  let hidden = false;

  function setPageHidden(v) {
    if (!document.documentElement) return;

    if (v === hidden) return;
    hidden = v;

    const el = document.documentElement;

    // smooth animation
    el.style.transition = "opacity 0.25s ease-in-out";

    if (v) {
      el.style.opacity = "0";
    } else {
      setTimeout(() => {
        el.style.opacity = "";
      }, 1500); // add small delay to prevent bad flickering
    }
  }

  function loadStat() {
    return GM_getValue("stat", {
      total: 0,
      main: 0,
      fallback: 0
    });
  }

  function saveStat(s) {
    GM_setValue("stat", s);
  }

  function bump(kind) {
    const s = loadStat();

    s.total++;

    if (kind === "main") s.main++;
    if (kind === "fallback") s.fallback++;

    // check every 50 successful runs
    if (s.total >= 50) {
      if (s.main === 0) {
        alert("dropout: fallback used but main never touched");
      }

      // reset
      s.total = 0;
      s.main = 0;
      s.fallback = 0;
    }

    saveStat(s);
  }

  let warned = false;

  function tryRemove() {
    const m = getMark();
    const t = findDivText('AI による概要');
    const i = getIcon();

    // main path
    if (m && t && i) {
      const p = findCommonParent3(m, t, i);
      if (p) {
        p.remove();
        setPageHidden(false);
        bump("main");
        return;
      }
    }

    // fallback path
    const w = findDivText('AI は不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください');
    if (t && w) {
      const p = findCommonParent2(t, w);
      if (p) {
        p.remove();
        setPageHidden(false);
        bump("fallback");
        return;
      }
    }

    // disclaimer text is loaded much later,
    // this prevent showing slop before we can remove it.
    //
    // also, google sometimes show the title but later realizes no
    // overview available and hides it again, this should handle the case.
    setPageHidden(isVisible(t));

    // debug case
    if (m && (!t || !i)) {
      if (!warned) {
        warned = true;
        alert("dropout: mark found but missing title or icon");
      }
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
