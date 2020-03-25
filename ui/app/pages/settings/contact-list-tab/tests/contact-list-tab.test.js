import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'

import {
  CONTACT_ADD_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
} from '../../../../helpers/constants/routes'
import ContactListTab from '../index'

describe('Contact List Tab', function () {

  let wrapper

  const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'

  const mockState = {
    metamask: {
      identities: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          name: 'Account 1',
          address,
        },
      },
      accounts: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address,
          balances: '0x0',
        },
      },
      network: '101',
      addressBook: {
        '101': {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address,
            chainId: '1',
            isEns: false,
            memo: '',
            name: 'test',
          },
        },
      },
      send: {
        to: '',
      },
      cachedBalances: {
        '101': {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': '0x0',
        },
      },
    },
    appState: {
      qrCodeData: {},
    },
  }

  const store = configureStore()(mockState)

  after(function () {
    sinon.restore()
  })

  describe('simulate click routing', function () {

    const location = {
      pathname: '/settings/contact-list',
    }

    const props = {
      addressBook: [
        {
          address,
          chainId: '101',
          isEns: false,
          memo: '',
          name: 'test',
        },
      ],
      history: {
        push: sinon.spy(),
      },
    }

    beforeEach(function () {
      wrapper = mountWithRouter(
        <Provider store={store}>
          <ContactListTab.WrappedComponent {...props} />
        </Provider>, location.pathname
      )
    })

    afterEach(function () {
      props.history.push.resetHistory()
    })

    after(function () {
      sinon.restore()
    })

    it('simulates clicking individual account route', function () {
      const select = wrapper.find('.send__select-recipient-wrapper__group-item')
      select.simulate('click')

      assert.equal(props.history.push.getCall(0).args[0], `${CONTACT_VIEW_ROUTE}/${address}`)
    })

    it('simulates clicking the my account contact route', function () {
      const select = wrapper.find('.address-book__my-accounts-button')

      select.simulate('click')

      assert.equal(props.history.push.getCall(0).args[0], CONTACT_MY_ACCOUNTS_ROUTE)
    })

    it('simulates clicking the add contact route', function () {
      const select = wrapper.find('.address-book-add-button__button')

      select.simulate('click')

      assert.equal(props.history.push.getCall(0).args[0], CONTACT_ADD_ROUTE)
    })
  })

  describe('ViewContact', function () {

    const location = {
      pathname: `/settings/contact-list/view-contact/${address}`,
    }

    const props = {
      viewingContact: true,
      showContactContent: true,
      addressBook: [
        {
          address: address,
          chainId: '101',
          isEns: false,
          memo: '',
          name: 'test',
        },
      ],
    }

    const wrapper = mountWithRouter(
      <Provider store={store}>
        <ContactListTab.WrappedComponent {...props} />
      </Provider>, location.pathname
    )

    it('renders adding contact via viewingContact in props', function () {
      assert.equal(wrapper.find('ViewContact').length, 1)
    })

  })

  describe('EditContact', function () {

    const location = {
      pathname: `/settings/contact-list/view-contact/${address}`,
    }

    const props = {
      editingContact: true,
      showContactContent: true,
      addressBook: [
        {
          address: address,
          chainId: '101',
          isEns: false,
          memo: '',
          name: 'test',
        },
      ],
    }

    const wrapper = mountWithRouter(
      <Provider store={store}>
        <ContactListTab.WrappedComponent {...props} />
      </Provider>, location.pathname
    )

    it('renders adding contact via editingContact in props', function () {
      assert.equal(wrapper.find('EditContact').length, 1)
    })
  })

  describe('AddContact', function () {

    const location = {
      pathname: `/settings/contact-list/view-contact/${address}`,
    }

    const props = {
      addingContact: true,
      showContactContent: true,
      addressBook: [
        {
          address: address,
          chainId: '101',
          isEns: false,
          memo: '',
          name: 'test',
        },
      ],
    }

    const wrapper = mountWithRouter(
      <Provider store={store}>
        <ContactListTab.WrappedComponent {...props} />
      </Provider>, location.pathname
    )

    it('renders adding contact via addingContact in props', function () {
      assert.equal(wrapper.find('AddContact').length, 1)
    })
  })

  describe('ViewContact 2', function () {

    const location = {
      pathname: `/settings/contact-list/view-contact/${address}`,
    }

    const props = {
      hideAddressBook: false,
      showingMyAccounts: true,
      addressBook: [
        {
          address: address,
          chainId: '101',
          isEns: false,
          memo: '',
          name: 'test',
        },
      ],
    }

    const wrapper = mountWithRouter(
      <Provider store={store}>
        <ContactListTab.WrappedComponent {...props} />
      </Provider>, location.pathname
    )

    it('renders adding contact via addingContact in props', function () {
      assert.equal(wrapper.find('ViewContact').length, 1)
    })
  })

})
