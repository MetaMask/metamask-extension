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
        provider: {
          type: 'test',
        },
      },
      appState: {
        networkDropdown: false,
      },
    }

    const store = createMockStore(mockState)

    beforeEach(() => {
      wrapper = mountWithRouter(
        <NetworkDropdown store={store} />
      )
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
        provider: {
          'type': 'test',
        },
        frequentRpcListDetail: [
          { rpcUrl: 'http://localhost:7545' },
        ],
      },
      appState: {
        'networkDropdownOpen': true,
      },
    }
    const store = createMockStore(mockState)

    beforeEach(() => {
      wrapper = mountWithRouter(
        <NetworkDropdown store={store}/>,
      )
    })

    it('renders 13 DropDownMenuItems ', () => {
      assert.equal(wrapper.find(DropdownMenuItem).length, 13)
    })

    it('checks background color for first NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(0).prop('backgroundColor'), '#29B6AF') // Main Ethereum Network Teal - Infura
    })

    it('checks background color for second NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(1).prop('backgroundColor'), '#29B6AF') // Main Ethereum Network Teal - Pocket
    })

    it('checks background color for third NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(2).prop('backgroundColor'), '#ff4a8d') // Ropsten Red - Infura
    })

    it('checks background color for fourth NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(3).prop('backgroundColor'), '#ff4a8d') // Ropsten Red - Pocket
    })

    it('checks background color for fifth NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(4).prop('backgroundColor'), '#7057ff') // Kovan Purple - Infura
    })

    it('checks background color for sixth NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(5).prop('backgroundColor'), '#7057ff') // Kovan Purple - Pocket
    })

    it('checks background color for seventh NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(6).prop('backgroundColor'), '#f6c343') // Rinkeby Yellow - Infura
    })

    it('checks background color for eigth NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(7).prop('backgroundColor'), '#f6c343') // Rinkeby Yellow - Pocket
    })

    it('checks background color for ninth NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(8).prop('backgroundColor'), '#3099f2') // Goerli Blue - Infura
    })

    it('checks background color for tenth NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(9).prop('backgroundColor'), '#3099f2') // Goerli Blue - Pocket
    })

    it('checks background color for eleventh NetworkDropdownIcon', () => {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(10).prop('innerBorder'), '1px solid #9b9b9b')
    })

    it('checks dropdown for frequestRPCList from  state ', () => {
      assert.equal(wrapper.find(DropdownMenuItem).at(11).text(), '✓http://localhost:7545')
    })

  })
})
