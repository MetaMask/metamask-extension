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
