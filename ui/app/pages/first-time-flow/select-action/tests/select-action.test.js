import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import SelectAction from '..'

describe('Selection Action', function () {
  let wrapper

  const props = {
    isInitialized: false,
    setFirstTimeFlowType: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
  }

  beforeEach(function () {
    wrapper = mountWithRouter(<SelectAction.WrappedComponent {...props} />)
  })

  afterEach(function () {
    props.setFirstTimeFlowType.resetHistory()
    props.history.push.resetHistory()
  })

  it('clicks import wallet to route to import FTF', function () {
    const importWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(0)
    importWalletButton.simulate('click')

    assert(props.setFirstTimeFlowType.calledOnce)
    assert.equal(props.setFirstTimeFlowType.getCall(0).args[0], 'import')
    assert(props.history.push.calledOnce)
  })

  it('clicks create wallet to route to create FTF ', function () {
    const createWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(1)
    createWalletButton.simulate('click')

    assert(props.setFirstTimeFlowType.calledOnce)
    assert.equal(props.setFirstTimeFlowType.getCall(0).args[0], 'create')
    assert(props.history.push.calledOnce)
  })
})
