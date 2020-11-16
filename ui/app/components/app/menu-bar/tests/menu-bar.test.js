import assert from 'assert'
import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import MenuBar from '..'

const initState = {
  activeTab: {},
  metamask: {
    network: '1',
    selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    identities: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Account 1',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
      },
    ],
    frequentRpcListDetail: [],
  },
}
const mockStore = configureStore()

describe('MenuBar', function () {
  it('opens account detail menu when account options is clicked', function () {
    const store = mockStore(initState)
    const wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar />
      </Provider>,
    )
    assert.ok(!wrapper.exists('AccountOptionsMenu'))
    const accountOptions = wrapper.find('.menu-bar__account-options')
    accountOptions.simulate('click')
    wrapper.update()
    assert.ok(wrapper.exists('AccountOptionsMenu'))
  })

  it('sets accountDetailsMenuOpen to false when closed', function () {
    const store = mockStore(initState)
    const wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar />
      </Provider>,
    )
    const accountOptions = wrapper.find('.menu-bar__account-options')
    accountOptions.simulate('click')
    wrapper.update()
    assert.ok(wrapper.exists('AccountOptionsMenu'))
    const accountDetailsMenu = wrapper.find('AccountOptionsMenu')
    accountDetailsMenu.prop('onClose')()
    wrapper.update()
    assert.ok(!wrapper.exists('AccountOptionsMenu'))
  })
})
