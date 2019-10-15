import assert from 'assert'
import React from 'react'
import { spy } from 'sinon'

import AccountMenu from '../account-menu.component'
import shallow from '../../../../../lib/shallow-with-context'
import TextField from '../../../ui/text-field'

describe('AccountDetails', () => {
  const fooAccount = {
    name: 'FOO',
    address: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
    balance: '0x0',
  }

  const barAccount = {
    name: 'BAR',
    address: '0x1fe9aAB565Be19629fF4e8541ca2102fb42D7724',
    balance: '0x0',
  }

  const commonProps = {
    shouldShowAccountsSearch: true,
    accounts: [
      fooAccount,
      barAccount,
    ],
    keyrings: [
      {
        accounts: [fooAccount.address, barAccount.address],
        type: 'HD Key Tree',
      },
    ],
    selectedAddress: fooAccount.address,
    isAccountMenuOpen: true,
    history: {},
    lockMetamask: spy(),
    showAccountDetail: spy(),
    showRemoveAccountConfirmationModal: spy(),
    toggleAccountMenu: spy(),
  }

  describe('accounts search', () => {
    it('should filter accounts by name', () => {
      const wrapper = shallow(<AccountMenu {...commonProps} />)

      assert.equal(wrapper.find('.account-menu__name').length, 2)

      wrapper.find(TextField).simulate('change', { target: { value: fooAccount.name } })

      assert.equal(wrapper.find('.account-menu__name').length, 1)
      assert.equal(wrapper.find('.account-menu__name').at(0).text(), fooAccount.name)
    })

    it('should filter accounts by address', () => {
      const wrapper = shallow(<AccountMenu {...commonProps} />)

      assert.equal(wrapper.find('.account-menu__name').length, 2)

      wrapper.find(TextField).simulate('change', { target: { value: barAccount.address } })

      assert.equal(wrapper.find('.account-menu__name').length, 1)
      assert.equal(wrapper.find('.account-menu__name').at(0).text(), barAccount.name)
    })
  })
})
