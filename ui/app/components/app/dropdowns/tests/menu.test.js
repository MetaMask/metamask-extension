import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import { Menu, Item, Divider, CloseArea } from '../components/menu'

describe('Dropdown Menu Components', () => {

  describe('Menu', () => {
    let wrapper

    beforeEach(() => {
      wrapper = shallow(
        <Menu className = {'Test Class'} isShowing = {true}/>
      )
    })

    it('adds prop className to menu', () => {
      assert.equal(wrapper.find('.menu').prop('className'), 'menu Test Class')
    })

  })

  describe('Item', () => {
    let wrapper

    const onClickSpy = sinon.spy()

    beforeEach(() => {
      wrapper = shallow(
        <Item
          icon = {'test icon'}
          text = {'test text'}
          className = {'test className'}
          onClick = {onClickSpy}
        />
      )
    })

    it('add className based on props', () => {
      assert.equal(wrapper.find('.menu__item').prop('className'), 'menu__item menu__item test className menu__item--clickable')
    })

    it('simulates onClick called', () => {
      wrapper.find('.menu__item').prop('onClick')()
      assert.equal(onClickSpy.callCount, 1)
    })

    it('adds icon based on icon props', () => {
      assert.equal(wrapper.find('.menu__item__icon').text(), 'test icon')
    })

    it('adds html text based on text props', () => {
      assert.equal(wrapper.find('.menu__item__text').text(), 'test text')
    })
  })

  describe('Divider', () => {
    let wrapper

    before(() => {
      wrapper = shallow(<Divider />)
    })

    it('renders menu divider', () => {
      assert.equal(wrapper.find('.menu__divider').length, 1)
    })
  })

  describe('CloseArea', () => {
    let wrapper

    const onClickSpy = sinon.spy()

    beforeEach(() => {
      wrapper = shallow(<CloseArea
        onClick = {onClickSpy}
      />)
    })

    it('simulates click', () => {
      wrapper.prop('onClick')()
      assert.equal(onClickSpy.callCount, 1)
    })
  })

})
