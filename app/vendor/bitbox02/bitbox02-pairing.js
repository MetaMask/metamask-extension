window.addEventListener('load', event => {
    const urlParams = new URLSearchParams(window.location.search);
    document.getElementById('code').innerHTML = urlParams.get('code');
});


function handleMessage(message, sender, sendResponse) {
    if (message.type === 'bitbox02' && message.action === 'popup-close') {
        window.close();
    }
}
chrome.runtime.onMessage.addListener(handleMessage);
