import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import TokenBalance from '../../../ui/token-balance'
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display'
import { SEND_ROUTE } from '../../../../helpers/constants/routes'
import TransactionViewBalance from '../transaction-view-balance.component'

const propsMethodSpies = {
  showDepositModal: sinon.spy(),
}

const historySpies = {
  push: sinon.spy(),
}

const t = (str1, str2) => str2 ? str1 + str2 : str1
const metricsEvent = () => ({})

describe('TransactionViewBalance Component', () => {
  afterEach(() => {
    propsMethodSpies.showDepositModal.resetHistory()
    historySpies.push.resetHistory()
  })

  it('should render ETH balance properly', () => {
    const wrapper = shallow(<TransactionViewBalance
      showDepositModal={propsMethodSpies.showDepositModal}
      history={historySpies}
      network="3"
      ethBalance={123}
      fiatBalance={456}
      currentCurrency="usd"
    />, { context: { t, metricsEvent } })

    assert.equal(wrapper.find('.transaction-view-balance').length, 1)
    assert.equal(wrapper.find('.transaction-view-balance__button').length, 2)
    assert.equal(wrapper.find(UserPreferencedCurrencyDisplay).length, 2)

    const buttons = wrapper.find('.transaction-view-balance__buttons')
    assert.equal(propsMethodSpies.showDepositModal.callCount, 0)
    buttons.childAt(0).simulate('click')
    assert.equal(propsMethodSpies.showDepositModal.callCount, 1)
    assert.equal(historySpies.push.callCount, 0)
    buttons.childAt(1).simulate('click')
    assert.equal(historySpies.push.callCount, 1)
    assert.equal(historySpies.push.getCall(0).args[0], SEND_ROUTE)
  })

  it('should render token balance properly', () => {
    const token = {
      address: '0x35865238f0bec9d5ce6abff0fdaebe7b853dfcc5',
      decimals: '2',
      symbol: 'ABC',
    }

    const wrapper = shallow(<TransactionViewBalance
      showDepositModal={propsMethodSpies.showDepositModal}
      history={historySpies}
      network="3"
      ethBalance={123}
      fiatBalance={456}
      currentCurrency="usd"
      selectedToken={token}
    />, { context: { t } })

    assert.equal(wrapper.find('.transaction-view-balance').length, 1)
    assert.equal(wrapper.find('.transaction-view-balance__button').length, 1)
    assert.equal(wrapper.find(TokenBalance).length, 1)
  })
})
