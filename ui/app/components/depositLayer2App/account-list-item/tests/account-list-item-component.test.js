import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Identicon from '../../../identicon'
import CurrencyDisplay from '../../currency-display'

const utilsMethodStubs = {
  checksumAddress: sinon.stub().returns('mockCheckSumAddress'),
}

const AccountListItem = proxyquire('../account-list-item.component.js', {
  '../../../util': utilsMethodStubs,
}).default


const propsMethodSpies = {
  handleClick: sinon.spy(),
}

describe('AccountListItem Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<AccountListItem
      account={ { address: 'mockAddress', name: 'mockName', balance: 'mockBalance' } }
      className={'mockClassName'}
      conversionRate={4}
      currentCurrency={'mockCurrentyCurrency'}
      displayAddress={false}
      displayBalance={false}
      handleClick={propsMethodSpies.handleClick}
      icon={<i className="mockIcon" />}
    />, { context: { t: str => str + '_t' } })
  })

  afterEach(() => {
    propsMethodSpies.handleClick.resetHistory()
  })

  describe('render', () => {
    it('should render a div with the passed className', () => {
      assert.equal(wrapper.find('.mockClassName').length, 1)
      assert(wrapper.find('.mockClassName').is('div'))
      assert(wrapper.find('.mockClassName').hasClass('account-list-item'))
    })

    it('should call handleClick with the expected props when the root div is clicked', () => {
      const { onClick } = wrapper.find('.mockClassName').props()
      assert.equal(propsMethodSpies.handleClick.callCount, 0)
      onClick()
      assert.equal(propsMethodSpies.handleClick.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.handleClick.getCall(0).args,
        [{ address: 'mockAddress', name: 'mockName', balance: 'mockBalance' }]
      )
    })

    it('should have a top row div', () => {
      assert.equal(wrapper.find('.mockClassName > .account-list-item__top-row').length, 1)
      assert(wrapper.find('.mockClassName > .account-list-item__top-row').is('div'))
    })

    it('should have an identicon, name and icon in the top row', () => {
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find(Identicon).length, 1)
      assert.equal(topRow.find('.account-list-item__account-name').length, 1)
      assert.equal(topRow.find('.account-list-item__icon').length, 1)
    })

    it('should show the account name if it exists', () => {
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find('.account-list-item__account-name').text(), 'mockName')
    })

    it('should show the account address if there is no name', () => {
      wrapper.setProps({ account: { address: 'addressButNoName' } })
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find('.account-list-item__account-name').text(), 'addressButNoName')
    })

    it('should render the passed icon', () => {
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert(topRow.find('.account-list-item__icon').childAt(0).is('i'))
      assert(topRow.find('.account-list-item__icon').childAt(0).hasClass('mockIcon'))
    })

    it('should not render an icon if none is passed', () => {
      wrapper.setProps({ icon: null })
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find('.account-list-item__icon').length, 0)
    })

    it('should render the account address as a checksumAddress if displayAddress is true and name is provided', () => {
      wrapper.setProps({ displayAddress: true })
      assert.equal(wrapper.find('.account-list-item__account-address').length, 1)
      assert.equal(wrapper.find('.account-list-item__account-address').text(), 'mockCheckSumAddress')
      assert.deepEqual(
        utilsMethodStubs.checksumAddress.getCall(0).args,
        ['mockAddress']
      )
    })

    it('should not render the account address as a checksumAddress if displayAddress is false', () => {
      wrapper.setProps({ displayAddress: false })
      assert.equal(wrapper.find('.account-list-item__account-address').length, 0)
    })

    it('should not render the account address as a checksumAddress if name is not provided', () => {
      wrapper.setProps({ account: { address: 'someAddressButNoName' } })
      assert.equal(wrapper.find('.account-list-item__account-address').length, 0)
    })

    it('should render a CurrencyDisplay with the correct props if displayBalance is true', () => {
      wrapper.setProps({ displayBalance: true })
      assert.equal(wrapper.find(CurrencyDisplay).length, 1)
      assert.deepEqual(
        wrapper.find(CurrencyDisplay).props(),
        {
          className: 'account-list-item__account-balances',
          conversionRate: 4,
          convertedBalanceClassName: 'account-list-item__account-secondary-balance',
          convertedCurrency: 'mockCurrentyCurrency',
          primaryBalanceClassName: 'account-list-item__account-primary-balance',
          primaryCurrency: 'ETH',
          readOnly: true,
          value: 'mockBalance',
        }
      )
    })

    it('should not render a CurrencyDisplay if displayBalance is false', () => {
      wrapper.setProps({ displayBalance: false })
      assert.equal(wrapper.find(CurrencyDisplay).length, 0)
    })
  })
})
