/*
Passing messages from background script to popup
*/

let port = chrome.runtime.connect({ name: 'trezor-connect' });
port.onMessage.addListener(message => {
  console.log('message from background to popup', message);
    window.postMessage(message, window.location.origin);
});
port.onDisconnect.addListener(d => {
    port = null;
});

/*
Passing messages from popup to background script
*/

window.addEventListener('message', event => {
    console.log('posting message to bg', event);
    if (port && event.source === window && event.data) {
        port.postMessage({ data: event.data });
    }
});
