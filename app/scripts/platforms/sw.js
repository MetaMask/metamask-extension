
class SwPlatform {

  //
  // Public
  //

  reload () {
    // you cant actually do this
    global.location.reload()
  }

  openWindow ({ url }) {
    // this doesnt actually work
    global.open(url, '_blank')
  }

  getVersion () {
    return '<unable to read version>'
  }

}

module.exports = SwPlatform
