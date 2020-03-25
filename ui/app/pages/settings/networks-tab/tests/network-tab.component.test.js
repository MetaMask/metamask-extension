import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import NetworksTab from '../networks-tab.component'

describe('Networks Tab', function () {

  let wrapper

  const props = {
    editRpc: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
    location: {},
    selectedNetwork: {
      label: 'xDai',
      iconColor: '#6A737D',
      providerType: 'rpc',
      rpcUrl: 'https://dai.poa.network',
      ticker: '',
      blockExplorerUrl: '',
    },
    networksToRender: [
      {
        labelKey: 'rinkeby',
        iconColor: '#F6C343',
        providerType: 'rinkeby',
        rpcUrl: 'https://api.infura.io/v1/jsonrpc/rinkeby',
        chainId: '4',
        ticker: 'ETH',
        blockExplorerUrl: 'https://rinkeby.etherscan.io',
        viewOnly: true,
      },
      {
        label: 'xDai',
        iconColor: '#6A737D',
        providerType: 'rpc',
        rpcUrl: 'https://dai.poa.network',
        ticker: '',
        blockExplorerUrl: '',
      },
    ],
    setNetworksTabAddMode: sinon.spy(),
    setRpcTarget: sinon.spy(),
    setSelectedSettingsRpcUrl: sinon.spy(),
    showConfirmDeleteNetworkModal: sinon.spy(),

  }

  beforeEach(function () {
    wrapper = mount(
      <NetworksTab {...props} />, {
        context: {
          t: (str) => str,
          metricsEvent: () => {},
        },
      }
    )
  })

  afterEach(function () {
    props.editRpc.resetHistory()
    props.history.push.resetHistory()
    props.setNetworksTabAddMode.resetHistory()
    props.setRpcTarget.resetHistory()
    props.setSelectedSettingsRpcUrl.resetHistory()
    props.showConfirmDeleteNetworkModal.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  it('routes to /settings when no conditional props is met', function () {
    const back = wrapper.find('.networks-tab__back-button')
    back.simulate('click')

    assert(props.history.push.calledOnce)
    assert.equal(props.history.push.getCall(0).args[0], '/settings')

    assert.equal(props.setNetworksTabAddMode.callCount, 0)
    assert(props.setSelectedSettingsRpcUrl.calledOnce, 'called once from componentWillMount')
  })

  it('sets conditional networksTabIsInAddMode prop and calls props when clicked', function () {
    wrapper.setProps({ networksTabIsInAddMode: true })

    const back = wrapper.find('.networks-tab__back-button')
    back.simulate('click')

    assert(props.setNetworksTabAddMode.calledOnce)
    assert(props.setSelectedSettingsRpcUrl.calledTwice, 'calls twice from componentWillMount')

    assert.equal(props.setNetworksTabAddMode.getCall(0).args[0], false)
  })

  it('sets conditional props and calls props when clicked', function () {
    wrapper.setProps({ networkIsSelected: true, networkDefaultedToProvider: false })

    const back = wrapper.find('.networks-tab__back-button')
    back.simulate('click')

    assert(props.setNetworksTabAddMode.calledOnce)
    assert(props.setSelectedSettingsRpcUrl.calledTwice, 'calls once from componentWillMount')
  })

  it('sets associated props is called when clicking add network on subheader', function () {
    const addnetwork = wrapper.find('.btn-secondary').at(0)
    addnetwork.simulate('click')

    assert(props.setNetworksTabAddMode.calledOnce)
    assert(props.setSelectedSettingsRpcUrl.calledTwice, 'calls once from componentWillMount')

    assert.equal(props.setNetworksTabAddMode.getCall(0).args[0], true)
  })

  it('renders network list based on render tx list and sets props when clicked', function () {
    assert.equal(wrapper.find('.networks-tab__networks-list-item').length, 2)

    const rinkebyListItem = wrapper.find('.networks-tab__networks-list-item').at(0)

    rinkebyListItem.simulate('click')

    assert(props.setNetworksTabAddMode.calledOnce)
    assert.equal(props.setNetworksTabAddMode.getCall(0).args[0], false)

    assert(props.setSelectedSettingsRpcUrl.calledTwice)
    assert.equal(props.setSelectedSettingsRpcUrl.getCall(1).args[0], props.networksToRender[0].rpcUrl)
  })

  it('renders addNetwork button on conditiional props and calls props when clicked', function () {
    wrapper.setProps({ networkIsSelected: false, networksTabIsInAddMode: false })
    const addNetwork = wrapper.find('.networks-tab__add-network-button-wrapper .btn-primary')

    addNetwork.simulate('click')

    assert(props.setNetworksTabAddMode.calledOnce)
    assert.equal(props.setNetworksTabAddMode.getCall(0).args[0], true)

    assert(props.setSelectedSettingsRpcUrl.calledTwice)
    assert.equal(props.setSelectedSettingsRpcUrl.getCall(1).args[0], null)

  })
})
