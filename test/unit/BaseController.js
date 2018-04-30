const assert = require('assert')
const sinon = require('sinon')
const BaseController = require('../../app/scripts/controllers/ts/BaseController').default

const TEST_OBJ = { foo: 'bar' }

describe('BaseController', () => {
  it('should set initial state', () => {
    const controller = new BaseController({}, TEST_OBJ)
    assert.deepEqual(controller.state, TEST_OBJ)
  })

  it('should set and merge state', () => {
    const controller = new BaseController({}, TEST_OBJ)
    controller.updateState({ bar: 'baz' })
    assert.deepEqual(controller.state, { foo: 'bar', bar: 'baz' })
  })

  it('should notify all listeners', () => {
    const controller = new BaseController({}, TEST_OBJ)
    const listenerOne = sinon.stub()
    const listenerTwo = sinon.stub()
    controller.subscribe(listenerOne)
    controller.subscribe(listenerTwo)
    controller.notify()
    assert(listenerOne.calledOnce)
    assert(listenerTwo.calledOnce)
    assert.deepEqual(listenerOne.getCall(0).args[0], TEST_OBJ)
    assert.deepEqual(listenerTwo.getCall(0).args[0], TEST_OBJ)
  })

  it('should notify listeners on update', () => {
    const controller = new BaseController({})
    const listener = sinon.stub()
    controller.subscribe(listener)
    controller.updateState(TEST_OBJ)
    assert(listener.calledOnce)
    assert.deepEqual(listener.getCall(0).args[0], TEST_OBJ)
  })

  it('should not notify unsubscribed listeners', () => {
    const controller = new BaseController({}, TEST_OBJ)
    const listener = sinon.stub()
    controller.subscribe(listener)
    controller.unsubscribe(listener)
    controller.notify()
    assert(!listener.called)
  })

  it('should not notify listeners when disabled', () => {
    const controller = new BaseController({}, TEST_OBJ)
    controller.disabled = true
    const listener = sinon.stub()
    controller.subscribe(listener)
    controller.notify()
    assert(!listener.called)
  })
})
