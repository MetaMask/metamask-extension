import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendDropdownList from '../send-dropdown-list.component.js'

import AccountListItem from '../../../account-list-item/account-list-item.container'

const propsMethodSpies = {
  closeDropdown: sinon.spy(),
  onSelect: sinon.spy(),
}

sinon.spy(SendDropdownList.prototype, 'getListItemIcon')

describe('SendDropdownList Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendDropdownList
      accounts={[
        { address: 'mockAccount0' },
        { address: 'mockAccount1' },
        { address: 'mockAccount2' },
      ]}
      closeDropdown={propsMethodSpies.closeDropdown}
      onSelect={propsMethodSpies.onSelect}
      activeAddress={'mockAddress2'}
    />, { context: { t: str => str + '_t' } })
  })

  afterEach(() => {
    propsMethodSpies.closeDropdown.resetHistory()
    propsMethodSpies.onSelect.resetHistory()
    SendDropdownList.prototype.getListItemIcon.resetHistory()
  })

  describe('getListItemIcon', () => {
    it('should return check icon if the passed addresses are the same', () => {
      assert.deepEqual(
        wrapper.instance().getListItemIcon('mockAccount0', 'mockAccount0'),
        <i className={`fa fa-check fa-lg`} style={ { color: '#02c9b1' } }/>
      )
    })

    it('should return null if the passed addresses are different', () => {
      assert.equal(
        wrapper.instance().getListItemIcon('mockAccount0', 'mockAccount1'),
        null
      )
    })
  })

  describe('render', () => {
    it('should render a single div with two children', () => {
      assert(wrapper.is('div'))
      assert.equal(wrapper.children().length, 2)
    })

    it('should render the children with the correct classes', () => {
      assert(wrapper.childAt(0).hasClass('send-v2__from-dropdown__close-area'))
      assert(wrapper.childAt(1).hasClass('send-v2__from-dropdown__list'))
    })

    it('should call closeDropdown onClick of the send-v2__from-dropdown__close-area', () => {
      assert.equal(propsMethodSpies.closeDropdown.callCount, 0)
      wrapper.childAt(0).props().onClick()
      assert.equal(propsMethodSpies.closeDropdown.callCount, 1)
    })

    it('should render an AccountListItem for each item in accounts', () => {
      assert.equal(wrapper.childAt(1).children().length, 3)
      assert(wrapper.childAt(1).children().every(AccountListItem))
    })

    it('should pass the correct props to the AccountListItem', () => {
      wrapper.childAt(1).children().forEach((accountListItem, index) => {
        const {
          account,
          className,
          handleClick,
        } = accountListItem.props()
        assert.deepEqual(account, { address: 'mockAccount' + index })
        assert.equal(className, 'account-list-item__dropdown')
        assert.equal(propsMethodSpies.onSelect.callCount, 0)
        handleClick()
        assert.equal(propsMethodSpies.onSelect.callCount, 1)
        assert.deepEqual(propsMethodSpies.onSelect.getCall(0).args[0], { address: 'mockAccount' + index })
        propsMethodSpies.onSelect.resetHistory()
        propsMethodSpies.closeDropdown.resetHistory()
        assert.equal(propsMethodSpies.closeDropdown.callCount, 0)
        handleClick()
        assert.equal(propsMethodSpies.closeDropdown.callCount, 1)
        propsMethodSpies.onSelect.resetHistory()
        propsMethodSpies.closeDropdown.resetHistory()
      })
    })

    it('should call this.getListItemIcon for each AccountListItem', () => {
      assert.equal(SendDropdownList.prototype.getListItemIcon.callCount, 3)
      const getListItemIconCalls = SendDropdownList.prototype.getListItemIcon.getCalls()
      assert(getListItemIconCalls.every(({ args }, index) => args[0] === 'mockAccount' + index))
    })
  })
})
