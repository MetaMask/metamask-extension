const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const MetaMaskController = require('../../app/scripts/metamask-controller')
const firstTimeState = require('../../app/scripts/first-time-state')

describe('MetaMaskController', function () {
  const noop = () => {}
  const metamaskController = new MetaMaskController({
    showUnconfirmedMessage: noop,
    unlockAccountMessage: noop,
    showUnapprovedTx: noop,
    // initial state
    initState: clone(firstTimeState),
  })

  beforeEach(function () {
    // sinon allows stubbing methods that are easily verified
    this.sinon = sinon.sandbox.create()
  })

  afterEach(function () {
    // sinon requires cleanup otherwise it will overwrite context
    this.sinon.restore()
  })

  describe('Metamask Controller', function () {
    assert(metamaskController)
  })
})

