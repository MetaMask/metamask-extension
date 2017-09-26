module.exports = function isPopupOrNotification () {
  const url = window.location.href
  if (url.match(/popup.html$/) || url.match(/home.html$/)) {
    return 'popup'
  } else {
    return 'notification'
  }
}
