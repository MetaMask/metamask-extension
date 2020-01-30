import React from 'react'
import { Provider } from 'react-redux'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import AddToken from '../index'

describe('Add Token', () => {
  let wrapper

  const state = {
    metamask: {
      tokens: [],
    },
  }

  const mockStore = configureMockStore()
  const store = mockStore(state)

  const props = {
    history: {
      push: sinon.stub().callsFake(() => {}),
    },
    setPendingTokens: sinon.spy(),
    clearPendingTokens: sinon.spy(),
    tokens: [],
    identities: {},
  }

  before(() => {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <AddToken.WrappedComponent {...props} />
      </Provider>, store
    )

    wrapper.find({ name: 'customToken' }).simulate('click')
  })

  afterEach(() => {
    props.history.push.reset()
  })

  describe('Add Token', () => {

    it('next button is disabled when no fields are populated', () => {
      const nextButton = wrapper.find('.button.btn-secondary.page-container__footer-button')

      assert.equal(nextButton.props().disabled, true)
    })

    it('edits token address', () => {
      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4'
      const event = { target: { value: tokenAddress } }
      const customAddress = wrapper.find('input#custom-address')

      customAddress.simulate('change', event)
      assert.equal(wrapper.find('AddToken').instance().state.customAddress, tokenAddress)
    })


    it('edits token symbol', () => {
      const tokenSymbol = 'META'
      const event = { target: { value: tokenSymbol } }
      const customAddress = wrapper.find('#custom-symbol')
      customAddress.last().simulate('change', event)

      assert.equal(wrapper.find('AddToken').instance().state.customSymbol, tokenSymbol)
    })

    it('edits token decimal precision', () => {
      const tokenPrecision = '2'
      const event = { target: { value: tokenPrecision } }
      const customAddress = wrapper.find('#custom-decimals')
      customAddress.last().simulate('change', event)

      assert.equal(wrapper.find('AddToken').instance().state.customDecimals, tokenPrecision)

    })

    it('next', () => {
      const nextButton = wrapper.find('.button.btn-secondary.page-container__footer-button')
      nextButton.simulate('click')

      assert(props.setPendingTokens.calledOnce)
      assert(props.history.push.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/confirm-add-token')
    })

    it('cancels', () => {
      const cancelButton = wrapper.find('button.btn-default.page-container__footer-button')
      cancelButton.simulate('click')

      assert(props.clearPendingTokens.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/')
    })
  })

})
