import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import ConfirmAddSuggestedToken from '../index'

describe('Confirm Add Suggested Token', () => {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    clearPendingTokens: sinon.spy(),
    addToken: sinon.spy(),
    removeSuggestedTokens: sinon.spy(),
    pendingTokens: {},
  }

  beforeEach(() => {
    wrapper = mount(
      <ConfirmAddSuggestedToken.WrappedComponent {...props} />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })
})
