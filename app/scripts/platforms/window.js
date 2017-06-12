
class WindowPlatform {

  //
  // Public
  //

  reload () {
    global.location.reload()
  }

  openWindow ({ url }) {
    global.open(url, '_blank')
  }

  getVersion () {
    return '<unable to read version>'
  }

}

module.exports = WindowPlatform
