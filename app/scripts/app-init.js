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

  const fileList = [
    /** FILE NAMES */
  ];

  fileList.forEach((fileName) => tryImport(fileName));
};
