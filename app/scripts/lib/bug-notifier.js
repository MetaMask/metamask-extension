class BugNotifier {
  notify (uri, message) {
    return postData(uri, message)
  }
}

function postData(uri, data) {
  return fetch(uri, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
  })
}

module.exports = BugNotifier

