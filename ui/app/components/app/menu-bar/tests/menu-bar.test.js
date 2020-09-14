import assert from 'assert'
import React from 'react'
import configureStore from 'redux-mock-store'
import { fireEvent } from '@testing-library/react'
import render from '../../../../../../test/lib/render-helpers'
import MenuBar from '..'

describe('MenuBar', function () {

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
          accounts: [
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          ],
        },
      ],
      frequentRpcListDetail: [],
    },
  }

  const store = configureStore()(initState)

  it('opens account detail menu when account options is clicked', function () {
    const { getByTitle, getByText } = render(<MenuBar />, store)

    const accountOptionsButton = getByTitle('[accountOptions]')
    fireEvent.click(accountOptionsButton)

    const expandView = getByText(/expandView/u)
    const accountDetails = getByText(/accountDetails/u)
    const viewOnEtherscan = getByText(/accountDetails/u)
    const connectedSites = getByText(/accountDetails/u)

    assert(expandView)
    assert(accountDetails)
    assert(viewOnEtherscan)
    assert(connectedSites)

  })
})
