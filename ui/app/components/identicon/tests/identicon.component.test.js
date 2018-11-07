import React from 'react'
import assert from 'assert'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'
import Identicon from '../identicon.component'

describe('Identicon', () => {
  const state = {
    metamask: {
      useBlockie: false,
    },
  }

  const middlewares = [thunk]
  const mockStore = configureMockStore(middlewares)
  const store = mockStore(state)

  it('renders default eth_logo identicon with no props', () => {
    const wrapper = mount(
      <Identicon store={store}/>
    )

    assert.equal(wrapper.find('img.balance-icon').prop('src'), './images/eth_logo.svg')
  })

  it('renders custom image and add className props', () => {
    const wrapper = mount(
      <Identicon
        store={store}
        className="test-image"
        image="test-image"
      />
    )

    assert.equal(wrapper.find('img.test-image').prop('className'), 'identicon test-image')
    assert.equal(wrapper.find('img.test-image').prop('src'), 'test-image')
  })

  it('renders div with address prop', () => {
    const wrapper = mount(
      <Identicon
        store={store}
        className="test-address"
        address="0xTest"
      />
    )

    assert.equal(wrapper.find('div.test-address').prop('className'), 'identicon test-address')
  })
})
