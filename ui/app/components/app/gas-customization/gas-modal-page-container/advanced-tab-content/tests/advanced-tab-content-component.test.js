import React from 'react'
import assert from 'assert'
import shallow from '../../../../../../../lib/shallow-with-context'
import sinon from 'sinon'
import AdvancedTabContent from '../advanced-tab-content.component.js'

import GasPriceChart from '../../../gas-price-chart'
import Loading from '../../../../../ui/loading-screen'

const propsMethodSpies = {
  updateCustomGasPrice: sinon.spy(),
  updateCustomGasLimit: sinon.spy(),
}

sinon.spy(AdvancedTabContent.prototype, 'renderGasEditRow')
sinon.spy(AdvancedTabContent.prototype, 'gasInput')
sinon.spy(AdvancedTabContent.prototype, 'renderGasEditRows')
sinon.spy(AdvancedTabContent.prototype, 'renderDataSummary')
sinon.spy(AdvancedTabContent.prototype, 'gasInputError')

describe('AdvancedTabContent Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<AdvancedTabContent
      updateCustomGasPrice={propsMethodSpies.updateCustomGasPrice}
      updateCustomGasLimit={propsMethodSpies.updateCustomGasLimit}
      customGasPrice={11}
      customGasLimit={23456}
      timeRemaining={21500}
      transactionFee={'$0.25'}
      insufficientBalance={false}
      customPriceIsSafe={true}
      isSpeedUp={false}
      isEthereumNetwork={true}
    />, { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } })
  })

  afterEach(() => {
    propsMethodSpies.updateCustomGasPrice.resetHistory()
    propsMethodSpies.updateCustomGasLimit.resetHistory()
    AdvancedTabContent.prototype.renderGasEditRow.resetHistory()
    AdvancedTabContent.prototype.gasInput.resetHistory()
    AdvancedTabContent.prototype.renderGasEditRows.resetHistory()
    AdvancedTabContent.prototype.renderDataSummary.resetHistory()
  })

  describe('render()', () => {
    it('should render the advanced-tab root node', () => {
      assert(wrapper.hasClass('advanced-tab'))
    })

    it('should render the expected four children of the advanced-tab div', () => {
      const advancedTabChildren = wrapper.children()
      assert.equal(advancedTabChildren.length, 2)

      assert(advancedTabChildren.at(0).hasClass('advanced-tab__transaction-data-summary'))
      assert(advancedTabChildren.at(1).hasClass('advanced-tab__fee-chart'))

      const feeChartDiv = advancedTabChildren.at(1)

      assert(feeChartDiv.childAt(0).hasClass('advanced-tab__gas-edit-rows'))
      assert(feeChartDiv.childAt(1).childAt(0).hasClass('advanced-tab__fee-chart__title'))
      assert(feeChartDiv.childAt(1).childAt(1).is(GasPriceChart))
      assert(feeChartDiv.childAt(1).childAt(2).hasClass('advanced-tab__fee-chart__speed-buttons'))
    })

    it('should render a loading component instead of the chart if gasEstimatesLoading is true', () => {
      wrapper.setProps({ gasEstimatesLoading: true })
      const advancedTabChildren = wrapper.children()
      assert.equal(advancedTabChildren.length, 2)

      assert(advancedTabChildren.at(0).hasClass('advanced-tab__transaction-data-summary'))
      assert(advancedTabChildren.at(1).hasClass('advanced-tab__fee-chart'))

      const feeChartDiv = advancedTabChildren.at(1)

      assert(feeChartDiv.childAt(0).hasClass('advanced-tab__gas-edit-rows'))
      assert(feeChartDiv.childAt(1).childAt(0).hasClass('advanced-tab__fee-chart__title'))
      assert(feeChartDiv.childAt(1).childAt(1).is(Loading))
      assert(feeChartDiv.childAt(1).childAt(2).hasClass('advanced-tab__fee-chart__speed-buttons'))
    })

    it('should call renderDataSummary with the expected params', () => {
      assert.equal(AdvancedTabContent.prototype.renderGasEditRows.callCount, 1)
      const renderDataSummaryArgs = AdvancedTabContent.prototype.renderDataSummary.getCall(0).args
      assert.deepEqual(renderDataSummaryArgs, ['$0.25', 21500])
    })

    it('should call renderGasEditRows with the expected params', () => {
      assert.equal(AdvancedTabContent.prototype.renderGasEditRows.callCount, 1)
      const renderGasEditRowArgs = AdvancedTabContent.prototype.renderGasEditRows.getCall(0).args
      assert.deepEqual(renderGasEditRowArgs, [{
        customGasPrice: 11,
        customGasLimit: 23456,
        insufficientBalance: false,
        customPriceIsSafe: true,
        updateCustomGasPrice: propsMethodSpies.updateCustomGasPrice,
        updateCustomGasLimit: propsMethodSpies.updateCustomGasLimit,
        isSpeedUp: false,
      }])
    })
  })

  describe('renderDataSummary()', () => {
    let dataSummary

    beforeEach(() => {
      dataSummary = shallow(wrapper.instance().renderDataSummary('mockTotalFee', 'mockMsRemaining'))
    })

    it('should render the transaction-data-summary root node', () => {
      assert(dataSummary.hasClass('advanced-tab__transaction-data-summary'))
    })

    it('should render titles of the data', () => {
      const titlesNode = dataSummary.children().at(0)
      assert(titlesNode.hasClass('advanced-tab__transaction-data-summary__titles'))
      assert.equal(titlesNode.children().at(0).text(), 'newTransactionFee')
      assert.equal(titlesNode.children().at(1).text(), '~transactionTime')
    })

    it('should render the data', () => {
      const dataNode = dataSummary.children().at(1)
      assert(dataNode.hasClass('advanced-tab__transaction-data-summary__container'))
      assert.equal(dataNode.children().at(0).text(), 'mockTotalFee')
      assert(dataNode.children().at(1).hasClass('advanced-tab__transaction-data-summary__time-remaining'))
      assert.equal(dataNode.children().at(1).text(), 'mockMsRemaining')
    })
  })

  describe('renderGasEditRow()', () => {
    let gasEditRow

    beforeEach(() => {
      AdvancedTabContent.prototype.gasInput.resetHistory()
      gasEditRow = shallow(wrapper.instance().renderGasEditRow({
        labelKey: 'mockLabelKey',
        someArg: 'argA',
      }))
    })

    it('should render the gas-edit-row root node', () => {
      assert(gasEditRow.hasClass('advanced-tab__gas-edit-row'))
    })

    it('should render a label and an input', () => {
      const gasEditRowChildren = gasEditRow.children()
      assert.equal(gasEditRowChildren.length, 2)
      assert(gasEditRowChildren.at(0).hasClass('advanced-tab__gas-edit-row__label'))
      assert(gasEditRowChildren.at(1).hasClass('advanced-tab__gas-edit-row__input-wrapper'))
    })

    it('should render the label key and info button', () => {
      const gasRowLabelChildren = gasEditRow.children().at(0).children()
      assert.equal(gasRowLabelChildren.length, 2)
      assert(gasRowLabelChildren.at(0), 'mockLabelKey')
      assert(gasRowLabelChildren.at(1).hasClass('fa-info-circle'))
    })

    it('should call this.gasInput with the correct args', () => {
      const gasInputSpyArgs = AdvancedTabContent.prototype.gasInput.args
      assert.deepEqual(gasInputSpyArgs[0], [ { labelKey: 'mockLabelKey', someArg: 'argA' } ])
    })
  })

  describe('renderGasEditRows()', () => {
    let gasEditRows
    let tempOnChangeGasLimit

    beforeEach(() => {
      tempOnChangeGasLimit = wrapper.instance().onChangeGasLimit
      wrapper.instance().onChangeGasLimit = () => 'mockOnChangeGasLimit'
      AdvancedTabContent.prototype.renderGasEditRow.resetHistory()
      gasEditRows = shallow(wrapper.instance().renderGasEditRows(
        'mockGasPrice',
        () => 'mockUpdateCustomGasPriceReturn',
        'mockGasLimit',
        () => 'mockUpdateCustomGasLimitReturn',
        false
      ))
    })

    afterEach(() => {
      wrapper.instance().onChangeGasLimit = tempOnChangeGasLimit
    })

    it('should render the gas-edit-rows root node', () => {
      assert(gasEditRows.hasClass('advanced-tab__gas-edit-rows'))
    })

    it('should render two rows', () => {
      const gasEditRowsChildren = gasEditRows.children()
      assert.equal(gasEditRowsChildren.length, 2)
      assert(gasEditRowsChildren.at(0).hasClass('advanced-tab__gas-edit-row'))
      assert(gasEditRowsChildren.at(1).hasClass('advanced-tab__gas-edit-row'))
    })

    it('should call this.renderGasEditRow twice, with the expected args', () => {
      const renderGasEditRowSpyArgs = AdvancedTabContent.prototype.renderGasEditRow.args
      assert.equal(renderGasEditRowSpyArgs.length, 2)
      assert.deepEqual(renderGasEditRowSpyArgs[0].map(String), [{
        labelKey: 'gasPrice',
        value: 'mockGasLimit',
        onChange: () => 'mockOnChangeGasLimit',
        insufficientBalance: false,
        customPriceIsSafe: true,
        showGWEI: true,
      }].map(String))
      assert.deepEqual(renderGasEditRowSpyArgs[1].map(String), [{
        labelKey: 'gasPrice',
        value: 'mockGasPrice',
        onChange: () => 'mockUpdateCustomGasPriceReturn',
        insufficientBalance: false,
        customPriceIsSafe: true,
        showGWEI: true,
      }].map(String))
    })
  })

  describe('infoButton()', () => {
    let infoButton

    beforeEach(() => {
      AdvancedTabContent.prototype.renderGasEditRow.resetHistory()
      infoButton = shallow(wrapper.instance().infoButton(() => 'mockOnClickReturn'))
    })

    it('should render the i element', () => {
      assert(infoButton.hasClass('fa-info-circle'))
    })

    it('should pass the onClick argument to the i tag onClick prop', () => {
      assert(infoButton.props().onClick(), 'mockOnClickReturn')
    })
  })

  describe('gasInput()', () => {
    let gasInput

    beforeEach(() => {
      AdvancedTabContent.prototype.renderGasEditRow.resetHistory()
      AdvancedTabContent.prototype.gasInputError.resetHistory()
      gasInput = shallow(wrapper.instance().gasInput({
        labelKey: 'gasPrice',
        value: 321,
        onChange: value => value + 7,
        insufficientBalance: false,
        showGWEI: true,
        customPriceIsSafe: true,
        isSpeedUp: false,
      }))
    })

    it('should render the input-wrapper root node', () => {
      assert(gasInput.hasClass('advanced-tab__gas-edit-row__input-wrapper'))
    })

    it('should render two children, including an input', () => {
      assert.equal(gasInput.children().length, 2)
      assert(gasInput.children().at(0).hasClass('advanced-tab__gas-edit-row__input'))
    })

    it('should call the passed onChange method with the value of the input onChange event', () => {
      const inputOnChange = gasInput.find('input').props().onChange
      assert.equal(inputOnChange({ target: { value: 8} }), 15)
    })

    it('should have two input arrows', () => {
      const upArrow = gasInput.find('.fa-angle-up')
      assert.equal(upArrow.length, 1)
      const downArrow = gasInput.find('.fa-angle-down')
      assert.equal(downArrow.length, 1)
    })

    it('should call onChange with the value incremented decremented when its onchange method is called', () => {
      const upArrow = gasInput.find('.advanced-tab__gas-edit-row__input-arrows__i-wrap').at(0)
      assert.equal(upArrow.props().onClick(), 329)
      const downArrow = gasInput.find('.advanced-tab__gas-edit-row__input-arrows__i-wrap').at(1)
      assert.equal(downArrow.props().onClick(), 327)
    })

    it('should call gasInputError with the expected params', () => {
      assert.equal(AdvancedTabContent.prototype.gasInputError.callCount, 1)
      const gasInputErrorArgs = AdvancedTabContent.prototype.gasInputError.getCall(0).args
      assert.deepEqual(gasInputErrorArgs, [{
        labelKey: 'gasPrice',
        insufficientBalance: false,
        customPriceIsSafe: true,
        value: 321,
        isSpeedUp: false,
      }])
    })
  })

  describe('gasInputError()', () => {
    let gasInputError

    beforeEach(() => {
      AdvancedTabContent.prototype.renderGasEditRow.resetHistory()
      gasInputError = wrapper.instance().gasInputError({
        labelKey: '',
        insufficientBalance: false,
        customPriceIsSafe: true,
        isSpeedUp: false,
      })
    })

    it('should return an insufficientBalance error', () => {
      const gasInputError = wrapper.instance().gasInputError({
        labelKey: 'gasPrice',
        insufficientBalance: true,
        customPriceIsSafe: true,
        isSpeedUp: false,
        value: 1,
      })
      assert.deepEqual(gasInputError, {
        isInError: true,
        errorText: 'insufficientBalance',
        errorType: 'error',
      })
    })

    it('should return a zero gas on retry error', () => {
      const gasInputError = wrapper.instance().gasInputError({
        labelKey: 'gasPrice',
        insufficientBalance: false,
        customPriceIsSafe: false,
        isSpeedUp: true,
        value: 0,
      })
      assert.deepEqual(gasInputError, {
        isInError: true,
        errorText: 'zeroGasPriceOnSpeedUpError',
        errorType: 'error',
      })
    })

    it('should return a low gas warning', () => {
      const gasInputError = wrapper.instance().gasInputError({
        labelKey: 'gasPrice',
        insufficientBalance: false,
        customPriceIsSafe: false,
        isSpeedUp: false,
        value: 1,
      })
      assert.deepEqual(gasInputError, {
        isInError: true,
        errorText: 'gasPriceExtremelyLow',
        errorType: 'warning',
      })
    })

    it('should return isInError false if there is no error', () => {
      gasInputError = wrapper.instance().gasInputError({
        labelKey: 'gasPrice',
        insufficientBalance: false,
        customPriceIsSafe: true,
        value: 1,
      })
      assert.equal(gasInputError.isInError, false)
    })
  })

})
