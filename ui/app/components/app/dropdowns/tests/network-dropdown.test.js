import assert from 'assert'
import React from 'react'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import NetworkDropdown from '../network-dropdown'
import { DropdownMenuItem } from '../components/dropdown'
import NetworkDropdownIcon from '../components/network-dropdown-icon'

describe('Network Dropdown', function () {
  let wrapper
  const createMockStore = configureMockStore([thunk])

  describe('NetworkDropdown in appState in false', function () {
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

    beforeEach(function () {
      wrapper = mountWithRouter(
        <NetworkDropdown store={store} />,
      )
    })

    it('checks for network droppo class', function () {
      assert.equal(wrapper.find('.network-droppo').length, 1)
    })

    it('renders only one child when networkDropdown is false in state', function () {
      assert.equal(wrapper.children().length, 1)
    })

  })

  describe('NetworkDropdown in appState is true', function () {
    const mockState = {
      metamask: {
        network: '1',
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

    beforeEach(function () {
      wrapper = mountWithRouter(
        <NetworkDropdown store={store} />,
      )
    })

    it('renders 7 DropDownMenuItems ', function () {
      assert.equal(wrapper.find(DropdownMenuItem).length, 8)
    })

    it('checks background color for first NetworkDropdownIcon', function () {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(0).prop('backgroundColor'), '#29B6AF') // Ethereum Mainnet Teal
    })

    it('checks background color for second NetworkDropdownIcon', function () {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(1).prop('backgroundColor'), '#ff4a8d') // Ropsten Red
    })

    it('checks background color for third NetworkDropdownIcon', function () {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(2).prop('backgroundColor'), '#7057ff') // Kovan Purple
    })

    it('checks background color for fourth NetworkDropdownIcon', function () {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(3).prop('backgroundColor'), '#f6c343') // Rinkeby Yellow
    })

    it('checks background color for fifth NetworkDropdownIcon', function () {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(4).prop('backgroundColor'), '#3099f2') // Goerli Blue
    })

    it('checks background color for sixth NetworkDropdownIcon', function () {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(5).prop('innerBorder'), '1px solid #9b9b9b')
    })

    it('checks dropdown for frequestRPCList from  state ', function () {
      assert.equal(wrapper.find(DropdownMenuItem).at(6).text(), '✓http://localhost:7545')
    })

    it('checks background color for seventh NetworkDropdownIcon', function () {
      assert.equal(wrapper.find(NetworkDropdownIcon).at(6).prop('innerBorder'), '1px solid #9b9b9b')
    })

  })
})
