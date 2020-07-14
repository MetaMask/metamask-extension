import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import * as utils from '../../../../helpers/utils/util'
import Identicon from '../../../../components/ui/identicon'
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display'
import AccountListItem from '../account-list-item.component'

describe('AccountListItem Component', function () {
  let wrapper, propsMethodSpies, checksumAddressStub

  describe('render', function () {
    before(function () {
      checksumAddressStub = sinon.stub(utils, 'checksumAddress').returns('mockCheckSumAddress')
      propsMethodSpies = {
        handleClick: sinon.spy(),
      }
    })
    beforeEach(function () {
      wrapper = shallow((
        <AccountListItem
          account={ { address: 'mockAddress', name: 'mockName', balance: 'mockBalance' } }
          className="mockClassName"
          conversionRate={4}
          currentCurrency="mockCurrentyCurrency"
          nativeCurrency="ETH"
          displayAddress={false}
          displayBalance={false}
          handleClick={propsMethodSpies.handleClick}
          icon={<i className="mockIcon" />}
        />
      ), { context: { t: (str) => str + '_t' } })
    })

    afterEach(function () {
      propsMethodSpies.handleClick.resetHistory()
      checksumAddressStub.resetHistory()
    })

    after(function () {
      sinon.restore()
    })

    it('should render a div with the passed className', function () {
      assert.equal(wrapper.find('.mockClassName').length, 1)
      assert(wrapper.find('.mockClassName').is('div'))
      assert(wrapper.find('.mockClassName').hasClass('account-list-item'))
    })

    it('should call handleClick with the expected props when the root div is clicked', function () {
      const { onClick } = wrapper.find('.mockClassName').props()
      assert.equal(propsMethodSpies.handleClick.callCount, 0)
      onClick()
      assert.equal(propsMethodSpies.handleClick.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.handleClick.getCall(0).args,
        [{ address: 'mockAddress', name: 'mockName', balance: 'mockBalance' }],
      )
    })

    it('should have a top row div', function () {
      assert.equal(wrapper.find('.mockClassName > .account-list-item__top-row').length, 1)
      assert(wrapper.find('.mockClassName > .account-list-item__top-row').is('div'))
    })

    it('should have an identicon, name and icon in the top row', function () {
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find(Identicon).length, 1)
      assert.equal(topRow.find('.account-list-item__account-name').length, 1)
      assert.equal(topRow.find('.account-list-item__icon').length, 1)
    })

    it('should show the account name if it exists', function () {
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find('.account-list-item__account-name').text(), 'mockName')
    })

    it('should show the account address if there is no name', function () {
      wrapper.setProps({ account: { address: 'addressButNoName' } })
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find('.account-list-item__account-name').text(), 'addressButNoName')
    })

    it('should render the passed icon', function () {
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert(topRow.find('.account-list-item__icon').childAt(0).is('i'))
      assert(topRow.find('.account-list-item__icon').childAt(0).hasClass('mockIcon'))
    })

    it('should not render an icon if none is passed', function () {
      wrapper.setProps({ icon: null })
      const topRow = wrapper.find('.mockClassName > .account-list-item__top-row')
      assert.equal(topRow.find('.account-list-item__icon').length, 0)
    })

    it('should render the account address as a checksumAddress if displayAddress is true and name is provided', function () {
      wrapper.setProps({ displayAddress: true })
      assert.equal(wrapper.find('.account-list-item__account-address').length, 1)
      assert.equal(wrapper.find('.account-list-item__account-address').text(), 'mockCheckSumAddress')
      assert.deepEqual(
        checksumAddressStub.getCall(0).args,
        ['mockAddress'],
      )
    })

    it('should not render the account address as a checksumAddress if displayAddress is false', function () {
      wrapper.setProps({ displayAddress: false })
      assert.equal(wrapper.find('.account-list-item__account-address').length, 0)
    })

    it('should not render the account address as a checksumAddress if name is not provided', function () {
      wrapper.setProps({ account: { address: 'someAddressButNoName' } })
      assert.equal(wrapper.find('.account-list-item__account-address').length, 0)
    })

    it('should render a CurrencyDisplay with the correct props if displayBalance is true', function () {
      wrapper.setProps({ displayBalance: true })
      assert.equal(wrapper.find(UserPreferencedCurrencyDisplay).length, 2)
      assert.deepEqual(
        wrapper.find(UserPreferencedCurrencyDisplay).at(0).props(),
        {
          type: 'PRIMARY',
          value: 'mockBalance',
          hideTitle: true,
        },
      )
    })

    it('should only render one CurrencyDisplay if showFiat is false', function () {
      wrapper.setProps({ showFiat: false, displayBalance: true })
      assert.equal(wrapper.find(UserPreferencedCurrencyDisplay).length, 1)
      assert.deepEqual(
        wrapper.find(UserPreferencedCurrencyDisplay).at(0).props(),
        {
          type: 'PRIMARY',
          value: 'mockBalance',
          hideTitle: true,
        },
      )
    })

    it('should not render a CurrencyDisplay if displayBalance is false', function () {
      wrapper.setProps({ displayBalance: false })
      assert.equal(wrapper.find(UserPreferencedCurrencyDisplay).length, 0)
    })
  })
})
