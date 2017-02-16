module.exports = function isPopupOrNotification () {
  const url = window.location.href
  if (url.match(/popup.html$/)) {
    return 'popup'
  } else {
    return 'notification'
  }
}
