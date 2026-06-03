/*
Passing messages from background script to popup.
Injected into connect.trezor.io/ by the MV2 manifest.
*/

let port = chrome.runtime.connect({ name: 'trezor-connect' });
port.onMessage.addListener(message => {
    window.postMessage(message, window.location.origin);
});
port.onDisconnect.addListener(() => {
    port = null;
});

/*
Passing messages from popup to background script.
Forward event.data directly (not wrapped in { data: ... }) so that
@trezor/connect-web v9's ServiceWorkerWindowChannel can read top-level
type/id/channel fields.
*/
window.addEventListener('message', event => {
    if (port && event.source === window && event.data) {
        port.postMessage(event.data);
    }
});
