import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import FromDropdown from '../from-dropdown.component.js'

import AccountListItem from '../../../../account-list-item/account-list-item.container'
import SendDropdownList from '../../../send-dropdown-list/send-dropdown-list.component'

const propsMethodSpies = {
  closeDropdown: sinon.spy(),
  openDropdown: sinon.spy(),
  onSelect: sinon.spy(),
}

describe('FromDropdown Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<FromDropdown
      accounts={['mockAccount']}
      closeDropdown={propsMethodSpies.closeDropdown}
      dropdownOpen={false}
      onSelect={propsMethodSpies.onSelect}
      openDropdown={propsMethodSpies.openDropdown}
      selectedAccount={ { address: 'mockAddress' } }
    />, { context: { t: str => str + '_t' } })
  })

  afterEach(() => {
    propsMethodSpies.closeDropdown.resetHistory()
    propsMethodSpies.openDropdown.resetHistory()
    propsMethodSpies.onSelect.resetHistory()
  })

  describe('render', () => {
    it('should render a div with a .send-v2__from-dropdown class', () => {
      assert.equal(wrapper.find('.send-v2__from-dropdown').length, 1)
    })

    it('should render an AccountListItem as the first child of the .send-v2__from-dropdown div', () => {
      assert(wrapper.find('.send-v2__from-dropdown').childAt(0).is(AccountListItem))
    })

    it('should pass the correct props to AccountListItem', () => {
      const {
        account,
        handleClick,
        icon,
      } = wrapper.find('.send-v2__from-dropdown').childAt(0).props()
      assert.deepEqual(account, { address: 'mockAddress' })
      assert.deepEqual(
        icon,
        <i className={`fa fa-caret-down fa-lg`} style={ { color: '#dedede' } }/>
      )
      assert.equal(propsMethodSpies.openDropdown.callCount, 0)
      handleClick()
      assert.equal(propsMethodSpies.openDropdown.callCount, 1)
    })

    it('should not render a SendDropdownList when dropdownOpen is false', () => {
      assert.equal(wrapper.find(SendDropdownList).length, 0)
    })

    it('should render a SendDropdownList when dropdownOpen is true', () => {
      wrapper.setProps({ dropdownOpen: true })
      assert(wrapper.find(SendDropdownList).length, 1)
    })

    it('should pass the correct props to the SendDropdownList]', () => {
      wrapper.setProps({ dropdownOpen: true })
      const {
        accounts,
        closeDropdown,
        onSelect,
        activeAddress,
      } = wrapper.find(SendDropdownList).props()
      assert.deepEqual(accounts, ['mockAccount'])
      assert.equal(activeAddress, 'mockAddress')
      assert.equal(propsMethodSpies.closeDropdown.callCount, 0)
      closeDropdown()
      assert.equal(propsMethodSpies.closeDropdown.callCount, 1)
      assert.equal(propsMethodSpies.onSelect.callCount, 0)
      onSelect()
      assert.equal(propsMethodSpies.onSelect.callCount, 1)
    })
  })
})
