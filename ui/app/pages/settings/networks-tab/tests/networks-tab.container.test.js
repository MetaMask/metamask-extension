import React from 'react'
import { Provider } from 'react-redux'
import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import NetworksTab from '../index'
import { defaultNetworksData } from '../networks-tab.constants'

const defaultNetworks = defaultNetworksData.map((network) => ({ ...network, viewOnly: true }))

describe('Networks Tab', function () {

  let wrapper

  const mockStore = {
    metamask: {
      frequentRpcListDetail: [],
      provider: {
        type: 'test',
        rpcTarget: 'https://foo.bar',
      },
    },
    appState: {
      networksTabSelectedRpcUrl: null,
      networksTabIsInAddMode: false,
    },
  }

  const store = configureMockStore()(mockStore)

  beforeEach(function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <NetworksTab />
      </Provider>
    )
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('sets props from state', function () {

    assert.deepEqual(wrapper.find('NetworksTab').prop('networksToRender'), defaultNetworks)

    assert.equal(wrapper.find('NetworksTab').prop('networkIsSelected'), false)
    assert.equal(wrapper.find('NetworksTab').prop('networksTabIsInAddMode'), mockStore.appState.networksTabIsInAddMode)
    assert.equal(wrapper.find('NetworksTab').prop('providerType'), mockStore.metamask.provider.type)
    assert.equal(wrapper.find('NetworksTab').prop('providerUrl'), mockStore.metamask.provider.rpcTarget)
    assert.equal(wrapper.find('NetworksTab').prop('networkDefaultedToProvider'), true)

  })

})
