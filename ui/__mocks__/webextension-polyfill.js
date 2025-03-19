const getManifest = () => ({ manifest_version: 3 });

// Polyfill chrome.runtime for environments that do not support it
// E.g. Storybook
global.chrome = {
  ...global?.chrome,
  runtime: {
    ...global?.chrome?.runtime,
    getManifest,
  },
};

module.exports = {
  runtime: { getManifest },
};
