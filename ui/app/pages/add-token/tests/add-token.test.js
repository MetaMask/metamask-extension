import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'
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
    wrapper = mount(
      <AddToken.WrappedComponent {...props} />, {
        context: {
          t: str => str,
          store,
        },
        childContextTypes: {
          store: React.PropTypes.object,
        },
      }
    )

    wrapper.find({ name: 'customToken'}).simulate('click')
  })

  afterEach(() => {
    props.history.push.reset()
  })

  describe('Add Token', () => {

    it('next button is disabled when no fields are populated', () => {
      const nextButton = wrapper.find('.button.btn-secondary.btn--large.page-container__footer-button')

      assert.equal(nextButton.props().disabled, true)
    })

    it('edits token address', () => {
      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4'
      const event = { target: { value: tokenAddress } }
      const customAddress = wrapper.find('#custom-address')
      customAddress.last().simulate('change', event)

      assert.equal(wrapper.state().customAddress, tokenAddress)
    })


    it('edits token symbol', () => {
      const tokenSymbol = 'META'
      const event = { target: { value: tokenSymbol } }
      const customAddress = wrapper.find('#custom-symbol')
      customAddress.last().simulate('change', event)

      assert.equal(wrapper.state().customSymbol, tokenSymbol)
    })

    it('edits token decimal precision', () => {
      const tokenPrecision = '2'
      const event = { target: { value: tokenPrecision } }
      const customAddress = wrapper.find('#custom-decimals')
      customAddress.last().simulate('change', event)

      assert.equal(wrapper.state().customDecimals, tokenPrecision)

    })

    it('next', () => {
      const nextButton = wrapper.find('.button.btn-secondary.btn--large.page-container__footer-button')
      nextButton.simulate('click')

      assert(props.setPendingTokens.calledOnce)
      assert(props.history.push.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/confirm-add-token')
    })

    it('cancels', () => {
      const cancelButton = wrapper.find('button.btn-default.btn--large.page-container__footer-button')
      cancelButton.simulate('click')

      assert(props.clearPendingTokens.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/')
    })
  })

})
