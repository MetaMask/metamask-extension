import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import MenuBar from '../index'

describe('MenuBar', () => {
  let wrapper

  const props = {
    sidebarOpen: false,
    hideSidebar: sinon.spy(),
    showSidebar: sinon.spy(),
  }

  beforeEach(() => {
    wrapper = shallow(
      <MenuBar.WrappedComponent {...props} />, {
        context: {
          t: str => str,
          metricsEvent: () => {},
        },
      }
    )
  })

  it('shows side bar when sidbarOpen is set to false', () => {
    const sidebarButton = wrapper.find('.menu-bar__sidebar-button')
    sidebarButton.simulate('click')
    assert(props.showSidebar.calledOnce)
  })

  it('hides side when sidebarOpen is set to true', () => {
    wrapper.setProps({ sidebarOpen: true })
    const sidebarButton = wrapper.find('.menu-bar__sidebar-button')
    sidebarButton.simulate('click')
    assert(props.hideSidebar.calledOnce)
  })

  it('opens account detail menu when account options is clicked', () => {
    const accountOptions = wrapper.find('.menu-bar__open-in-browser')
    accountOptions.simulate('click')
    assert.equal(wrapper.state('accountDetailsMenuOpen'), true)
  })

  it('sets accountDetailsMenuOpen to false when closed', () => {
    wrapper.setState({ accountDetailsMenuOpen: true })
    const accountDetailsMenu = wrapper.find('.menu-bar__account-details-dropdown')
    accountDetailsMenu.simulate('close')
    assert.equal(wrapper.state('accountDetailsMenuOpen'), false)
  })
})
