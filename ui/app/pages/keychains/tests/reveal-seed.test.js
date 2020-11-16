import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import RevealSeedPage from '../reveal-seed'

describe('Reveal Seed Page', function () {
  it('form submit', function () {
    const props = {
      history: {
        push: sinon.spy(),
      },
      requestRevealSeedWords: sinon.stub().resolves(),
    }
    const wrapper = mount(<RevealSeedPage.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    })

    wrapper.find('form').simulate('submit')
    assert(props.requestRevealSeedWords.calledOnce)
  })
})
