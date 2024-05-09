// eslint-disable-next-line import/unambiguous, no-undef
chrome.devtools.panels.create(
  'MetaMask Devtools',
  'panel.png',
  'devtools.html',
  function (panel) {
    console.log('Panel created: ', panel);
  },
);
