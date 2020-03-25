import React from 'react'
import { Provider } from 'react-redux'
import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'

import {
  SETTINGS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
} from '../../../helpers/constants/routes'
import Settings from '../index'

describe('Settings', function () {

  const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'

  const mockStore = {
    metamask: {
      network: '101',
      identities: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address,
          name: 'Account 1',
        },
      },
      accounts: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address,
          balance: '0x0',
        },
      },
      cachedBalances: {
        101: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': '0x0',
        },
      },
      addressBook: {},
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
    appState: {
      warning: '',
    },
  }

  const store = configureMockStore()(mockStore)

  describe('Settings Routing', function () {

    it('sets settings route as backRoute pro when on /settings', function () {
      const wrapper = mountWithRouter(
        <Provider store={store}>
          <Settings />
        </Provider>, SETTINGS_ROUTE
      )

      assert.equal(wrapper.find('SettingsPage').prop('backRoute'), SETTINGS_ROUTE)
    })

    it('sets my account route as backRoute prop when on /my-accounts/view/{address}', function () {
      const wrapper = mountWithRouter(
        <Provider store={store}>
          <Settings />
        </Provider>, `${CONTACT_MY_ACCOUNTS_VIEW_ROUTE}/${address}`
      )

      assert.equal(wrapper.find('SettingsPage').prop('backRoute'), CONTACT_MY_ACCOUNTS_ROUTE)
    })


    it('sets my account route as backRoute prop when on /my-accounts/edit/{address}', function () {
      const wrapper = mountWithRouter(
        <Provider store={store}>
          <Settings />
        </Provider>, `${CONTACT_MY_ACCOUNTS_EDIT_ROUTE}/${address}`
      )

      assert.equal(wrapper.find('SettingsPage').prop('backRoute'), CONTACT_MY_ACCOUNTS_ROUTE)
    })

    it('back button routes to contact list route when on contact view rout', function () {
      const wrapper = mountWithRouter(
        <Provider store={store}>
          <Settings />
        </Provider>, `${CONTACT_VIEW_ROUTE}/${address}`
      )

      assert.equal(wrapper.find('SettingsPage').prop('backRoute'), CONTACT_LIST_ROUTE)
    })

    it('back button routes to contact view route when on contact edit rout', function () {
      const wrapper = mountWithRouter(
        <Provider store={store}>
          <Settings />
        </Provider>, `${CONTACT_EDIT_ROUTE}/${address}`
      )

      assert.equal(wrapper.find('SettingsPage').prop('backRoute'), `${CONTACT_VIEW_ROUTE}/${address}`)
    })
  })

})
