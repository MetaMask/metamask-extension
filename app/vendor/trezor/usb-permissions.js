/*
Handling messages from usb permissions iframe
*/

window.addEventListener('message', event => {
  if (event.data === 'usb-permissions-init') {
      const iframe = document.getElementById('trezor-usb-permissions');
      iframe.contentWindow.postMessage({
          type: 'usb-permissions-init',
          extension: chrome.runtime.id,
      }, '*');
  } else if (event.data === 'usb-permissions-close') {
      chrome.tabs.query({
          currentWindow: true,
          active: true,
      }, (tabs) => {
          chrome.tabs.remove(tabs[0].id);
      });
  }
});