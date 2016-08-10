function wait() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve()
    }, 500)
  })
}
