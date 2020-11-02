import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import shallow from '../../../../../../../lib/shallow-with-context'
import AdvancedTabContent from '../advanced-tab-content.component'

import GasPriceChart from '../../../gas-price-chart'
import Loading from '../../../../../ui/loading-screen'

describe('AdvancedTabContent Component', function () {
  let wrapper

  beforeEach(function () {
    const propsMethodSpies = {
      updateCustomGasPrice: sinon.spy(),
      updateCustomGasLimit: sinon.spy(),
    }
    sinon.spy(AdvancedTabContent.prototype, 'renderDataSummary')

    wrapper = shallow(
      <AdvancedTabContent
        updateCustomGasPrice={propsMethodSpies.updateCustomGasPrice}
        updateCustomGasLimit={propsMethodSpies.updateCustomGasLimit}
        customModalGasPriceInHex="11"
        customModalGasLimitInHex="23456"
        timeRemaining="21500"
        transactionFee="$0.25"
        insufficientBalance={false}
        customPriceIsSafe
        isSpeedUp={false}
        isEthereumNetwork
      />,
    )
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('render()', function () {
    it('should render the advanced-tab root node', function () {
      assert(wrapper.hasClass('advanced-tab'))
    })

    it('should render the expected four children of the advanced-tab div', function () {
      const advancedTabChildren = wrapper.children()
      assert.equal(advancedTabChildren.length, 2)

      assert(
        advancedTabChildren
          .at(0)
          .hasClass('advanced-tab__transaction-data-summary'),
      )
      assert(advancedTabChildren.at(1).hasClass('advanced-tab__fee-chart'))

      const feeChartDiv = advancedTabChildren.at(1)

      assert(
        feeChartDiv
          .childAt(1)
          .childAt(0)
          .hasClass('advanced-tab__fee-chart__title'),
      )
      assert(feeChartDiv.childAt(1).childAt(1).is(GasPriceChart))
      assert(
        feeChartDiv
          .childAt(1)
          .childAt(2)
          .hasClass('advanced-tab__fee-chart__speed-buttons'),
      )
    })

    it('should render a loading component instead of the chart if gasEstimatesLoading is true', function () {
      wrapper.setProps({ gasEstimatesLoading: true })
      const advancedTabChildren = wrapper.children()
      assert.equal(advancedTabChildren.length, 2)

      assert(
        advancedTabChildren
          .at(0)
          .hasClass('advanced-tab__transaction-data-summary'),
      )
      assert(advancedTabChildren.at(1).hasClass('advanced-tab__fee-chart'))

      const feeChartDiv = advancedTabChildren.at(1)

      assert(
        feeChartDiv
          .childAt(1)
          .childAt(0)
          .hasClass('advanced-tab__fee-chart__title'),
      )
      assert(feeChartDiv.childAt(1).childAt(1).is(Loading))
      assert(
        feeChartDiv
          .childAt(1)
          .childAt(2)
          .hasClass('advanced-tab__fee-chart__speed-buttons'),
      )
    })

    it('should call renderDataSummary with the expected params', function () {
      const renderDataSummaryArgs = AdvancedTabContent.prototype.renderDataSummary.getCall(
        0,
      ).args
      assert.deepEqual(renderDataSummaryArgs, ['$0.25', 21500])
    })
  })

  describe('renderDataSummary()', function () {
    let dataSummary

    beforeEach(function () {
      dataSummary = shallow(
        wrapper.instance().renderDataSummary('mockTotalFee', 'mockMsRemaining'),
      )
    })

    it('should render the transaction-data-summary root node', function () {
      assert(dataSummary.hasClass('advanced-tab__transaction-data-summary'))
    })

    it('should render titles of the data', function () {
      const titlesNode = dataSummary.children().at(0)
      assert(
        titlesNode.hasClass('advanced-tab__transaction-data-summary__titles'),
      )
      assert.equal(titlesNode.children().at(0).text(), 'newTransactionFee')
      assert.equal(titlesNode.children().at(1).text(), '~transactionTime')
    })

    it('should render the data', function () {
      const dataNode = dataSummary.children().at(1)
      assert(
        dataNode.hasClass('advanced-tab__transaction-data-summary__container'),
      )
      assert.equal(dataNode.children().at(0).text(), 'mockTotalFee')
      assert(
        dataNode
          .children()
          .at(1)
          .hasClass('advanced-tab__transaction-data-summary__time-remaining'),
      )
      assert.equal(dataNode.children().at(1).text(), 'mockMsRemaining')
    })
  })
})
