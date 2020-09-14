import assert from 'assert'
import React from 'react'
import configureStore from 'redux-mock-store'
import { screen, fireEvent } from '@testing-library/react'
import sinon from 'sinon'
import render from '../../../../../../test/lib/render-helpers'
import AccountListItem from '..'

describe('AccountListItem Component', function () {
  const selectedAddress = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'

  const cachedBalances = {
    '123': {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': '0x0',
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': '0x0',
    },
  }

  const accounts = {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      balance: '0x0',
    },
    '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
      address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      balance: '0x0',
    },
  }

  const mockState = {
    metamask: {
      selectedAddress,
      accounts,
      cachedBalances,
    },
  }

  const store = configureStore()(mockState)

  describe('render', function () {

    after(function () {
      sinon.restore()
    })

    it('handle click', function () {
      const props = {
        account: {
          name: 'Account Test',
          address: selectedAddress,
          balance: '0x0',
        },
        handleClick: sinon.spy(),
      }

      render(<AccountListItem {...props} />, store)

      const accountItem = screen.getByText(props.account.name)
      fireEvent.click(accountItem)

      assert(props.handleClick.calledOnce)
      assert.deepEqual(props.handleClick.getCall(0).args[0], props.account)
    })

    it('should show the account name if it exists', function () {
      const props = {
        account: {
          name: 'Account Test',
          address: selectedAddress,
          balance: '0x0',
        },
        handleClick: sinon.spy(),
      }

      render(<AccountListItem {...props} />, store)

      const accountItem = screen.getByText(props.account.name)
      assert(accountItem)
    })

    it('should show the account address if there is no name', function () {
      const props = {
        account: {
          address: selectedAddress,
          balance: '0x0',
        },
        handleClick: sinon.spy(),
      }

      render(<AccountListItem {...props} />, store)

      const accountItem = screen.getByText(props.account.address)
      assert(accountItem)
    })
  })
})
