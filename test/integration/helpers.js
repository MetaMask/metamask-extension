function wait() {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, 500)
  })
}
