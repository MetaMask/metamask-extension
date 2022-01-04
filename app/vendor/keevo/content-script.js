let port = chrome.runtime.connect({ name: 'keevo-popup' });

port.onMessage.addListener(message => {
  window.postMessage(message, window.location.origin);
});

port.onDisconnect.addListener(() => {
  port = null;
});

window.addEventListener('message', event => {
  if (port && event.source === window && event.data) {
    port.postMessage({
      data: event.data
    });
  }
});
