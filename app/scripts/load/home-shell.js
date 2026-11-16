/*
 * Home shell: paints the last known account name and balance as plain DOM
 * before the deferred bundles evaluate, so there is something useful on screen
 * while the extension loads.
 *
 * This file is copied verbatim into the build (not bundled, not run inside a
 * LavaMoat compartment) and runs from <head>, so it MUST stay dependency-free:
 * no imports, no requires, only DOM and the extension storage API, and only
 * textContent for inserting data.
 *
 * Lock safety: the snapshot lives in storage.session, is written by the UI only
 * while the wallet is unlocked, and is removed by the background whenever the
 * wallet is locked. No snapshot means no shell.
 *
 * Ordering: storage.session is async, so the static loader would otherwise
 * paint first. While the read is pending, a style rule hides the loader. It is
 * lifted as soon as the read settles (shell painted or not) and by a timeout,
 * so a stuck read can never leave a blank page.
 */
(function () {
  var KEY = 'homeShellSnapshot';
  // Capture now: once the app runtime loads, LavaMoat scuttling makes these
  // globals throw on access, and the paint and handoff below can run after that.
  var raf = window.requestAnimationFrame.bind(window);
  var MutationObserverCtor = window.MutationObserver;
  var matchMedia = window.matchMedia.bind(window);
  var HIDE_TIMEOUT_MS = 250;
  var api =
    typeof browser !== 'undefined'
      ? browser
      : typeof chrome !== 'undefined'
        ? chrome
        : undefined;
  if (!api || !api.storage || !api.storage.session) {
    return;
  }

  var hider = document.createElement('style');
  hider.textContent = '#app-content>*{visibility:hidden}';
  document.head.appendChild(hider);
  // base-styles.scss gives :root a gray (black in dark mode) background until
  // the theme attribute is set, which shows as a flash around the shell. Paint the root the shell's color from the
  // first instant. The locked shell keeps it until the real unlock page takes
  // over; every other path drops it when the shell or the loader is settled.
  // The HTML pages carry the same rule inline, ahead of the stylesheet link, so
  // the root is never gray before this script runs; reuse that element.
  var rootBg = document.getElementById('home-shell-root-bg');
  if (!rootBg) {
    rootBg = document.createElement('style');
    rootBg.textContent =
      ':root{background-color:#fff!important}' +
      '@media (prefers-color-scheme:dark){:root{background-color:#121314!important}}';
    document.head.appendChild(rootBg);
  }
  function dropRootBg() {
    if (rootBg.parentNode) {
      rootBg.parentNode.removeChild(rootBg);
    }
  }
  var hiderTimer = setTimeout(unhide, HIDE_TIMEOUT_MS);
  var done = false;

  var lockedShellOwnsBg = false;

  function unhide() {
    clearTimeout(hiderTimer);
    if (hider.parentNode) {
      hider.parentNode.removeChild(hider);
    }
    if (!lockedShellOwnsBg) {
      dropRootBg();
    }
  }

  function isValid(snapshot) {
    return (
      snapshot !== null &&
      typeof snapshot === 'object' &&
      snapshot.version === 1 &&
      typeof snapshot.accountName === 'string'
    );
  }

  // Geometry measured from the real home screen (see AppHeader,
  // AccountOverviewLayout and CoinOverview):
  // - The name sits 16px from the left at every narrow width.
  // - The balance sits under the 68px header plus 16px padding. Up to 490px it
  //   is left-aligned. Above that it is centered in a column of at most 460px.
  // - The real scroll container reserves a scrollbar gutter, so the shell
  //   reserves the same one to keep the centering identical.
  // - From 768px a 320px side nav sits in a centered 1200px frame; the header
  //   and balance use larger type.
  // The vertical offsets assume no banner or carousel above the balance.
  var SANS = 'Inter,"Helvetica Neue",Helvetica,Arial,sans-serif';
  var HERO = '"Grotzec Cond","Helvetica Neue",Helvetica,Arial,sans-serif';
  var SHELL_CSS =
    '#home-shell{position:fixed;top:0;right:0;bottom:0;left:0;z-index:10;' +
    'font-family:' +
    SANS +
    '}' +
    '#home-shell .hs-scroll{position:absolute;top:0;right:0;bottom:0;left:0;' +
    'overflow:hidden;scrollbar-gutter:stable}' +
    '#home-shell .hs-name{position:absolute;left:16px;top:8px;font:500 16px/24px ' +
    SANS +
    '}' +
    '#home-shell .hs-col{box-sizing:border-box;width:100%;padding:85px 16px 0}' +
    '#home-shell .hs-bal{width:fit-content;font:600 48px/56px ' +
    HERO +
    '}' +
    '@media (min-width:491px){' +
    '#home-shell .hs-col{max-width:460px;margin:0 auto}' +
    '#home-shell .hs-bal{margin:0 auto}}' +
    '@media (min-width:768px){' +
    '#home-shell .hs-scroll{left:calc(max(0px,(100vw - 1200px) / 2) + 320px)}' +
    '#home-shell .hs-name{left:16px;top:10px;font:600 24px/32px ' +
    SANS +
    '}' +
    '#home-shell .hs-col{max-width:none;margin:0;padding:105px 24px 0}' +
    '#home-shell .hs-bal{margin:0;font:500 60px/75px ' +
    HERO +
    '}}';

  // Locked variant: the unlock page's wordmark logo (see UnlockPage and
  // MetaFoxHorizontalLogo). The real page centers a 180x180 box horizontally;
  // vertically its top sits 214px above the viewport center. The popup is a
  // fixed 600px tall, so there it sits at an absolute 98px. Both offsets were
  // measured, not derived.
  var LOGO_PATH =
    'M394.102 265.407V340.812H355.162V288.57L310.786 293.73C301.039 294.854 296.75 298.041 296.75 303.912C296.75 312.512 304.892 316.136 322.344 316.136C332.985 316.136 344.773 314.553 355.184 311.824L335.026 340.353C326.885 342.165 318.95 343.06 310.579 343.06C275.262 343.06 255.103 329.024 255.103 304.119C255.103 282.149 270.95 270.613 306.956 266.531L354.519 261.004C351.951 247.175 341.516 241.167 320.762 241.167C301.291 241.167 279.78 246.143 260.539 255.431L266.662 221.696C284.55 214.22 304.938 210.367 325.532 210.367C370.825 210.367 394.148 229.173 394.148 265.384L394.102 265.407ZM43.7957 170.991L1.23138 340.812H43.7957L64.9173 255.477L101.542 299.372H145.918L182.542 255.477L203.664 340.812H246.228L203.664 170.968L123.718 265.912L43.7727 170.968L43.7957 170.991ZM203.664 1.14648L123.718 96.0905L43.7957 1.14648L1.23138 170.991H43.7957L64.9173 85.6558L101.542 129.55H145.918L182.542 85.6558L203.664 170.991H246.228L203.664 1.14648ZM496.454 263.825L462.031 258.848C453.431 257.495 450.037 254.766 450.037 250.019C450.037 242.313 458.407 238.919 475.63 238.919C495.559 238.919 513.447 243.001 532.253 251.831L527.506 218.554C512.324 213.119 494.894 210.413 476.777 210.413C434.442 210.413 411.325 225.136 411.325 251.624C411.325 272.241 424.007 283.777 450.954 287.859L485.836 293.065C494.665 294.418 498.289 297.812 498.289 303.247C498.289 310.953 490.147 314.576 473.612 314.576C451.871 314.576 428.319 309.37 409.078 300.082L412.931 333.359C429.466 339.482 450.977 343.105 471.135 343.105C514.617 343.105 537.252 327.924 537.252 300.977C537.252 279.465 524.57 267.907 496.5 263.848L496.454 263.825ZM552.388 186.15V340.812H591.329V186.15H552.388ZM636.829 271.301L690.974 212.638H642.516L591.329 273.319L645.91 340.789H695.057L636.829 271.278V271.301ZM546.953 134.297C546.953 159.203 567.111 173.238 602.429 173.238C610.799 173.238 618.734 172.321 626.876 170.532L647.034 142.003C636.622 144.709 624.835 146.314 614.194 146.314C596.764 146.314 588.6 142.691 588.6 134.091C588.6 128.197 592.911 125.032 602.635 123.909L647.011 118.749V170.991H685.952V95.586C685.952 59.3513 662.629 40.5689 617.335 40.5689C596.718 40.5689 576.354 44.4217 558.466 51.8979L552.342 85.6329C571.583 76.3449 593.095 71.3684 612.565 71.3684C633.32 71.3684 643.755 77.3769 646.323 91.2057L598.759 96.7326C562.754 100.815 546.907 112.35 546.907 134.32L546.953 134.297ZM438.043 126.156C438.043 157.414 456.16 173.261 491.936 173.261C506.201 173.261 517.988 170.991 529.294 165.785L534.271 131.591C523.4 138.15 512.301 141.544 501.201 141.544C484.437 141.544 476.961 134.756 476.961 119.574V74.2809H536.06V42.8163H476.961V16.099L402.909 55.2691V74.2809H437.997V126.133L438.043 126.156ZM399.767 111.892V119.597H294.526C299.273 135.284 313.377 142.462 338.42 142.462C358.349 142.462 376.925 138.38 393.437 130.468L388.69 163.537C373.508 169.867 354.267 173.284 334.567 173.284C282.257 173.284 253.727 150.19 253.727 107.397C253.727 64.603 282.715 40.5918 327.55 40.5918C372.384 40.5918 399.79 66.6441 399.79 111.914L399.767 111.892ZM294.021 93.3155H360.574C357.065 78.2942 345.53 70.451 327.091 70.451C308.653 70.451 297.714 78.0878 294.021 93.3155Z';
  var LOGO_CSS =
    '#home-shell{position:fixed;top:0;right:0;bottom:0;left:0;z-index:10;' +
    'pointer-events:none}' +
    '#home-shell .hs-logo{position:absolute;left:50%;margin-left:-90px;' +
    'top:calc(50% - 214px);width:180px;height:180px}' +
    '#home-shell.hs-popup .hs-logo{top:98px}';

  function resolveTheme(snapshot) {
    var theme = snapshot && snapshot.theme;
    if (theme !== 'dark' && theme !== 'light') {
      theme = matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  }

  function buildLogo() {
    var dark = resolveTheme(null) === 'dark';
    var shell = document.createElement('div');
    shell.id = 'home-shell';
    if (/popup\.html$/.test(location.pathname)) {
      shell.className = 'hs-popup';
    }
    shell.setAttribute('aria-hidden', 'true');
    var style = document.createElement('style');
    style.textContent = LOGO_CSS;
    shell.appendChild(style);
    shell.style.background = dark ? '#121314' : '#ffffff';

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'hs-logo');
    svg.setAttribute('width', '180');
    svg.setAttribute('height', '180');
    svg.setAttribute('viewBox', '0 0 696 344');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', LOGO_PATH);
    path.setAttribute('fill', dark ? 'rgb(255,255,255)' : 'rgb(22,22,22)');
    svg.appendChild(path);
    shell.appendChild(svg);
    return shell;
  }

  function build(snapshot) {
    var dark = resolveTheme(snapshot) === 'dark';
    var shell = document.createElement('div');
    shell.id = 'home-shell';
    shell.setAttribute('aria-hidden', 'true');

    var style = document.createElement('style');
    style.textContent = SHELL_CSS;
    shell.appendChild(style);
    shell.style.background = dark ? '#121314' : '#ffffff';
    shell.style.color = dark ? '#ffffff' : '#131416';

    var scroll = document.createElement('div');
    scroll.className = 'hs-scroll';

    var col = document.createElement('div');
    col.className = 'hs-col';

    var name = document.createElement('div');
    name.className = 'hs-name';
    name.textContent = snapshot.accountName;

    var balance = document.createElement('div');
    balance.className = 'hs-bal';
    // Privacy mode stores no balance, so show placeholder dots.
    balance.textContent =
      typeof snapshot.balance === 'string'
        ? snapshot.balance
        : '\u2022\u2022\u2022\u2022\u2022';

    col.appendChild(balance);
    scroll.appendChild(name);
    scroll.appendChild(col);
    shell.appendChild(scroll);
    return shell;
  }

  // The read can settle before the parser has created #app-content.
  function whenRootReady(callback) {
    var root = document.getElementById('app-content');
    if (root) {
      callback(root);
      return;
    }
    var observer = new MutationObserverCtor(function () {
      var found = document.getElementById('app-content');
      if (found) {
        observer.disconnect();
        callback(found);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // React's first render replaces everything inside #app-content, and the real
  // unlock page needs a few hundred more milliseconds to draw its own logo. The
  // locked shell therefore lives in <body>, outside the React root, and is only
  // removed once the real logo is in the DOM (plus two frames so it has been
  // painted). The timeout covers loads that never reach the unlock page, such as
  // a wallet that turns out to be unlocked.
  var HANDOFF_SELECTOR = '.unlock-page__mascot-container svg';
  var HANDOFF_TIMEOUT_MS = 6000;
  var HANDOFF_FALLBACK_MS = 150;
  // "No snapshot" does not always mean locked (for example an unlocked wallet
  // whose balance has not resolved yet). Once React has committed, give the
  // unlock page this long to appear; if the route is not the unlock route by
  // then, the real UI is already showing and the logo must not cover it.
  var COMMIT_GRACE_MS = 700;

  function mountUntilRealLogo(shell) {
    document.body.appendChild(shell);
    var observer;
    var timer;
    var graceTimer;
    function remove() {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(graceTimer);
      lockedShellOwnsBg = false;
      dropRootBg();
      if (shell.parentNode) {
        shell.parentNode.removeChild(shell);
      }
    }
    function check() {
      if (document.querySelector(HANDOFF_SELECTOR)) {
        // Two frames guarantee the real logo was painted. Hidden or occluded
        // windows throttle animation frames, so a timer backs them up.
        setTimeout(remove, HANDOFF_FALLBACK_MS);
        raf(function () {
          raf(remove);
        });
        return true;
      }
      // React's first commit replaces the static loader's timeout message.
      if (!graceTimer && !document.querySelector('.loading-timeout-message')) {
        graceTimer = setTimeout(function () {
          if (!/unlock/.test(location.hash)) {
            remove();
          }
        }, COMMIT_GRACE_MS);
      }
      return false;
    }
    observer = new MutationObserverCtor(function () {
      if (check()) {
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    timer = setTimeout(remove, HANDOFF_TIMEOUT_MS);
    check();
  }

  // No snapshot means locked (or never unlocked this browser session). Skip
  // the logo during onboarding, and when the read itself failed.
  function paint(snapshot, readFailed) {
    if (done) {
      return;
    }
    done = true;
    var shell;
    var locked = false;
    if (isValid(snapshot)) {
      shell = build(snapshot);
    } else if (!readFailed && !/onboarding/.test(location.hash)) {
      shell = buildLogo();
      locked = true;
      lockedShellOwnsBg = true;
    } else {
      unhide();
      return;
    }
    whenRootReady(function (root) {
      // The shell fully covers the static loader, so drop the fox and spinner
      // rather than leave them animating underneath. The timeout message stays.
      var loaderParts = root.querySelectorAll('.loading-logo,.loading-spinner');
      for (var i = 0; i < loaderParts.length; i++) {
        root.removeChild(loaderParts[i]);
      }
      if (locked) {
        mountUntilRealLogo(shell);
      } else {
        root.appendChild(shell);
      }
      unhide();
    });
  }

  try {
    var result = api.storage.session.get(KEY);
    if (result && typeof result.then === 'function') {
      result.then(
        function (items) {
          paint(items && items[KEY]);
        },
        function () {
          paint(null, true);
        },
      );
    } else {
      unhide();
    }
  } catch (e) {
    unhide();
  }
})();
