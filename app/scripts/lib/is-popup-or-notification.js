/**
 * Indicates whether the user is viewing the app through an extension like window or through a notification.
 * Used to make some style decisions on the frontend, and when deciding whether to close the popup in the backend.
 *
 * @returns {string} Returns 'popup' if the user is viewing through the browser ('home.html') or popup extension
 * ('popup.html'). Otherwise it returns 'notification'.
 *
 */
module.exports = function isPopupOrNotification () {
  const url = window.location.href

  if (url.match(/popup.html(?:\?.+)*$/) ||
    url.match(/home.html(?:\?.+)*$/) || url.match(/home.html(?:#.*)*$/)) {
    return 'popup'
  } else {
    return 'notification'
  }
}
