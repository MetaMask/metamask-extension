// eslint-disable-next-line import/unambiguous
function tryImport(...fileNames) {
  try {
    // eslint-disable-next-line
    importScripts(...fileNames);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// eslint-disable-next-line
self.oninstall = () => {
  tryImport('./globalthis.js');
  tryImport('./sentry-install.js');
  tryImport('./runtime-lavamoat.js');
  tryImport('./lockdown-more.js');
  tryImport('./policy-load.js');
  tryImport('./common-0.js');
  tryImport('./common-1.js');
  tryImport('./common-2.js');
  tryImport('./common-3.js');
  tryImport('./common-4.js');
  tryImport('./common-5.js');
  tryImport('./common-6.js');
  tryImport('./background-0.js');
  tryImport('./background-1.js');
  tryImport('./background-2.js');
  tryImport('./background-3.js');
  tryImport('./background-4.js');
  tryImport('./background-5.js');
  tryImport('./background-6.js');
  tryImport('./background-7.js');
  // chromereload.js code is broken with MV3 service worker implementation as it requires window object
  // we need to find a work around for this
  // tryImport('./chromereload.js');
};
