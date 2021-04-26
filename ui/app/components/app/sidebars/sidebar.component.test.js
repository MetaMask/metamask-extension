import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import CustomizeGas from '../gas-customization/gas-modal-page-container';
import Sidebar from './sidebar.component';

const propsMethodSpies = {
  hideSidebar: sinon.spy(),
};

describe('Sidebar Component', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(
      <Sidebar
        sidebarOpen={false}
        hideSidebar={propsMethodSpies.hideSidebar}
        transitionName="someTransition"
        type="customize-gas"
      />,
    );
  });

  afterEach(() => {
    propsMethodSpies.hideSidebar.resetHistory();
  });

  describe('renderOverlay', () => {
    let renderOverlay;

    beforeEach(() => {
      renderOverlay = shallow(wrapper.instance().renderOverlay());
    });

    it('should render a overlay element', () => {
      expect(renderOverlay.hasClass('sidebar-overlay')).toStrictEqual(true);
    });

    it('should pass the correct onClick function to the element', () => {
      expect(propsMethodSpies.hideSidebar.callCount).toStrictEqual(0);
      renderOverlay.props().onClick();
      expect(propsMethodSpies.hideSidebar.callCount).toStrictEqual(1);
    });
  });

  describe('renderSidebarContent', () => {
    let renderSidebarContent;

    beforeEach(() => {
      renderSidebarContent = wrapper.instance().renderSidebarContent();
    });

    it('should render sidebar content with the type customize-gas', () => {
      renderSidebarContent = wrapper.instance().renderSidebarContent();
      const renderedSidebarContent = shallow(renderSidebarContent);
      expect(renderedSidebarContent.hasClass('sidebar-left')).toStrictEqual(
        true,
      );
      expect(renderedSidebarContent.childAt(0).is(CustomizeGas)).toStrictEqual(
        true,
      );
    });

    it('should not render with an unrecognized type', () => {
      wrapper.setProps({ type: 'foobar' });
      renderSidebarContent = wrapper.instance().renderSidebarContent();
      expect(renderSidebarContent).toBeNull();
    });
  });

  describe('render', () => {
    it('should render a div with one child', () => {
      expect(wrapper.is('div')).toStrictEqual(true);
      expect(wrapper.children()).toHaveLength(1);
    });

    it('should render the ReactCSSTransitionGroup without any children', () => {
      expect(
        wrapper.children().at(0).is(ReactCSSTransitionGroup),
      ).toStrictEqual(true);
      expect(wrapper.children().at(0).children()).toHaveLength(0);
    });

    it('should render sidebar content and the overlay if sidebarOpen is true', () => {
      wrapper.setProps({ sidebarOpen: true });
      expect(wrapper.children()).toHaveLength(2);
      expect(
        wrapper.children().at(1).hasClass('sidebar-overlay'),
      ).toStrictEqual(true);
      expect(wrapper.children().at(0).children()).toHaveLength(1);
      expect(
        wrapper.children().at(0).children().at(0).hasClass('sidebar-left'),
      ).toStrictEqual(true);
      expect(
        wrapper
          .children()
          .at(0)
          .children()
          .at(0)
          .children()
          .at(0)
          .is(CustomizeGas),
      ).toBe(true);
    });
  });
});
