/**
 * Used to determine the window type through which the app is being viewed.
 *  - 'popup' refers to the extension opened through the browser app icon (in top right corner in chrome and firefox)
 *  - 'responsive' refers to the main browser window
 *  - 'notification' refers to the popup that appears in its own window when taking action outside of metamask
 *
 * @returns {string} A single word label that represents the type of window through which the app is being viewed
 *
 */
module.exports = function environmentType () {
  const url = window.location.href
  if (url.match(/popup.html$/)) {
    return 'popup'
  } else if (url.match(/home.html$/)) {
    return 'responsive'
  } else {
    return 'notification'
  }
}
