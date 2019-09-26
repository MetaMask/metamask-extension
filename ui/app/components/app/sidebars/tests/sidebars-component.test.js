import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'
import Sidebar from '../sidebar.component.js'

import WalletView from '../../wallet-view'
import CustomizeGas from '../../gas-customization/gas-modal-page-container/'

const propsMethodSpies = {
  hideSidebar: sinon.spy(),
}

describe('Sidebar Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<Sidebar
      sidebarOpen={false}
      hideSidebar={propsMethodSpies.hideSidebar}
      transitionName={'someTransition'}
      type={'wallet-view'}
    />)
  })

  afterEach(() => {
    propsMethodSpies.hideSidebar.resetHistory()
  })

  describe('renderOverlay', () => {
    let renderOverlay

    beforeEach(() => {
      renderOverlay = shallow(wrapper.instance().renderOverlay())
    })

    it('should render a overlay element', () => {
      assert(renderOverlay.hasClass('sidebar-overlay'))
    })

    it('should pass the correct onClick function to the element', () => {
      assert.equal(propsMethodSpies.hideSidebar.callCount, 0)
      renderOverlay.props().onClick()
      assert.equal(propsMethodSpies.hideSidebar.callCount, 1)
    })
  })

  describe('renderSidebarContent', () => {
    let renderSidebarContent

    beforeEach(() => {
      wrapper.setProps({ type: 'wallet-view' })
      renderSidebarContent = wrapper.instance().renderSidebarContent()
    })

    it('should render sidebar content with the correct props', () => {
      wrapper.setProps({ type: 'wallet-view' })
      renderSidebarContent = wrapper.instance().renderSidebarContent()
      assert.equal(renderSidebarContent.props.responsiveDisplayClassname, 'sidebar-right')
    })

    it('should render sidebar content with the correct props', () => {
      wrapper.setProps({ type: 'customize-gas' })
      renderSidebarContent = wrapper.instance().renderSidebarContent()
      const renderedSidebarContent = shallow(renderSidebarContent)
      assert(renderedSidebarContent.hasClass('sidebar-left'))
      assert(renderedSidebarContent.childAt(0).is(CustomizeGas))
    })

    it('should not render with an unrecognized type', () => {
      wrapper.setProps({ type: 'foobar' })
      renderSidebarContent = wrapper.instance().renderSidebarContent()
      assert.equal(renderSidebarContent, undefined)
    })
  })

  describe('render', () => {
    it('should render a div with one child', () => {
      assert(wrapper.is('div'))
      assert.equal(wrapper.children().length, 1)
    })

    it('should render the ReactCSSTransitionGroup without any children', () => {
      assert(wrapper.children().at(0).is(ReactCSSTransitionGroup))
      assert.equal(wrapper.children().at(0).children().length, 0)
    })

    it('should render sidebar content and the overlay if sidebarOpen is true', () => {
      wrapper.setProps({ sidebarOpen: true })
      assert.equal(wrapper.children().length, 2)
      assert(wrapper.children().at(1).hasClass('sidebar-overlay'))
      assert.equal(wrapper.children().at(0).children().length, 1)
      assert(wrapper.children().at(0).children().at(0).is(WalletView))
    })
  })
})
