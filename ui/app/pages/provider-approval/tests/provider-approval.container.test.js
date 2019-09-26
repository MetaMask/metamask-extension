import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'
import ProviderApproval from '../index'

describe('Provider Approval', () => {
  let wrapper

  const state = {
    metamask: {
      selectedAddress: '0xAddress',
      identities: {
        '0xAddress': {
          address: '0xAddress',
          name: 'Account 1',
        },
      },
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x0',
        },
      },
      cachedBalances: {
        '66': {
          '0xAddress': '0x0',
        },
      },
      network: '66',
      provider: {
        type: 'test',
      },
    },
  }

  const mockStore = configureMockStore()
  const store = mockStore(state)

  const props = {
    rejectProviderRequestByOrigin: sinon.spy(),
    approveProviderRequestByOrigin: sinon.spy(),
    providerRequest: {
      origin: 'metamask.io',
      siteTitle: '',
      siteImage: null,
      tabID: null,
    },
  }

  beforeEach(() => {
    wrapper = mount(
      <ProviderApproval.WrappedComponent {...props}/>, {
        context: {
          t: str => str,
          metricsEvent: () => {},
          store,
        },
        childContextTypes: {
          t: React.PropTypes.func,
          metricsEvent: React.PropTypes.func,
          store: React.PropTypes.object,
        },
      }
    )
  })

  it('rejects provider request', () => {
    const cancelButton = wrapper.find('.button.btn-default.btn--large.page-container__footer-button')
    cancelButton.simulate('click')

    assert(props.rejectProviderRequestByOrigin.calledOnce)
  })

  it('approves provider request', () => {
    const connectButton = wrapper.find('.button.btn-primary.btn--large.page-container__footer-button')
    connectButton.simulate('click')

    assert(props.approveProviderRequestByOrigin.calledOnce)
  })
})
