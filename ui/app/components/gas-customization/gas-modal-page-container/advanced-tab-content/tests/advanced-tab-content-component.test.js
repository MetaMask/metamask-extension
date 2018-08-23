import React from 'react'
import assert from 'assert'
import shallow from '../../../../../../lib/shallow-with-context'
import sinon from 'sinon'
import AdvancedTabContent from '../advanced-tab-content.component.js'

import TimeRemaining from '../time-remaining'

const propsMethodSpies = {
  updateCustomGasPrice: sinon.spy(),
  updateCustomGasLimit: sinon.spy(),
}

sinon.spy(AdvancedTabContent.prototype, 'renderGasEditRow')
sinon.spy(AdvancedTabContent.prototype, 'gasInput')

describe('AdvancedTabContent Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<AdvancedTabContent
      updateCustomGasPrice={propsMethodSpies.updateCustomGasPrice}
      updateCustomGasLimit={propsMethodSpies.updateCustomGasLimit}
      customGasPrice={11}
      customGasLimit={23456}
      millisecondsRemaining={21500}
      totalFee={'$0.25'}
    />, { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } })
  })

  afterEach(() => {
    propsMethodSpies.updateCustomGasPrice.resetHistory()
    propsMethodSpies.updateCustomGasLimit.resetHistory()
  })

  describe('render()', () => {
    it('should render the advanced-tab root node', () => {
      assert(wrapper.hasClass('advanced-tab'))
    })

    it('should render the expected four children of the advanced-tab div', () => {
      const advancedTabChildren = wrapper.children()
      assert.equal(advancedTabChildren.length, 4)

      assert(advancedTabChildren.at(0).hasClass('advanced-tab__transaction-data-summary'))
      assert(advancedTabChildren.at(1).hasClass('advanced-tab__fee-chart-title'))
      assert(advancedTabChildren.at(2).hasClass('advanced-tab__fee-chart'))
      assert(advancedTabChildren.at(3).hasClass('advanced-tab__gas-edit-rows'))
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
      assert(dataNode.children().at(1).is(TimeRemaining))
      assert.equal(dataNode.children().at(1).props().milliseconds, 'mockMsRemaining')
    })
  })

  describe('renderGasEditRow()', () => {
    let gasEditRow

    beforeEach(() => {
      AdvancedTabContent.prototype.gasInput.resetHistory()
      gasEditRow = shallow(wrapper.instance().renderGasEditRow(
        'mockLabelKey', 'argA', 'argB'
      ))
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
      assert.deepEqual(gasInputSpyArgs[0], [ 'argA', 'argB' ])
    })
  })

  describe('renderGasEditRows()', () => {
    let gasEditRows

    beforeEach(() => {
      AdvancedTabContent.prototype.renderGasEditRow.resetHistory()
      gasEditRows = shallow(wrapper.instance().renderGasEditRows(
        'mockGasPrice',
        () => 'mockUpdateCustomGasPriceReturn',
        'mockGasLimit',
        () => 'mockUpdateCustomGasLimitReturn'
      ))
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
      assert.deepEqual(renderGasEditRowSpyArgs[0].map(String), [
        'gasPriceNoDenom', 'mockGasPrice', () => 'mockUpdateCustomGasPriceReturn', '0', 9, true,
      ].map(String))
      assert.deepEqual(renderGasEditRowSpyArgs[1].map(String), [
        'gasLimit', 'mockGasLimit', () => 'mockUpdateCustomGasLimitReturn', 21000, '0',
      ].map(String))
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
      gasInput = shallow(wrapper.instance().gasInput(
        321,
        value => value + 7,
        0,
        8,
        false
      ))
    })

    it('should render the input-wrapper root node', () => {
      assert(gasInput.hasClass('advanced-tab__gas-edit-row__input-wrapper'))
    })

    it('should render an input, but not a GWEI symbol', () => {
      assert.equal(gasInput.children().length, 1)
      assert(gasInput.children().at(0).hasClass('advanced-tab__gas-edit-row__input'))
    })

    it('should show GWEI if the showGWEI prop is truthy', () => {
      const gasInputWithGWEI = shallow(wrapper.instance().gasInput(
        321,
        value => value + 7,
        0,
        8,
        true
      ))
      assert.equal(gasInputWithGWEI.children().length, 2)
      assert(gasInputWithGWEI.children().at(0).hasClass('advanced-tab__gas-edit-row__input'))
      assert(gasInputWithGWEI.children().at(1).hasClass('advanced-tab__gas-edit-row__gwei-symbol'))
    })

    it('should pass the correct value min and precision props to the input', () => {
      const inputProps = gasInput.find('input').props()
      assert.equal(inputProps.min, 0)
      assert.equal(inputProps.value, 321)
      assert.equal(inputProps.precision, 8)
    })

    it('should call the passed onChange method with the value of the input onChange event', () => {
      const inputOnChange = gasInput.find('input').props().onChange
      assert.equal(inputOnChange({ target: { value: 8} }), 15)
    })
  })

})
