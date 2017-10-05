module.exports = function isPopupOrNotification () {
  const url = window.location.href
  // if (url.match(/popup.html$/) || url.match(/home.html$/)) {
  // Below regexes needed for feature toggles (e.g. see line ~340 in ui/app/app.js)
  // Revert below regexes to above commented out regexes before merge to master
  if (url.match(/popup.html(?:\?.+)*$/) || url.match(/home.html(?:\?.+)*$/)) {
    return 'popup'
  } else {
    return 'notification'
  }
}
