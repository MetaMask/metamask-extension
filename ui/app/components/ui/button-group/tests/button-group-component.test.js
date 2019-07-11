import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import ButtonGroup from '../button-group.component.js'

const childButtonSpies = {
  onClick: sinon.spy(),
}

sinon.spy(ButtonGroup.prototype, 'handleButtonClick')
sinon.spy(ButtonGroup.prototype, 'renderButtons')

const mockButtons = [
  <button onClick={childButtonSpies.onClick} key={'a'}><div className="mockClass" /></button>,
  <button onClick={childButtonSpies.onClick} key={'b'}></button>,
  <button onClick={childButtonSpies.onClick} key={'c'}></button>,
]

describe('ButtonGroup Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<ButtonGroup
      defaultActiveButtonIndex={1}
      disabled={false}
      className="someClassName"
      style={ { color: 'red' } }
    >{mockButtons}</ButtonGroup>)
  })

  afterEach(() => {
    childButtonSpies.onClick.resetHistory()
    ButtonGroup.prototype.handleButtonClick.resetHistory()
    ButtonGroup.prototype.renderButtons.resetHistory()
  })

  describe('componentDidUpdate', () => {
    it('should set the activeButtonIndex to the updated newActiveButtonIndex', () => {
      assert.equal(wrapper.state('activeButtonIndex'), 1)
      wrapper.setProps({ newActiveButtonIndex: 2 })
      assert.equal(wrapper.state('activeButtonIndex'), 2)
    })

    it('should not set the activeButtonIndex to an updated newActiveButtonIndex that is not a number', () => {
      assert.equal(wrapper.state('activeButtonIndex'), 1)
      wrapper.setProps({ newActiveButtonIndex: null })
      assert.equal(wrapper.state('activeButtonIndex'), 1)
    })
  })

  describe('handleButtonClick', () => {
    it('should set the activeButtonIndex', () => {
      assert.equal(wrapper.state('activeButtonIndex'), 1)
      wrapper.instance().handleButtonClick(2)
      assert.equal(wrapper.state('activeButtonIndex'), 2)
    })
  })

  describe('renderButtons', () => {
    it('should render a button for each child', () => {
      const childButtons = wrapper.find('.button-group__button')
      assert.equal(childButtons.length, 3)
    })

    it('should render the correct button with an active state', () => {
      const childButtons = wrapper.find('.button-group__button')
      const activeChildButton = wrapper.find('.button-group__button--active')
      assert.deepEqual(childButtons.get(1), activeChildButton.get(0))
    })

    it('should call handleButtonClick and the respective button\'s onClick method when a button is clicked', () => {
      assert.equal(ButtonGroup.prototype.handleButtonClick.callCount, 0)
      assert.equal(childButtonSpies.onClick.callCount, 0)
      const childButtons = wrapper.find('.button-group__button')
      childButtons.at(0).props().onClick()
      childButtons.at(1).props().onClick()
      childButtons.at(2).props().onClick()
      assert.equal(ButtonGroup.prototype.handleButtonClick.callCount, 3)
      assert.equal(childButtonSpies.onClick.callCount, 3)
    })

    it('should render all child buttons as disabled if props.disabled is true', () => {
      const childButtons = wrapper.find('.button-group__button')
      childButtons.forEach(button => {
        assert.equal(button.props().disabled, undefined)
      })
      wrapper.setProps({ disabled: true })
      const disabledChildButtons = wrapper.find('[disabled=true]')
      assert.equal(disabledChildButtons.length, 3)
    })

    it('should render the children of the button', () => {
      const mockClass = wrapper.find('.mockClass')
      assert.equal(mockClass.length, 1)
    })
  })

  describe('render', () => {
    it('should render a div with the expected class and style', () => {
      assert.equal(wrapper.find('div').at(0).props().className, 'someClassName')
      assert.deepEqual(wrapper.find('div').at(0).props().style, { color: 'red' })
    })

    it('should call renderButtons when rendering', () => {
      assert.equal(ButtonGroup.prototype.renderButtons.callCount, 1)
      wrapper.instance().render()
      assert.equal(ButtonGroup.prototype.renderButtons.callCount, 2)
    })
  })
})
