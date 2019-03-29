import React from 'react'
import assert from 'assert'
import shallow from '../../../../../../lib/shallow-with-context'
import sinon from 'sinon'
import GasModalPageContainer from '../gas-modal-page-container.component.js'
import timeout from '../../../../../../lib/test-timeout'

import PageContainer from '../../../../ui/page-container'

import { Tab } from '../../../../ui/tabs'

const mockBasicGasEstimates = {
  blockTime: 'mockBlockTime',
}

const propsMethodSpies = {
  cancelAndClose: sinon.spy(),
  onSubmit: sinon.spy(),
  fetchBasicGasAndTimeEstimates: sinon.stub().returns(Promise.resolve(mockBasicGasEstimates)),
  fetchGasEstimates: sinon.spy(),
}

const mockGasPriceButtonGroupProps = {
  buttonDataLoading: false,
  className: 'gas-price-button-group',
  gasButtonInfo: [
    {
      feeInPrimaryCurrency: '$0.52',
      feeInSecondaryCurrency: '0.0048 ETH',
      timeEstimate: '~ 1 min 0 sec',
      priceInHexWei: '0xa1b2c3f',
    },
    {
      feeInPrimaryCurrency: '$0.39',
      feeInSecondaryCurrency: '0.004 ETH',
      timeEstimate: '~ 1 min 30 sec',
      priceInHexWei: '0xa1b2c39',
    },
    {
      feeInPrimaryCurrency: '$0.30',
      feeInSecondaryCurrency: '0.00354 ETH',
      timeEstimate: '~ 2 min 1 sec',
      priceInHexWei: '0xa1b2c30',
    },
  ],
  handleGasPriceSelection: 'mockSelectionFunction',
  noButtonActiveByDefault: true,
  showCheck: true,
  newTotalFiat: 'mockNewTotalFiat',
  newTotalEth: 'mockNewTotalEth',
}
const mockInfoRowProps = {
  originalTotalFiat: 'mockOriginalTotalFiat',
  originalTotalEth: 'mockOriginalTotalEth',
  newTotalFiat: 'mockNewTotalFiat',
  newTotalEth: 'mockNewTotalEth',
  sendAmount: 'mockSendAmount',
  transactionFee: 'mockTransactionFee',
}

