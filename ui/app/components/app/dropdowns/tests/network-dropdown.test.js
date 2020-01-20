import React from 'react'
import assert from 'assert'
import { createMockStore } from 'redux-test-utils'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import NetworkDropdown from '../network-dropdown'
import { DropdownMenuItem } from '../components/dropdown'
import NetworkDropdownIcon from '../components/network-dropdown-icon'

describe('Network Dropdown', () => {
  let wrapper

  describe('NetworkDropdown in appState in false', () => {
    const mockState = {
      metamask: {
        network: '1',
        provider: {
          type: 'test',
        },
      },
      appState: {
        networkDropdownOpen: false,
      },
    }

    const store = createMockStore(mockState)

    beforeEach(() => {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />)
    })

    it('checks for network droppo class', () => {
      assert.equal(wrapper.find('.network-droppo').length, 1)
    })

    it('renders only one child when networkDropdown is false in state', () => {
      assert.equal(wrapper.children().length, 1)
    })
  })

  describe('NetworkDropdown in appState is true', () => {
    const mockState = {
      metamask: {
        network: '1',
        provider: {
          type: 'test',
        },
        frequentRpcListDetail: [{ rpcUrl: 'http://localhost:7545' }],
      },
      appState: {
        networkDropdownOpen: true,
      },
    }
    const store = createMockStore(mockState)

    beforeEach(() => {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />)
    })

    it('renders 5 DropDownMenuItems ', () => {
      assert.equal(wrapper.find(DropdownMenuItem).length, 5)
    })

    it('checks background color for first NetworkDropdownIcon', () => {
      assert.equal(
        wrapper
          .find(NetworkDropdownIcon)
          .at(0)
          .prop('backgroundColor'),
        '#29B6AF'
      ) // Main Conflux Network Teal
    })

    it('checks background color for second NetworkDropdownIcon', () => {
      assert.equal(
        wrapper
          .find(NetworkDropdownIcon)
          .at(1)
          .prop('backgroundColor'),
        '#ff4a8d'
      ) // Ropsten Red
    })

    it.skip('checks background color for third NetworkDropdownIcon', () => {
      assert.equal(
        wrapper
          .find(NetworkDropdownIcon)
          .at(2)
          .prop('backgroundColor'),
        '#7057ff'
      ) // Kovan Purple
    })

    it.skip('checks background color for fourth NetworkDropdownIcon', () => {
      assert.equal(
        wrapper
          .find(NetworkDropdownIcon)
          .at(3)
          .prop('backgroundColor'),
        '#f6c343'
      ) // Rinkeby Yellow
    })

    it.skip('checks background color for fifth NetworkDropdownIcon', () => {
      assert.equal(
        wrapper
          .find(NetworkDropdownIcon)
          .at(4)
          .prop('backgroundColor'),
        '#3099f2'
      ) // Goerli Blue
    })

    it('checks background color for third NetworkDropdownIcon', () => {
      assert.equal(
        wrapper
          .find(NetworkDropdownIcon)
          .at(2)
          .prop('innerBorder'),
        '1px solid #9b9b9b'
      )
    })

    it('checks dropdown for frequestRPCList from  state ', () => {
      assert.equal(
        wrapper
          .find(DropdownMenuItem)
          .at(3)
          .text(),
        '✓http://localhost:7545'
      )
    })

    it('checks background border for forth NetworkDropdownIcon', () => {
      assert.equal(
        wrapper
          .find(NetworkDropdownIcon)
          .at(3)
          .prop('innerBorder'),
        '1px solid #9b9b9b'
      )
    })
  })
})
