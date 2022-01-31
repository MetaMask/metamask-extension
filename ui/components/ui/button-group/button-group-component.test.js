import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import ButtonGroup from './button-group.component';

describe('ButtonGroup Component', () => {
  let wrapper;

  const childButtonSpies = {
    onClick: sinon.spy(),
  };

  const mockButtons = [
    <button onClick={childButtonSpies.onClick} key="a">
      <div className="mockClass" />
    </button>,
    <button onClick={childButtonSpies.onClick} key="b"></button>,
    <button onClick={childButtonSpies.onClick} key="c"></button>,
  ];

  beforeAll(() => {
    sinon.spy(ButtonGroup.prototype, 'handleButtonClick');
    sinon.spy(ButtonGroup.prototype, 'renderButtons');
  });

  beforeEach(() => {
    wrapper = shallow(
      <ButtonGroup
        defaultActiveButtonIndex={1}
        disabled={false}
        className="someClassName"
        style={{ color: 'red' }}
      >
        {mockButtons}
      </ButtonGroup>,
    );
  });

  afterEach(() => {
    childButtonSpies.onClick.resetHistory();
    ButtonGroup.prototype.handleButtonClick.resetHistory();
    ButtonGroup.prototype.renderButtons.resetHistory();
  });

  afterAll(() => {
    sinon.restore();
  });

  describe('componentDidUpdate', () => {
    it('should set the activeButtonIndex to the updated newActiveButtonIndex', () => {
      expect(wrapper.state('activeButtonIndex')).toStrictEqual(1);
      wrapper.setProps({ newActiveButtonIndex: 2 });
      expect(wrapper.state('activeButtonIndex')).toStrictEqual(2);
    });

    it('should not set the activeButtonIndex to an updated newActiveButtonIndex that is not a number', () => {
      expect(wrapper.state('activeButtonIndex')).toStrictEqual(1);
      wrapper.setProps({ newActiveButtonIndex: null });
      expect(wrapper.state('activeButtonIndex')).toStrictEqual(1);
    });
  });

  describe('handleButtonClick', () => {
    it('should set the activeButtonIndex', () => {
      expect(wrapper.state('activeButtonIndex')).toStrictEqual(1);
      wrapper.instance().handleButtonClick(2);
      expect(wrapper.state('activeButtonIndex')).toStrictEqual(2);
    });
  });

  describe('renderButtons', () => {
    it('should render a button for each child', () => {
      const childButtons = wrapper.find('.button-group__button');
      expect(childButtons).toHaveLength(3);
    });

    it('should render the correct button with an active state', () => {
      const childButtons = wrapper.find('.button-group__button');
      const activeChildButton = wrapper.find('.button-group__button--active');
      expect(childButtons.get(1)).toStrictEqual(activeChildButton.get(0));
    });

    it("should call handleButtonClick and the respective button's onClick method when a button is clicked", () => {
      expect(ButtonGroup.prototype.handleButtonClick.callCount).toStrictEqual(
        0,
      );
      expect(childButtonSpies.onClick.callCount).toStrictEqual(0);
      const childButtons = wrapper.find('.button-group__button');
      childButtons.at(0).props().onClick();
      childButtons.at(1).props().onClick();
      childButtons.at(2).props().onClick();
      expect(ButtonGroup.prototype.handleButtonClick.callCount).toStrictEqual(
        3,
      );
      expect(childButtonSpies.onClick.callCount).toStrictEqual(3);
    });

    it('should render all child buttons as disabled if props.disabled is true', () => {
      const childButtons = wrapper.find('.button-group__button');
      childButtons.forEach((button) => {
        expect(button.props().disabled).toBeUndefined();
      });
      wrapper.setProps({ disabled: true });
      const disabledChildButtons = wrapper.find('[disabled=true]');
      expect(disabledChildButtons).toHaveLength(3);
    });

    it('should render the children of the button', () => {
      const mockClass = wrapper.find('.mockClass');
      expect(mockClass).toHaveLength(1);
    });
  });

  describe('render', () => {
    it('should render a div with the expected class and style', () => {
      expect(wrapper.find('div').at(0).props().className).toStrictEqual(
        'someClassName',
      );
      expect(wrapper.find('div').at(0).props().style).toStrictEqual({
        color: 'red',
      });
    });

    it('should call renderButtons when rendering', () => {
      expect(ButtonGroup.prototype.renderButtons.callCount).toStrictEqual(1);
      wrapper.instance().render();
      expect(ButtonGroup.prototype.renderButtons.callCount).toStrictEqual(2);
    });
  });
});
