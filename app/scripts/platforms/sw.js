class SwPlatform {
  /**
   * Reloads the platform
   */
  reload () {
    // TODO: you can't actually do this
    /** @type {any} */ (global).location.reload()
  }

  /**
   * Opens a window
   * @param {{url: string}} opts - The window options
   */
  openWindow (opts) {
    // TODO: this doesn't actually work
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

module.exports = SwPlatform
