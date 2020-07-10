import React from 'react'
import assert from 'assert'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import MenuBar from '../index'

const initState = {
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
        accounts: [
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        ],
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
      </Provider>
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
      </Provider>
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

  it('should contains Ethplorer menu item for main net', function () {
    const store = mockStore(initState)
    const wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar />
      </Provider>
    )
    const accountOptions = wrapper.find('.menu-bar__account-options')
    accountOptions.simulate('click')
    wrapper.update()

    const ethplorerMenuItem = wrapper
      .find('MenuItem')
      .findWhere(item => item.key() === 'ethplorer')

    assert.equal(ethplorerMenuItem.length, 1)
  })

  it('should not contains Ethplorer menu item for not main net', function () {
    const store = mockStore({
      ...initState,
      metamask: {
        ...initState.metamask,
        network: '2'
      }
    })
    const wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar />
      </Provider>
    )
    const accountOptions = wrapper.find('.menu-bar__account-options')
    accountOptions.simulate('click')
    wrapper.update()

    const ethplorerMenuItem = wrapper
      .find('MenuItem')
      .findWhere(item => item.key() === 'ethplorer')

    assert.equal(ethplorerMenuItem.length, 0)
  })
})
