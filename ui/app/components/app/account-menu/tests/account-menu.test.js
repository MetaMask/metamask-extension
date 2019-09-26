import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import AccountMenu from '../account-menu.container'

describe('Account Menu', async () => {

  let wrapper

  const props = {
    prevIsAccountMenuOpen: false,
    lockMetamask: sinon.spy(),
    showAccountDetail: sinon.spy(),
    showRemoveAccountConfirmationModal: sinon.spy(),
    toggleAccountMenu: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [
          '0xAddress',
        ],
      },
      {
        type: 'Simple Key Pair',
        accounts: [
          '0xImportedAddress',
        ],
      },
    ],
    accounts: {
      '0xAddress': {
        address: '0xAddress',
        balance: '0xde0b6b3a7640000', // 1000000000000000000 wei
      },
      '0xImportedAddress': {
        address: '0xImportedAddress',
        balance: '0x0',
      },
    },
    selectedAddress: '0xAddress',
    identities: {
      '0xAddress': {
        address: '0xAddress',
        name: 'Account 1',
      },
      '0xImportedAddress': {
        address: '0xImportedAddress',
        name: 'Account2',
      },
    },

  }

  beforeEach(() => {
    wrapper = shallow(
      <AccountMenu.WrappedComponent {...props}/>, {
        context: {
          t: str => str,
          metricsEvent: () => {},
        },
      }
    )
  })

  afterEach(() => {
    props.toggleAccountMenu.resetHistory()
    props.history.push.resetHistory()
  })

  describe('Render Content', () => {
    it('returns account name from identities', () => {
      const accountName = wrapper.find('.account-menu__name')
      assert.equal(accountName.length, 2)
    })

    it('renders user preference currency display balance from account balance', () => {
      const accountBalance = wrapper.find('.account-menu__balance')
      assert.equal(accountBalance.length, 2)
    })

    it('simulate click', () => {
      const click = wrapper.find('.account-menu__account.menu__item--clickable')
      click.first().simulate('click')

      assert(props.showAccountDetail.calledOnce)
      assert.equal(props.showAccountDetail.getCall(0).args[0], '0xAddress')
    })

    it('render imported account label', () => {
      const importedAccount = wrapper.find('.keyring-label.allcaps')
      assert.equal(importedAccount.text(), 'imported')
    })

    it('remove account', () => {
      const removeAccount = wrapper.find('.remove-account-icon')
      removeAccount.simulate('click', {
        preventDefault: () => {},
        stopPropagation: () => {},
      })

      assert(props.showRemoveAccountConfirmationModal.calledOnce)
      assert.deepEqual(props.showRemoveAccountConfirmationModal.getCall(0).args[0],
        { address: '0xImportedAddress', name: 'Account2' }
      )
    })
  })

  describe('Log Out', () => {
    let logout
    it('logout', () => {
      logout = wrapper.find('.account-menu__logout-button')
      assert.equal(logout.length, 1)
    })

    it('simulate click', () => {
      logout.simulate('click')
      assert(props.lockMetamask.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/')
    })
  })

  describe('Create Account', () => {
    let createAccount

    it('renders create account item', () => {
      createAccount = wrapper.find({ text: 'createAccount' })
      assert.equal(createAccount.length, 1)
    })

    it('calls toggle menu and push new-account route to history', () => {
      createAccount.simulate('click')
      assert(props.toggleAccountMenu.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/new-account')
    })
  })

  describe('Import Account', () => {
    let importAccount

    it('renders import account item', () => {
      importAccount = wrapper.find({ text: 'importAccount' })
      assert.equal(importAccount.length, 1)
    })

    it('calls toggle menu and push /new-account/import route to history', () => {
      importAccount.simulate('click')
      assert(props.toggleAccountMenu.calledOnce)
      assert(props.history.push.getCall(0).args[0], '/new-account/import')
    })
  })

  describe('Connect Hardware Wallet', () => {

    let connectHardwareWallet

    it('renders import account item', () => {
      connectHardwareWallet = wrapper.find({ text: 'connectHardwareWallet' })
      assert.equal(connectHardwareWallet.length, 1)
    })

    it('calls toggle menu and push /new-account/connect route to history', () => {
      connectHardwareWallet.simulate('click')
      assert(props.toggleAccountMenu.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/new-account/connect')
    })
  })

  describe('Info & Help', () => {

    let infoHelp

    it('renders import account item', () => {
      infoHelp = wrapper.find({ text: 'infoHelp' })
      assert.equal(infoHelp.length, 1)
    })

    it('calls toggle menu and push /new-account/connect route to history', () => {
      infoHelp.simulate('click')
      assert(props.toggleAccountMenu.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/settings/about-us')
    })
  })

  describe('Settings', () => {

    let settings

    it('renders import account item', () => {
      settings = wrapper.find({ text: 'settings' })
      assert.equal(settings.length, 1)
    })

    it('calls toggle menu and push /new-account/connect route to history', () => {
      settings.simulate('click')
      assert(props.toggleAccountMenu.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], '/settings')
    })
  })
})
