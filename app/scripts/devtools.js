import browser from 'webextension-polyfill';

const initializePanel = (panel) => {
  console.log('initializePanel', panel);
  panel.onSearch.addListener((action) => {
    console.log('Search:', action);
  });
};

const unInitializePanel = () => {
  console.log('uninitializePanel');
};

console.log('devtools.js');
browser.devtools.panels
  .create(
    'My Panel', // title
    '/icons/star.png', // icon
    '/devtools/panel/panel.html', // content
  )
  .then((newPanel) => {
    console.log('newPanel', newPanel);
    newPanel.onShown.addListener(initializePanel);
    newPanel.onHidden.addListener(unInitializePanel);
  });
