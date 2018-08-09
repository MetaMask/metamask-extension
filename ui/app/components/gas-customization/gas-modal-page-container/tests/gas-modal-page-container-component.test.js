import React from 'react'
import assert from 'assert'
import shallow from '../../../../../lib/shallow-with-context'
import sinon from 'sinon'
import GasModalPageContainer from '../gas-modal-page-container.component.js'

import PageContainer from '../../../page-container'
import BasicTabContent from '../basic-tab-content'
import AdvancedTabContent from '../advanced-tab-content'

import { Tab } from '../../../tabs'

const propsMethodSpies = {
  hideModal: sinon.spy(),
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

describe('GasModalPageContainer Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<GasModalPageContainer
      hideModal={propsMethodSpies.hideModal}
      updateCustomGasPrice={() => 'mockupdateCustomGasPrice'}
      updateCustomGasLimit={() => 'mockupdateCustomGasLimit'}
      customGasPrice={21}
      customGasLimit={54321}
      gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
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
      sinon.stub(GasModalPageContainer.prototype, 'renderTabs').returns('mockTabs')
      const renderTabsWrapperTester = shallow(<GasModalPageContainer />, { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } })
      const { tabsComponent } = renderTabsWrapperTester.find(PageContainer).props()
      assert.equal(tabsComponent, 'mockTabs')
      GasModalPageContainer.prototype.renderTabs.restore()
    })
  })

  describe('renderTabs', () => {
    it('should render a Tabs component with "Basic" and "Advanced" tabs', () => {
      const renderTabsResult = wrapper.instance().renderTabs()
      const renderedTabs = shallow(renderTabsResult)
      assert.equal(renderedTabs.props().className, 'tabs')

      const tabs = renderedTabs.find(Tab)
      assert.equal(tabs.length, 2)

      assert.equal(tabs.at(0).props().name, 'basic')
      assert.equal(tabs.at(1).props().name, 'advanced')

      assert.equal(tabs.at(0).childAt(0).props().className, 'gas-modal-content')
      assert.equal(tabs.at(1).childAt(0).props().className, 'gas-modal-content')
    })

    it('should render the expected children of each tab', () => {
      const GP = GasModalPageContainer.prototype
      sinon.spy(GP, 'renderTabContent')
      assert.equal(GP.renderTabContent.callCount, 0)

      wrapper.instance().renderTabs()

      assert.equal(GP.renderTabContent.callCount, 2)

      assert.equal(GP.renderTabContent.firstCall.args.type, BasicTabContent.type)
      assert.equal(GP.renderTabContent.secondCall.args.type, AdvancedTabContent.type)

      GP.renderTabContent.restore()
    })
  })

  describe('renderTabContent', () => {
    it('should render a root gas-modal-content div', () => {
      const renderTabContentResult = wrapper.instance().renderTabContent(() => {})
      const renderedTabContent = shallow(renderTabContentResult)
      assert.equal(renderedTabContent.props().className, 'gas-modal-content')
    })

    it('should render the passed element as its first child', () => {
      const renderTabContentResult = wrapper.instance().renderTabContent(<span>Mock content</span>)
      const renderedTabContent = shallow(renderTabContentResult)
      assert(renderedTabContent.childAt(0).equals(<span>Mock content</span>))
    })

    it('should render the element results of renderInfoRow calls as second and third childs', () => {
      const GP = GasModalPageContainer.prototype
      sinon.stub(GP, 'renderInfoRow').callsFake((...args) => args.join(','))

      const renderTabContentResult = wrapper.instance().renderTabContent(() => <span>Mock content</span>)
      const renderedTabContent = shallow(renderTabContentResult)
      assert.equal(renderedTabContent.childAt(1).text(), 'gas-modal-content__info-row--fade,originalTotal,$20.02 USD,0.06685 ETH')
      assert.equal(renderedTabContent.childAt(2).text(), 'gas-modal-content__info-row,newTotal,$20.02 USD,0.06685 ETH')

      GP.renderInfoRow.restore()
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
      const renderBasicTabContentResult = wrapper.instance().renderBasicTabContent()

      assert.deepEqual(
        renderBasicTabContentResult.props.gasPriceButtonGroupProps,
        mockGasPriceButtonGroupProps
      )
    })
  })

  describe('renderAdvancedTabContent', () => {
    it('should render with the correct props', () => {
      const renderAdvancedTabContentResult = wrapper.instance().renderAdvancedTabContent()
      const advancedTabContentProps = renderAdvancedTabContentResult.props
      assert.equal(advancedTabContentProps.updateCustomGasPrice(), 'mockupdateCustomGasPrice')
      assert.equal(advancedTabContentProps.updateCustomGasLimit(), 'mockupdateCustomGasLimit')
      assert.equal(advancedTabContentProps.customGasPrice, 21)
      assert.equal(advancedTabContentProps.customGasLimit, 54321)
      assert.equal(advancedTabContentProps.millisecondsRemaining, 91000)
      assert.equal(advancedTabContentProps.totalFee, '$0.30')
      assert(shallow(renderAdvancedTabContentResult).hasClass('advanced-tab'))
    })
  })
})
