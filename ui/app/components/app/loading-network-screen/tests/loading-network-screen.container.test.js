import React from 'react'
import assert from 'assert'
import configureStore from 'redux-mock-store'
import { mount } from 'enzyme'
import LoadingNetworkScreen from '../index'

describe('Loading Network Screen', function () {

  let wrapper

  const state = {
    metamask: {
      provider: {
        rpcTarget: '',
        chainId: null,
        nickname: '',
        type: 'type',
        rpcPrefs: {},
      },
    },
    appState: {
      loadingMessage: 'Loading Message',
    },
  }

  const store = configureStore()(state)

  const props = {
    store,
  }

  beforeEach(function () {
    wrapper = mount(
      <LoadingNetworkScreen {...props} />, {
        context: {
          t: (str) => str,
        },
      }
    )
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('renders loading message from app state', function () {
    const loadingMessage = wrapper.find('span')
    assert.equal(loadingMessage.text(), state.appState.loadingMessage)
  })

})
