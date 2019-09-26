import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import RevealSeedPage from '../reveal-seed'

describe('Reveal Seed Page', () => {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    requestRevealSeedWords: sinon.stub().resolves(),
  }

  beforeEach(() => {
    wrapper = mount(
      <RevealSeedPage.WrappedComponent {...props} />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  it('form submit', () => {
    wrapper.find('form').simulate('submit')
    assert(props.requestRevealSeedWords.calledOnce)
  })
})
