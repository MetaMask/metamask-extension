import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendFromRow from '../send-from-row.component.js'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'
import FromDropdown from '../from-dropdown/from-dropdown.component'

const propsMethodSpies = {
  closeFromDropdown: sinon.spy(),
  openFromDropdown: sinon.spy(),
  updateSendFrom: sinon.spy(),
  setSendTokenBalance: sinon.spy(),
}

sinon.spy(SendFromRow.prototype, 'handleFromChange')

describe('SendFromRow Component', function () {
  let wrapper
  let instance

  beforeEach(() => {
    wrapper = shallow(<SendFromRow
      closeFromDropdown={propsMethodSpies.closeFromDropdown}
      conversionRate={15}
      from={ { address: 'mockAddress' } }
      fromAccounts={['mockAccount']}
      fromDropdownOpen={false}
      openFromDropdown={propsMethodSpies.openFromDropdown}
      setSendTokenBalance={propsMethodSpies.setSendTokenBalance}
      tokenContract={null}
      updateSendFrom={propsMethodSpies.updateSendFrom}
    />, { context: { t: str => str + '_t' } })
    instance = wrapper.instance()
  })

  afterEach(() => {
    propsMethodSpies.closeFromDropdown.resetHistory()
    propsMethodSpies.openFromDropdown.resetHistory()
    propsMethodSpies.updateSendFrom.resetHistory()
    propsMethodSpies.setSendTokenBalance.resetHistory()
    SendFromRow.prototype.handleFromChange.resetHistory()
  })

  describe('handleFromChange', () => {

    it('should call updateSendFrom', () => {
      assert.equal(propsMethodSpies.updateSendFrom.callCount, 0)
      instance.handleFromChange('mockFrom')
      assert.equal(propsMethodSpies.updateSendFrom.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendFrom.getCall(0).args,
        ['mockFrom']
      )
    })

    it('should call tokenContract.balanceOf and setSendTokenBalance if tokenContract is defined', async () => {
      wrapper.setProps({
        tokenContract: {
          balanceOf: () => new Promise((resolve) => resolve('mockUsersToken')),
        },
      })
      assert.equal(propsMethodSpies.setSendTokenBalance.callCount, 0)
      await instance.handleFromChange('mockFrom')
      assert.equal(propsMethodSpies.setSendTokenBalance.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.setSendTokenBalance.getCall(0).args,
        ['mockUsersToken']
      )
    })

  })

  describe('render', () => {
    it('should render a SendRowWrapper component', () => {
      assert.equal(wrapper.find(SendRowWrapper).length, 1)
    })

    it('should pass the correct props to SendRowWrapper', () => {
      const {
        label,
      } = wrapper.find(SendRowWrapper).props()

      assert.equal(label, 'from_t:')
    })

    it('should render an FromDropdown as a child of the SendRowWrapper', () => {
      assert(wrapper.find(SendRowWrapper).childAt(0).is(FromDropdown))
    })

    it('should render the FromDropdown with the correct props', () => {
      const {
        accounts,
        closeDropdown,
        conversionRate,
        dropdownOpen,
        onSelect,
        openDropdown,
        selectedAccount,
      } = wrapper.find(SendRowWrapper).childAt(0).props()
      assert.deepEqual(accounts, ['mockAccount'])
      assert.equal(dropdownOpen, false)
      assert.equal(conversionRate, 15)
      assert.deepEqual(selectedAccount, { address: 'mockAddress' })
      assert.equal(propsMethodSpies.closeFromDropdown.callCount, 0)
      closeDropdown()
      assert.equal(propsMethodSpies.closeFromDropdown.callCount, 1)
      assert.equal(propsMethodSpies.openFromDropdown.callCount, 0)
      openDropdown()
      assert.equal(propsMethodSpies.openFromDropdown.callCount, 1)
      assert.equal(SendFromRow.prototype.handleFromChange.callCount, 0)
      onSelect('mockNewFrom')
      assert.equal(SendFromRow.prototype.handleFromChange.callCount, 1)
      assert.deepEqual(
        SendFromRow.prototype.handleFromChange.getCall(0).args,
        ['mockNewFrom']
      )
    })
  })
})
