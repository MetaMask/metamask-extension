import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import LoadingNetworkScreen from '../loading-network-screen.component'

describe('Loading Network Screen Component', function () {

  let wrapper, clock

  const props = {
    setProviderType: sinon.spy(),
    showNetworkDropdown: sinon.spy(),
    setProviderArgs: ['test'],
    provider: {
      type: '',
    },
  }

  beforeEach(function () {

    clock = sinon.useFakeTimers()

    wrapper = mount(<LoadingNetworkScreen {...props} />, {
      context: {
        t: (str, ...args) => str + args,
      },
    })
  })

  afterEach(function () {
    props.setProviderType.resetHistory()
    props.showNetworkDropdown.resetHistory()
    clock.restore()
  })

  it('renders connectingTo label when no provider type/id props', function () {
    const connectingLabel = wrapper.find('span')

    assert.equal(connectingLabel.text(), 'connectingTo')
  })

  it('renders connectingToMainnet label with mainnet provider type', function () {
    wrapper.setProps({ provider: { type: 'mainnet' } })

    const connectingLabel = wrapper.find('span')

    assert.equal(connectingLabel.text(), 'connectingToMainnet')
  })

  it('renders connectingToRopsten label with ropsten provider type', function () {
    wrapper.setProps({ provider: { type: 'ropsten' } })

    const connectingLabel = wrapper.find('span')

    assert.equal(connectingLabel.text(), 'connectingToRopsten')
  })

  it('renders connectingToKovan label with kovan provider type', function () {
    wrapper.setProps({ provider: { type: 'kovan' } })

    const connectingLabel = wrapper.find('span')

    assert.equal(connectingLabel.text(), 'connectingToKovan')
  })

  it('renders connectingToRinkeby label with rinkeby provider type', function () {
    wrapper.setProps({ provider: { type: 'rinkeby' } })

    const connectingLabel = wrapper.find('span')

    assert.equal(connectingLabel.text(), 'connectingToRinkeby')
  })

  it('renders connectingToLocalhost label with localhost provider type', function () {
    wrapper.setProps({ provider: { type: 'localhost' } })

    const connectingLabel = wrapper.find('span')

    assert.equal(connectingLabel.text(), 'connectingToLocalhost')
  })

  it('renders connectingToGoerli label with goerli provider type', function () {
    wrapper.setProps({ provider: { type: 'goerli' } })

    const connectingLabel = wrapper.find('span')

    assert.equal(connectingLabel.text(), 'connectingToGoerli')
  })

  it('set provider to ropsten on page close with no lastSelectedProvider', function () {
    const pageClose = wrapper.find('.page-container__header-close')

    pageClose.simulate('click')

    assert(props.setProviderType.calledOnce)
    assert.equal(props.setProviderType.getCall(0).args[0], 'ropsten')
  })

  it('set provider to lastSelectedProvider on page close', function () {
    wrapper.setProps({ lastSelectedProvider: 'test' })
    const pageClose = wrapper.find('.page-container__header-close')

    pageClose.simulate('click')

    assert(props.setProviderType.calledOnce)
    assert.equal(props.setProviderType.getCall(0).args[0], 'test')
  })

  it('clicking switch networks calls showNetworkDropdown', function () {
    wrapper.setState({ showErrorScreen: true })

    const switchNetworks = wrapper.find('.btn-default')
    switchNetworks.simulate('click')

    assert(props.showNetworkDropdown.calledOnce)
  })

  it('clicking try again calls setProvider type with provider args', function () {
    wrapper.setState({ showErrorScreen: true })

    assert.equal(wrapper.state('showErrorScreen'), true)

    const tryAgain = wrapper.find('.btn-primary')
    tryAgain.simulate('click')

    assert.equal(wrapper.state('showErrorScreen'), false)
    assert(props.setProviderType.calledOnce)
    assert.equal(props.setProviderType.getCall(0).args[0], ['test'])
  })


  it('changes state change after timeout with button click', function () {
    wrapper.setProps({ cancelTime: 1000, isLoadingNetwork: true })
    wrapper.setState({ showErrorScreen: true })

    const tryAgain = wrapper.find('.btn-primary')
    tryAgain.simulate('click')
    assert.equal(wrapper.state('showErrorScreen'), false)

    clock.tick(1100)
    assert.equal(wrapper.state('showErrorScreen'), true)
  })

})
