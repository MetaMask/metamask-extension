class BugNotifier {
  notify (uri, message) {
    return postData(uri, message)
      .then(data => console.log(data)) // JSON from `response.json()` call
      .catch(error => console.error(error))
  }
}

function postData(uri, data) {

  return fetch(url, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
  })
  .then(response => response.json()) // parses response to JSON
}

module.exports = BugNotifier

