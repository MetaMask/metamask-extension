/*
Handling messages from usb permissions iframe
*/

const switchToPopupTab = (event) => {

  window.removeEventListener('beforeunload', switchToPopupTab);

  if (!event) {
      // triggered from 'usb-permissions-close' message
      // switch tab to previous index and close current
      chrome.tabs.query({
          currentWindow: true,
          active: true,
      }, (current) => {
          if (current.length < 0) return;
          chrome.tabs.query({
              index: current[0].index - 1
          }, popup => {
              if (popup.length < 0) return;
              chrome.tabs.update(popup[0].id, { active: true });
          })
          chrome.tabs.remove(current[0].id);
      });
      return;
  }

  // TODO: remove this query, or add `tabs` permission. This does not work.
  // triggered from 'beforeunload' event
  // find tab by popup pattern and switch to it
  chrome.tabs.query({
      url: "*://connect.trezor.io/*/popup.html"
  }, (tabs) => {
      if (tabs.length < 0) return;
      chrome.tabs.update(tabs[0].id, { active: true });
  });
}

window.addEventListener('message', event => {
  if (event.data === 'usb-permissions-init') {
      const iframe = document.getElementById('trezor-usb-permissions');
      iframe.contentWindow.postMessage({
          type: 'usb-permissions-init',
          extension: chrome.runtime.id,
      }, '*');
  } else if (event.data === 'usb-permissions-close') {
      switchToPopupTab();
  }
});

window.addEventListener('beforeunload', switchToPopupTab);
