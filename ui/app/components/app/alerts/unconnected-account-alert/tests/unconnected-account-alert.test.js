import assert from 'assert'
import React from 'react'

import sinon from 'sinon'
import thunk from 'redux-thunk'

import { fireEvent } from '@testing-library/react'
import configureMockStore from 'redux-mock-store'

import { renderWithProvider } from '../../../../../../../test/lib/render-helpers'

import * as actions from '../../../../../store/actions'
import UnconnectedAccountAlert from '..'

describe('Unconnected Account Alert', function () {
  const network = '123'

  const selectedAddress = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'

  const identities = {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Account 1',
    },
    '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
      address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      name: 'Account 2',
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

  const cachedBalances = {
    123: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': '0x0',
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': '0x0',
    },
  }

  const keyrings = [
    {
      type: 'HD Key Tree',
      accounts: [
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      ],
    },
  ]

  const mockState = {
    metamask: {
      network,
      selectedAddress,
      identities,
      accounts,
      cachedBalances,
      keyrings,
      permissionsHistory: {
        'https://test.dapp': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
            },
          },
        },
      },
      domains: {
        'https://test.dapp': {
          permissions: [
            {
              caveats: [
                {
                  name: 'primaryAccountOnly',
                  type: 'limitResponseLength',
                  value: 1,
                },
                {
                  name: 'exposedAccounts',
                  type: 'filterResponse',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              invoker: 'https://test.dapp',
              parentCapability: 'eth_accounts',
            },
          ],
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
    unconnectedAccount: {
      state: 'OPEN',
    },
  }

  afterEach(function () {
    sinon.restore()
  })

  it('checks that checkbox is checked', function () {
    const store = configureMockStore()(mockState)

    const { getByRole } = renderWithProvider(<UnconnectedAccountAlert />, store)

    const dontShowCheckbox = getByRole('checkbox')

    assert.equal(dontShowCheckbox.checked, false)
    fireEvent.click(dontShowCheckbox)
    assert.equal(dontShowCheckbox.checked, true)
  })

  it('clicks dismiss button and calls dismissAlert action', function () {
    const store = configureMockStore()(mockState)

    const { getByText } = renderWithProvider(<UnconnectedAccountAlert />, store)

    const dismissButton = getByText(/dismiss/u)
    fireEvent.click(dismissButton)

    assert.equal(store.getActions()[0].type, 'unconnectedAccount/dismissAlert')
  })

  it('clicks Dont Show checkbox and dismiss to call disable alert request action', async function () {
    sinon.stub(actions, 'setAlertEnabledness').returns(() => Promise.resolve())

    const store = configureMockStore([thunk])(mockState)

    const { getByText, getByRole } = renderWithProvider(
      <UnconnectedAccountAlert />,
      store,
    )

    const dismissButton = getByText(/dismiss/u)
    const dontShowCheckbox = getByRole('checkbox')

    fireEvent.click(dontShowCheckbox)
    fireEvent.click(dismissButton)

    setImmediate(() => {
      assert.equal(
        store.getActions()[0].type,
        'unconnectedAccount/disableAlertRequested',
      )
      assert.equal(
        store.getActions()[1].type,
        'unconnectedAccount/disableAlertSucceeded',
      )
    })
  })
})
