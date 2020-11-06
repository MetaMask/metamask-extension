import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import ButtonGroup from '../button-group.component'

describe('ButtonGroup Component', function () {
  let wrapper

  const childButtonSpies = {
    onClick: sinon.spy(),
  }

  const mockButtons = [
    <button onClick={childButtonSpies.onClick} key="a">
      <div className="mockClass" />
    </button>,
    <button onClick={childButtonSpies.onClick} key="b"></button>,
    <button onClick={childButtonSpies.onClick} key="c"></button>,
  ]

  before(function () {
    sinon.spy(ButtonGroup.prototype, 'handleButtonClick')
    sinon.spy(ButtonGroup.prototype, 'renderButtons')
  })

  beforeEach(function () {
    wrapper = shallow(
      <ButtonGroup
        defaultActiveButtonIndex={1}
        disabled={false}
        className="someClassName"
        style={{ color: 'red' }}
      >
        {mockButtons}
      </ButtonGroup>,
    )
  })

  afterEach(function () {
    childButtonSpies.onClick.resetHistory()
    ButtonGroup.prototype.handleButtonClick.resetHistory()
    ButtonGroup.prototype.renderButtons.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  describe('componentDidUpdate', function () {
    it('should set the activeButtonIndex to the updated newActiveButtonIndex', function () {
      assert.equal(wrapper.state('activeButtonIndex'), 1)
      wrapper.setProps({ newActiveButtonIndex: 2 })
      assert.equal(wrapper.state('activeButtonIndex'), 2)
    })

    it('should not set the activeButtonIndex to an updated newActiveButtonIndex that is not a number', function () {
      assert.equal(wrapper.state('activeButtonIndex'), 1)
      wrapper.setProps({ newActiveButtonIndex: null })
      assert.equal(wrapper.state('activeButtonIndex'), 1)
    })
  })

  describe('handleButtonClick', function () {
    it('should set the activeButtonIndex', function () {
      assert.equal(wrapper.state('activeButtonIndex'), 1)
      wrapper.instance().handleButtonClick(2)
      assert.equal(wrapper.state('activeButtonIndex'), 2)
    })
  })

  describe('renderButtons', function () {
    it('should render a button for each child', function () {
      const childButtons = wrapper.find('.button-group__button')
      assert.equal(childButtons.length, 3)
    })

    it('should render the correct button with an active state', function () {
      const childButtons = wrapper.find('.button-group__button')
      const activeChildButton = wrapper.find('.button-group__button--active')
      assert.deepEqual(childButtons.get(1), activeChildButton.get(0))
    })

    it("should call handleButtonClick and the respective button's onClick method when a button is clicked", function () {
      assert.equal(ButtonGroup.prototype.handleButtonClick.callCount, 0)
      assert.equal(childButtonSpies.onClick.callCount, 0)
      const childButtons = wrapper.find('.button-group__button')
      childButtons.at(0).props().onClick()
      childButtons.at(1).props().onClick()
      childButtons.at(2).props().onClick()
      assert.equal(ButtonGroup.prototype.handleButtonClick.callCount, 3)
      assert.equal(childButtonSpies.onClick.callCount, 3)
    })

    it('should render all child buttons as disabled if props.disabled is true', function () {
      const childButtons = wrapper.find('.button-group__button')
      childButtons.forEach((button) => {
        assert.equal(button.props().disabled, undefined)
      })
      wrapper.setProps({ disabled: true })
      const disabledChildButtons = wrapper.find('[disabled=true]')
      assert.equal(disabledChildButtons.length, 3)
    })

    it('should render the children of the button', function () {
      const mockClass = wrapper.find('.mockClass')
      assert.equal(mockClass.length, 1)
    })
  })

  describe('render', function () {
    it('should render a div with the expected class and style', function () {
      assert.equal(wrapper.find('div').at(0).props().className, 'someClassName')
      assert.deepEqual(wrapper.find('div').at(0).props().style, {
        color: 'red',
      })
    })

    it('should call renderButtons when rendering', function () {
      assert.equal(ButtonGroup.prototype.renderButtons.callCount, 1)
      wrapper.instance().render()
      assert.equal(ButtonGroup.prototype.renderButtons.callCount, 2)
    })
  })
})
