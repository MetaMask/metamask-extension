class WindowPlatform {
  /**
   * Reload the platform
   */
  reload () {
    /** @type {any} */ (global).location.reload()
  }

  /**
   * Opens a window
   * @param {{url: string}} opts - The window options
   */
  openWindow (opts) {
    /** @type {any} */ (global).open(opts.url, '_blank')
  }

  /**
   * Returns the platform version
   * @returns {string}
   */
  getVersion () {
    return '<unable to read version>'
  }

}

module.exports = WindowPlatform
