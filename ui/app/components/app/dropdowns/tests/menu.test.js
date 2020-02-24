import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import { Menu, Item, Divider, CloseArea } from '../components/menu'

<<<<<<< HEAD
describe('Dropdown Menu Components', () => {

  describe('Menu', () => {
    let wrapper

    beforeEach(() => {
      wrapper = shallow(
        <Menu className="Test Class" isShowing/>
=======
describe('Dropdown Menu Components', function () {
  describe('Menu', function () {
    it('adds prop className to menu', function () {
      const wrapper = shallow(
        <Menu className="Test Class" isShowing />
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
      )
      assert.equal(wrapper.find('.menu').prop('className'), 'menu Test Class')
    })
  })

  describe('Item', function () {
    let wrapper
    const onClickSpy = sinon.spy()

    beforeEach(function () {
      wrapper = shallow(
        <Item
          icon="test icon"
          text="test text"
          className="test className"
          onClick={onClickSpy}
        />
      )
    })

<<<<<<< HEAD
    it('add className based on props', () => {
      assert.equal(wrapper.find('.menu__item').prop('className'), 'menu__item menu__item test className menu__item--clickable')
=======
    it('add className based on props', function () {
      assert.equal(wrapper.find('.menu__item').prop('className'), 'menu__item test foo1 menu__item--clickable')
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    })

    it('simulates onClick called', function () {
      wrapper.find('.menu__item').prop('onClick')()
      assert.equal(onClickSpy.callCount, 1)
    })

    it('adds icon based on icon props', function () {
      assert.equal(wrapper.find('.menu__item__icon').text(), 'test icon')
    })

    it('adds html text based on text props', function () {
      assert.equal(wrapper.find('.menu__item__text').text(), 'test text')
    })
  })

  describe('Divider', function () {
    it('renders menu divider', function () {
      const wrapper = shallow(<Divider />)
      assert.equal(wrapper.find('.menu__divider').length, 1)
    })
  })

<<<<<<< HEAD
  describe('CloseArea', () => {
    let wrapper

    const onClickSpy = sinon.spy()

    beforeEach(() => {
      wrapper = shallow(<CloseArea
        onClick={onClickSpy}
      />)
    })

    it('simulates click', () => {
=======
  describe('CloseArea', function () {
    it('simulates click', function () {
      const onClickSpy = sinon.spy()
      const wrapper = shallow((
        <CloseArea
          onClick={onClickSpy}
        />
      ))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
      wrapper.prop('onClick')()
      assert.ok(onClickSpy.calledOnce)
    })
  })
})
