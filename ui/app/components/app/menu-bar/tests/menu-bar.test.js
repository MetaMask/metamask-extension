import React from 'react'
import configureStore from 'redux-mock-store'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import MenuBar from '../index'
import { Provider } from 'react-redux'

describe('MenuBar', function () {
  let wrapper

  const mockStore = {
    metamask: {
      network: '1',
      selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      identities: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          name: 'Account 1',
        },
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: [
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          ],
        },
      ],
      frequentRpcListDetail: [],
    },
    appState: {
      sidebar: {
        isOpen: false,
      },
    },
  }

  const store = configureStore()(mockStore)

  afterEach(function () {
    sinon.restore()
  })

  it('shows side bar when sidbarOpen is set to false', function () {
    const props = {
      showSidebar: sinon.spy(),
    }

    wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar.WrappedComponent {...props} />
      </Provider>, store
    )

    const sidebarButton = wrapper.find('.menu-bar__sidebar-button')
    sidebarButton.simulate('click')
    assert(props.showSidebar.calledOnce)
  })

  it('hides side when sidebarOpen is set to true', function () {
    const props = {
      showSidebar: sinon.spy(),
      hideSidebar: sinon.spy(),
      sidebarOpen: true,
    }

    wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar.WrappedComponent {...props} />
      </Provider>, store
    )

    const sidebarButton = wrapper.find('.menu-bar__sidebar-button')
    sidebarButton.prop('onClick')()
    assert(props.hideSidebar.calledOnce)
  })

  it('opens account detail menu when account options is clicked', function () {
    const accountOptions = wrapper.find('.menu-bar__open-in-browser')
    accountOptions.simulate('click')
    assert.equal(wrapper.find('MenuBar').instance().state.accountDetailsMenuOpen, true)
  })

  it('sets accountDetailsMenuOpen to false when closed', function () {
    wrapper.find('MenuBar').instance().setState({ accountDetailsMenuOpen: true })
    wrapper.update()

    const accountDetailsMenu = wrapper.find('AccountDetailsDropdown')
    accountDetailsMenu.prop('onClose')()

    assert.equal(wrapper.find('MenuBar').instance().state.accountDetailsMenuOpen, false)
  })
})
