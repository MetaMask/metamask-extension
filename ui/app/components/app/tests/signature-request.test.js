import assert from 'assert'
import React from 'react'
import { Provider } from 'react-redux'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import SignatureRequest from '../signature-request'

describe('Signature Request', function () {
  let wrapper

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
      accounts: {
        '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': {
          address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
          balance: '0x03',
        },
      },
      cachedBalances: {},
      selectedAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    },
  }
  const store = configureMockStore()(mockStore)

  const props = {
    fromAccount: {
      address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    },
    history: {
      push: sinon.spy(),
    },
    clearConfirmTransaction: sinon.spy(),
    cancelMessage: sinon.spy(),
    cancel: sinon.stub().resolves(),
    sign: sinon.stub().resolves(),
    txData: {
      msgParams: {
        id: 1,
        data:
          '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Person":[{"name":"name","type":"string"},{"name":"wallet","type":"address"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person"},{"name":"contents","type":"string"}]},"primaryType":"Mail","domain":{"name":"Ether Mail","version":"1","chainId":"4","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},"message":{"from":{"name":"Cow","wallet":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},"to":{"name":"Bob","wallet":"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},"contents":"Hello, Bob!"}}',
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        origin: 'test.domain',
      },
      status: 'unapproved',
      time: 1,
      type: 'eth_sign',
    },
  }

  beforeEach(function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <SignatureRequest.WrappedComponent {...props} />
      </Provider>,
      store,
    )
  })

  afterEach(function () {
    props.clearConfirmTransaction.resetHistory()
  })

  it('cancel', function () {
    const cancelButton = wrapper.find('button.btn-default')
    cancelButton.simulate('click')

    assert(props.cancel.calledOnce)
  })

  it('sign', function () {
    const signButton = wrapper.find('button.btn-primary')
    signButton.simulate('click')

    assert(props.sign.calledOnce)
  })
})
