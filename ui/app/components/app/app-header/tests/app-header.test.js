import assert from 'assert'
import React from 'react'
import configureMockStore from 'redux-mock-store'
import render from '../../../../../../test/lib/render-helpers'
import {
  MAINNET,
  ROPSTEN,
  RINKEBY,
  KOVAN,
  GOERLI,
  MAINNET_NETWORK_ID,
  ROPSTEN_NETWORK_ID,
  RINKEBY_NETWORK_ID,
  KOVAN_NETWORK_ID,
  GOERLI_NETWORK_ID,
} from '../../../../../../app/scripts/controllers/network/enums'
import AppHeader from '..'

describe('App Header', function () {

  it('renders mainnet based off of provider type in state', function () {
    const mockState = {
      metamask: {
        network: MAINNET_NETWORK_ID,
        provider: {
          type: MAINNET,
        },
      },
      appState: {
        networkDropdownOpen: false,
      },
    }

    const store = configureMockStore()(mockState)

    const { getByText } = render(<AppHeader />, store)

    const network = getByText(/mainnet/u)

    assert(network)

  })

  it('renders ropsten based off of provider type in state', function () {
    const mockState = {
      metamask: {
        network: ROPSTEN_NETWORK_ID,
        provider: {
          type: ROPSTEN,
        },
      },
      appState: {
        networkDropdownOpen: false,
      },
    }

    const store = configureMockStore()(mockState)

    const { getByText } = render(<AppHeader />, store)

    const network = getByText(/ropsten/u)

    assert(network)

  })

  it('renders rinkeby based off of provider type in state', function () {
    const mockState = {
      metamask: {
        network: RINKEBY_NETWORK_ID,
        provider: {
          type: RINKEBY,
        },
      },
      appState: {
        networkDropdownOpen: false,
      },
    }

    const store = configureMockStore()(mockState)

    const { getByText } = render(<AppHeader />, store)

    const network = getByText(/rinkeby/u)

    assert(network)

  })

  it('renders kovan based off of provider type in state', function () {
    const mockState = {
      metamask: {
        network: KOVAN_NETWORK_ID,
        provider: {
          type: KOVAN,
        },
      },
      appState: {
        networkDropdownOpen: false,
      },
    }

    const store = configureMockStore()(mockState)

    const { getByText } = render(<AppHeader />, store)

    const network = getByText(/kovan/u)

    assert(network)

  })

  it('renders goerli based off of provider type in state', function () {
    const mockState = {
      metamask: {
        network: GOERLI_NETWORK_ID,
        provider: {
          type: GOERLI,
        },
      },
      appState: {
        networkDropdownOpen: false,
      },
    }

    const store = configureMockStore()(mockState)

    const { getByText } = render(<AppHeader />, store)

    const network = getByText(/goerli/u)

    assert(network)

  })

  it('renders localhost based off of provider type in state', function () {
    const mockState = {
      metamask: {
        network: 'test',
        provider: {
          type: 'other',
        },
      },
      appState: {
        networkDropdownOpen: true,
      },
    }

    const store = configureMockStore()(mockState)

    const { getByText } = render(<AppHeader />, store)

    const network = getByText(/privateNetwork/u)

    assert(network)

  })

})