const GP = GasModalPageContainer.prototype
describe('GasModalPageContainer Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<GasModalPageContainer
      cancelAndClose={propsMethodSpies.cancelAndClose}
      onSubmit={propsMethodSpies.onSubmit}
      fetchBasicGasAndTimeEstimates={propsMethodSpies.fetchBasicGasAndTimeEstimates}
      fetchGasEstimates={propsMethodSpies.fetchGasEstimates}
      updateCustomGasPrice={() => 'mockupdateCustomGasPrice'}
      updateCustomGasLimit={() => 'mockupdateCustomGasLimit'}
      customGasPrice={21}
      customGasLimit={54321}
      gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
      infoRowProps={mockInfoRowProps}
      currentTimeEstimate={'1 min 31 sec'}
      customGasPriceInHex={'mockCustomGasPriceInHex'}
      customGasLimitInHex={'mockCustomGasLimitInHex'}
      insufficientBalance={false}
      disableSave={false}
    />, { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } })
  })

  afterEach(() => {
    propsMethodSpies.cancelAndClose.resetHistory()
  })

  describe('componentDidMount', () => {
    it('should call props.fetchBasicGasAndTimeEstimates', () => {
      propsMethodSpies.fetchBasicGasAndTimeEstimates.resetHistory()
      assert.equal(propsMethodSpies.fetchBasicGasAndTimeEstimates.callCount, 0)
      wrapper.instance().componentDidMount()
      assert.equal(propsMethodSpies.fetchBasicGasAndTimeEstimates.callCount, 1)
    })

    it('should call props.fetchGasEstimates with the block time returned by fetchBasicGasAndTimeEstimates', async () => {
      propsMethodSpies.fetchGasEstimates.resetHistory()
      assert.equal(propsMethodSpies.fetchGasEstimates.callCount, 0)
      wrapper.instance().componentDidMount()
      await timeout(250)
      assert.equal(propsMethodSpies.fetchGasEstimates.callCount, 1)
      assert.equal(propsMethodSpies.fetchGasEstimates.getCall(0).args[0], 'mockBlockTime')
    })
  })

  describe('render', () => {
    it('should render a PageContainer compenent', () => {
      assert.equal(wrapper.find(PageContainer).length, 1)
    })

    it('should pass correct props to PageContainer', () => {
      const {
        title,
        subtitle,
        disabled,
      } = wrapper.find(PageContainer).props()
      assert.equal(title, 'customGas')
      assert.equal(subtitle, 'customGasSubTitle')
      assert.equal(disabled, false)
    })

    it('should pass the correct onCancel and onClose methods to PageContainer', () => {
      const {
        onCancel,
        onClose,
      } = wrapper.find(PageContainer).props()
      assert.equal(propsMethodSpies.cancelAndClose.callCount, 0)
      onCancel()
      assert.equal(propsMethodSpies.cancelAndClose.callCount, 1)
      onClose()
      assert.equal(propsMethodSpies.cancelAndClose.callCount, 2)
    })

    it('should pass the correct renderTabs property to PageContainer', () => {
      sinon.stub(GP, 'renderTabs').returns('mockTabs')
      const renderTabsWrapperTester = shallow(<GasModalPageContainer
        fetchBasicGasAndTimeEstimates={propsMethodSpies.fetchBasicGasAndTimeEstimates}
        fetchGasEstimates={propsMethodSpies.fetchGasEstimates}
      />, { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } })
      const { tabsComponent } = renderTabsWrapperTester.find(PageContainer).props()
      assert.equal(tabsComponent, 'mockTabs')
      GasModalPageContainer.prototype.renderTabs.restore()
    })
  })

  describe('renderTabs', () => {
    beforeEach(() => {
      sinon.spy(GP, 'renderBasicTabContent')
      sinon.spy(GP, 'renderAdvancedTabContent')
      sinon.spy(GP, 'renderInfoRows')
    })

    afterEach(() => {
      GP.renderBasicTabContent.restore()
      GP.renderAdvancedTabContent.restore()
      GP.renderInfoRows.restore()
    })

    it('should render a Tabs component with "Basic" and "Advanced" tabs', () => {
      const renderTabsResult = wrapper.instance().renderTabs(mockInfoRowProps, {
        gasPriceButtonGroupProps: mockGasPriceButtonGroupProps,
        otherProps: 'mockAdvancedTabProps',
      })
      const renderedTabs = shallow(renderTabsResult)
      assert.equal(renderedTabs.props().className, 'tabs')

      const tabs = renderedTabs.find(Tab)
      assert.equal(tabs.length, 2)

      assert.equal(tabs.at(0).props().name, 'basic')
      assert.equal(tabs.at(1).props().name, 'advanced')

      assert.equal(tabs.at(0).childAt(0).props().className, 'gas-modal-content')
      assert.equal(tabs.at(1).childAt(0).props().className, 'gas-modal-content')
    })

    it('should call renderBasicTabContent and renderAdvancedTabContent with the expected props', () => {
      assert.equal(GP.renderBasicTabContent.callCount, 0)
      assert.equal(GP.renderAdvancedTabContent.callCount, 0)

      wrapper.instance().renderTabs(mockInfoRowProps, { gasPriceButtonGroupProps: mockGasPriceButtonGroupProps, otherProps: 'mockAdvancedTabProps' })

      assert.equal(GP.renderBasicTabContent.callCount, 1)
      assert.equal(GP.renderAdvancedTabContent.callCount, 1)

      assert.deepEqual(GP.renderBasicTabContent.getCall(0).args[0], mockGasPriceButtonGroupProps)
      assert.deepEqual(GP.renderAdvancedTabContent.getCall(0).args[0], { transactionFee: 'mockTransactionFee', otherProps: 'mockAdvancedTabProps' })
    })

    it('should call renderInfoRows with the expected props', () => {
      assert.equal(GP.renderInfoRows.callCount, 0)

      wrapper.instance().renderTabs(mockInfoRowProps, { gasPriceButtonGroupProps: mockGasPriceButtonGroupProps, otherProps: 'mockAdvancedTabProps' })

      assert.equal(GP.renderInfoRows.callCount, 2)

      assert.deepEqual(GP.renderInfoRows.getCall(0).args, ['mockNewTotalFiat', 'mockNewTotalEth', 'mockSendAmount', 'mockTransactionFee'])
      assert.deepEqual(GP.renderInfoRows.getCall(1).args, ['mockNewTotalFiat', 'mockNewTotalEth', 'mockSendAmount', 'mockTransactionFee'])
    })

    it('should not render the basic tab if hideBasic is true', () => {
      const renderTabsResult = wrapper.instance().renderTabs(mockInfoRowProps, {
        gasPriceButtonGroupProps: mockGasPriceButtonGroupProps,
        otherProps: 'mockAdvancedTabProps',
        hideBasic: true,
      })

      const renderedTabs = shallow(renderTabsResult)
      const tabs = renderedTabs.find(Tab)
      assert.equal(tabs.length, 1)
      assert.equal(tabs.at(0).props().name, 'advanced')
    })
  })

  describe('renderBasicTabContent', () => {
    it('should render', () => {
      const renderBasicTabContentResult = wrapper.instance().renderBasicTabContent(mockGasPriceButtonGroupProps)

      assert.deepEqual(
        renderBasicTabContentResult.props.gasPriceButtonGroupProps,
        mockGasPriceButtonGroupProps
      )
    })
  })

  describe('renderAdvancedTabContent', () => {
    it('should render with the correct props', () => {
      const renderAdvancedTabContentResult = wrapper.instance().renderAdvancedTabContent({
        convertThenUpdateCustomGasPrice: () => 'mockConvertThenUpdateCustomGasPrice',
        convertThenUpdateCustomGasLimit: () => 'mockConvertThenUpdateCustomGasLimit',
        customGasPrice: 123,
        customGasLimit: 456,
        newTotalFiat: '$0.30',
        currentTimeEstimate: '1 min 31 sec',
        gasEstimatesLoading: 'mockGasEstimatesLoading',
      })
      const advancedTabContentProps = renderAdvancedTabContentResult.props
      assert.equal(advancedTabContentProps.updateCustomGasPrice(), 'mockConvertThenUpdateCustomGasPrice')
      assert.equal(advancedTabContentProps.updateCustomGasLimit(), 'mockConvertThenUpdateCustomGasLimit')
      assert.equal(advancedTabContentProps.customGasPrice, 123)
      assert.equal(advancedTabContentProps.customGasLimit, 456)
      assert.equal(advancedTabContentProps.timeRemaining, '1 min 31 sec')
      assert.equal(advancedTabContentProps.totalFee, '$0.30')
      assert.equal(advancedTabContentProps.gasEstimatesLoading, 'mockGasEstimatesLoading')
    })
  })

  describe('renderInfoRows', () => {
    it('should render the info rows with the passed data', () => {
      const baseClassName = 'gas-modal-content__info-row'
      const renderedInfoRowsContainer = shallow(wrapper.instance().renderInfoRows(
        'mockNewTotalFiat',
        ' mockNewTotalEth',
        ' mockSendAmount',
        ' mockTransactionFee'
      ))

      assert(renderedInfoRowsContainer.childAt(0).hasClass(baseClassName))

      const renderedInfoRows = renderedInfoRowsContainer.childAt(0).children()
      assert.equal(renderedInfoRows.length, 4)
      assert(renderedInfoRows.at(0).hasClass(`${baseClassName}__send-info`))
      assert(renderedInfoRows.at(1).hasClass(`${baseClassName}__transaction-info`))
      assert(renderedInfoRows.at(2).hasClass(`${baseClassName}__total-info`))
      assert(renderedInfoRows.at(3).hasClass(`${baseClassName}__fiat-total-info`))

      assert.equal(renderedInfoRows.at(0).text(), 'sendAmount mockSendAmount')
      assert.equal(renderedInfoRows.at(1).text(), 'transactionFee mockTransactionFee')
      assert.equal(renderedInfoRows.at(2).text(), 'newTotal mockNewTotalEth')
      assert.equal(renderedInfoRows.at(3).text(), 'mockNewTotalFiat')
    })
  })
})
