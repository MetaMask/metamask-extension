import React from 'react'
import assert from 'assert'
import shallow from '../../../../../lib/shallow-with-context'
import sinon from 'sinon'
import GasModalPageContainer from '../gas-modal-page-container.component.js'

import PageContainer from '../../../page-container'

import { Tab } from '../../../tabs'

const propsMethodSpies = {
  hideModal: sinon.spy(),
  onSubmit: sinon.spy(),
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
}
const mockInfoRowProps = {
  originalTotalFiat: 'mockOriginalTotalFiat',
  originalTotalEth: 'mockOriginalTotalEth',
  newTotalFiat: 'mockNewTotalFiat',
  newTotalEth: 'mockNewTotalEth',
}

const GP = GasModalPageContainer.prototype
describe('GasModalPageContainer Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<GasModalPageContainer
      hideModal={propsMethodSpies.hideModal}
      onSubmit={propsMethodSpies.onSubmit}
      updateCustomGasPrice={() => 'mockupdateCustomGasPrice'}
      updateCustomGasLimit={() => 'mockupdateCustomGasLimit'}
      customGasPrice={21}
      customGasLimit={54321}
      gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
      infoRowProps={mockInfoRowProps}
      customGasPriceInHex={'mockCustomGasPriceInHex'}
      customGasLimitInHex={'mockCustomGasLimitInHex'}
    />, { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } })
  })

  afterEach(() => {
    propsMethodSpies.hideModal.resetHistory()
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
      assert.equal(propsMethodSpies.hideModal.callCount, 0)
      onCancel()
      assert.equal(propsMethodSpies.hideModal.callCount, 1)
      onClose()
      assert.equal(propsMethodSpies.hideModal.callCount, 2)
    })

    it('should pass the correct renderTabs property to PageContainer', () => {
      sinon.stub(GP, 'renderTabs').returns('mockTabs')
      const renderTabsWrapperTester = shallow(<GasModalPageContainer />, { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } })
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
      assert.deepEqual(GP.renderAdvancedTabContent.getCall(0).args[0], { otherProps: 'mockAdvancedTabProps' })
    })

    it('should call renderInfoRows with the expected props', () => {
      assert.equal(GP.renderInfoRows.callCount, 0)

      wrapper.instance().renderTabs(mockInfoRowProps, { gasPriceButtonGroupProps: mockGasPriceButtonGroupProps, otherProps: 'mockAdvancedTabProps' })

      assert.equal(GP.renderInfoRows.callCount, 2)

      assert.deepEqual(GP.renderInfoRows.getCall(0).args, ['mockOriginalTotalFiat', 'mockOriginalTotalEth', 'mockNewTotalFiat', 'mockNewTotalEth'])
      assert.deepEqual(GP.renderInfoRows.getCall(1).args, ['mockOriginalTotalFiat', 'mockOriginalTotalEth', 'mockNewTotalFiat', 'mockNewTotalEth'])
    })
  })

  describe('renderInfoRow', () => {
    it('should render a div with the passed className and two children, each with the expected text', () => {
      const renderInfoRowResult = wrapper.instance().renderInfoRow('mockClassName', 'mockLabelKey', 'mockFiatAmount', 'mockCryptoAmount')
      const renderedInfoRow = shallow(renderInfoRowResult)
      assert.equal(renderedInfoRow.props().className, 'mockClassName')

      const firstChild = renderedInfoRow.childAt(0)
      const secondhild = renderedInfoRow.childAt(1)

      assert.equal(firstChild.props().className, 'mockClassName__total-info')
      assert.equal(secondhild.props().className, 'mockClassName__sum-info')

      assert.equal(firstChild.childAt(0).text(), 'mockLabelKey:')
      assert.equal(firstChild.childAt(1).text(), 'mockFiatAmount')
      assert.equal(secondhild.childAt(0).text(), 'amountPlusTxFee')
      assert.equal(secondhild.childAt(1).text(), 'mockCryptoAmount')
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
      })
      const advancedTabContentProps = renderAdvancedTabContentResult.props
      assert.equal(advancedTabContentProps.updateCustomGasPrice(), 'mockConvertThenUpdateCustomGasPrice')
      assert.equal(advancedTabContentProps.updateCustomGasLimit(), 'mockConvertThenUpdateCustomGasLimit')
      assert.equal(advancedTabContentProps.customGasPrice, 123)
      assert.equal(advancedTabContentProps.customGasLimit, 456)
      assert.equal(advancedTabContentProps.millisecondsRemaining, 91000)
      assert.equal(advancedTabContentProps.totalFee, '$0.30')
    })
  })
})
