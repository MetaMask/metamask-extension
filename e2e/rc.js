class ReferenceCounter {
  constructor (ctor, dtor) {
    this._count = 0
    this._ctor = ctor
    this._dtor = dtor
  }

  /**
   * Increments and decrements the counter around a function call
   * @param {Function<Promise<void>>} fn
   * @return {Promise<void>}
   */
  async tick (fn) {
    await this._increment()
    await fn()
    await this._decrement()
  }

  async _increment () {
    if (this._count === 0) {
      await this._ctor()
    }

    this._count++
  }

  async _decrement () {
    this._count--

    if (this._count === 0) {
      await this._dtor()
    }
  }
}

module.exports = ReferenceCounter
