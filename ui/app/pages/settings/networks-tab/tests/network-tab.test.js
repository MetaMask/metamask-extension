import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import NetworksTab from '../index'

describe('Networks Tab', () => {
  let wrapper

  const props = {
    editRpc: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
    location: {
      pathname: '/',
    },
    networkIsSelected: true,
    networksTabIsInAddMode: false,
    networksToRender: [],
    selectedNetwork: {},
    setNetworksTabAddMode: sinon.spy(),
    setRpcTarget: sinon.spy(),
    setSelectedSettingsRpcUrl: sinon.spy(),
    providerUrl: '',
    providerType: '',
    networkDefaultedToProvider: true,
  }

  beforeEach(() => {
    wrapper = mount(
      <NetworksTab.WrappedComponent {...props} />, {
        context: {
          t: str => str,
          metricsEvent: () => {},
        },
      }
    )
  })

  it('render', () => {
    assert.equal(wrapper.length, 1)
  })
})
