import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import AccountDropdownMini from '../account-dropdown-mini.component'
import AccountListItem from '../../../app/send/account-list-item/account-list-item.component'

describe('AccountDropdownMini', () => {
  it('should render an account with an icon', () => {
    const accounts = [
      {
        address: '0x1',
        name: 'account1',
        balance: '0x1',
      },
      {
        address: '0x2',
        name: 'account2',
        balance: '0x2',
      },
      {
        address: '0x3',
        name: 'account3',
        balance: '0x3',
      },
    ]

    const wrapper = shallow(
      <AccountDropdownMini
        selectedAccount={{ address: '0x1', name: 'account1', balance: '0x1' }}
        accounts={accounts}
      />
    )

    assert.ok(wrapper)
    assert.equal(wrapper.find(AccountListItem).length, 1)
    const accountListItemProps = wrapper.find(AccountListItem).at(0).props()
    assert.equal(accountListItemProps.account.address, '0x1')
    const iconProps = accountListItemProps.icon.props
    assert.equal(iconProps.className, 'fa fa-caret-down fa-lg')
  })

  it('should render a list of accounts', () => {
    const accounts = [
      {
        address: '0x1',
        name: 'account1',
        balance: '0x1',
      },
      {
        address: '0x2',
        name: 'account2',
        balance: '0x2',
      },
      {
        address: '0x3',
        name: 'account3',
        balance: '0x3',
      },
    ]

    const wrapper = shallow(
      <AccountDropdownMini
        selectedAccount={{ address: '0x1', name: 'account1', balance: '0x1' }}
        accounts={accounts}
        dropdownOpen={true}
      />
    )

    assert.ok(wrapper)
    assert.equal(wrapper.find(AccountListItem).length, 4)
  })

  it('should render a single account when disabled', () => {
    const accounts = [
      {
        address: '0x1',
        name: 'account1',
        balance: '0x1',
      },
      {
        address: '0x2',
        name: 'account2',
        balance: '0x2',
      },
      {
        address: '0x3',
        name: 'account3',
        balance: '0x3',
      },
    ]

    const wrapper = shallow(
      <AccountDropdownMini
        selectedAccount={{ address: '0x1', name: 'account1', balance: '0x1' }}
        accounts={accounts}
        dropdownOpen={false}
        disabled={true}
      />
    )

    assert.ok(wrapper)
    assert.equal(wrapper.find(AccountListItem).length, 1)
    const accountListItemProps = wrapper.find(AccountListItem).at(0).props()
    assert.equal(accountListItemProps.account.address, '0x1')
    assert.equal(accountListItemProps.icon, false)
  })
})
