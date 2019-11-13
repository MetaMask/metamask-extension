// From: https://stackoverflow.com/a/55136548/272576
// Modified to our eslint and to support object-mode.
const Duplex = require('stream').Duplex
const assert = require('assert')

// Define some unique property names.
// The actual value doesn't matter,
// so long as they're not used by Node.js for anything else.
const kCallback = Symbol('Callback')
const kOtherSide = Symbol('Other')

// Define a function `DuplexSocket` whose prototype inherits from `Duplex`
class DuplexSocket extends Duplex {
  constructor (opts) {
    // Let Node.js initialize everything it needs to
    super(opts)
    // Define two values we will be using
    // kCallback saves a temporary reference to a function while
    this[kCallback] = null
    // kOtherSide will be the reference to the other side of the stream
    this[kOtherSide] = null
  }

  _read () {
    // This is called when this side receives a push() call
    // If the other side set a callback for us to call,
    // then first clear that reference
    // (it might be immediately set to a new value again),
    // then call the function.
    const callback = this[kCallback]
    if (callback) {
      this[kCallback] = null
      callback()
    }
  }

  _write (chunk, _encoding, callback) {
    // This is called when someone writes to the stream
    // Ensure there's a reference to the other side before trying to call it
    assert.notStrictEqual(this[kOtherSide], null)
    // Ensure that the other-side callback is empty before setting it
    // If push immediately calls _read, this should never be a problem
    assert.strictEqual(this[kOtherSide][kCallback], null)
    // Let Node.js know when _read has been called
    this[kOtherSide][kCallback] = callback
    // And finally, send the other side the data to be read
    this[kOtherSide].push(chunk)
  }

  _final (callback) {
    // Ask the other side to let us know it received our EOF request
    this[kOtherSide].on('end', callback)
    // And finally, pushing null signals the end of the stream
    this[kOtherSide].push(null)
  }
}

function makeDuplexPair () {
  // Create two pairs of
  const clientSide = new DuplexSocket({ objectMode: true })
  const serverSide = new DuplexSocket({ objectMode: true })
  // Set the other-side reference
  clientSide[kOtherSide] = serverSide
  serverSide[kOtherSide] = clientSide
  // Both instances behave the same, so choice of name doesn't matter,
  // So long as they're distinguishable.
  return { clientSide, serverSide }
}

module.exports = makeDuplexPair
