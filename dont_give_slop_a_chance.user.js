// ==UserScript==
// @name         Kill AI overviews (JP)
// @namespace    https://github.com/dropout-zzz/userscript_rm_google_ai_digest
// @version      0.0.0
// @author       ChatGPT
// @description  return clean exp when looking up jpn word on Google
// @match        https://www.google.com/search?*
// @match        https://ipv4.google.com/search?*
// @match        https://ipv6.google.com/search?*
// @match        https://www.google.co.jp/search?*
// @match        https://ipv6.google.co.jp/search?*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  "use strict";

  // the highlighted text
  const markReLight = /^linear-gradient\(90deg, rgb\(211, 227, 253\) 50%, rgba\(0, 0, 0, 0\) 50%\) \d{1,2}(\.\d+)?% 0px \/ 200% 100% no-repeat$/;
  const markReDark = /^linear-gradient\(90deg, rgb\(33, 61, 160\) 50%, rgba\(0, 0, 0, 0\) 50%\) \d{1,2}(\.\d+)?% 0px \/ 200% 100% no-repeat$/;
  const markChromeLight = /^rgba\(0, 0, 0, 0\) linear-gradient\(90deg, rgb\(211, 227, 253\) 50%, rgba\(0, 0, 0, 0\) 50%\) no-repeat scroll \d{1,2}(\.\d+)?% 0px \/ 200% 100% padding-box border-box$/;
  const markChromeDark = /^rgba\(0, 0, 0, 0\) linear-gradient\(90deg, rgb\(33, 61, 160\) 50%, rgba\(0, 0, 0, 0\) 50%\) no-repeat scroll \d{1,2}(\.\d+)?% 0px \/ 200% 100% padding-box border-box$/;

  function isVisible(el) {
    if (!el) return false;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;

    return true;
  }

  const isChrome = navigator.userAgent.includes("Safari");

  function getMark() {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const list = document.getElementsByTagName("mark");
    for (let i = 0; i < list.length; i++) {
      const el = list[i];

      // i think site tries to add it back but failed,
      // without this we trigger false positive alert.
      if (!isVisible(el)) continue;

      const bg = getComputedStyle(el).background;
      if (
        (!isChrome && !isDark && markReLight.test(bg)) ||
        (!isChrome && isDark && markReDark.test(bg)) ||
        (isChrome && !isDark && markChromeLight.test(bg)) ||
        (isChrome && isDark && markChromeDark.test(bg))
      ) {
        return el;
      }
    }
    return null;
  }

  function hasToken(str, tok) {
    const parts = str.split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === tok) return true;
    }
    return false;
  }

  function hasParent(el, tag) {
    let p = el.parentElement;
    while (p) {
      if (p.tagName === tag) return true;
      p = p.parentElement;
    }
    return false;
  }

  function getSpecialLink() {
    const list = document.getElementsByTagName("a");
    for (let i = 0; i < list.length; i++) {
      const a = list[i];

      if (!hasParent(a, "STRONG")) continue;

      const cs = getComputedStyle(a);

      if (!hasToken(cs.textDecorationLine, "underline")) continue;
      if (cs.textDecorationStyle !== "dotted") continue;
      if (cs.textDecorationThickness !== "8%") continue;

      return a;
    }
    return null;
  }

  function findDivText(txt) {
    const all = document.getElementsByTagName("div");
    for (let i = 0; i < all.length; i++) {
      const el = all[i];

      if (all[i].textContent !== txt) {
        continue;
      }

      if (!isVisible(el)) {
        continue;
      }

      return el;
    }
    return null;
  }

  function findCommonParent(a, b) {
    let p = a;
    while (p) {
      if (p.contains(b)) { return p; }
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
    let m = getMark();

    if (!m) {
      m = getSpecialLink();
    }

    const t = findDivText('AI による概要');

    // main path
    if (m && t) {
      const p = findCommonParent(m, t);
      if (p) {
        p.remove();
        setPageHidden(false);
        bump("main");
        return;
      }
    }

    // fallback path

    const disclaimerTexts = [
      'AI は不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください',
      'これは情報提供のみを目的としています。医学的なアドバイスや診断については、専門家にご相談ください。AI の回答には間違いが含まれている場合があります。 詳細',
      'AI の回答には間違いが含まれている場合があります。法的なアドバイスについては、専門家にご相談ください。 詳細',
      'AI の回答には間違いが含まれている場合があります。金融に関するアドバイスについては、専門家にご相談ください。 詳細'
    ];

    let w = null;
    for (let j = 0; j < disclaimerTexts.length; j++) {
      w = findDivText(disclaimerTexts[j]);
      if (w) break;
    }

    if (t && w) {
      const p = findCommonParent(t, w);
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
    if (m && !t) {
      if (!warned) {
        warned = true;
        alert("dropout: mark found but missing title");
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
