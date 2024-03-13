document.addEventListener('DOMContentLoaded', function () {
  // Function to get the value of a query parameter by name
  function getQueryParam(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(window.location.href);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  // Get the query parameter 'message'
  const message = getQueryParam('message');

  // Inject the message into the innerHTML of the div with ID 'content'
  if (message) {
    document.getElementById('content').innerHTML = message;
  }
});
