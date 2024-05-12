try {
  chrome.devtools.panels.create(
    'Dev Tools',
    'images/icon-34.png',
    'devtools-panel.html',
    function (panel) {
      console.log('Panel created: ', panel);
    },
  );
} catch (e) {
  console.error(e);
}
