import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import shallow from '../../../../../../lib/shallow-with-context'
import GasModalPageContainer from '../gas-modal-page-container.component'
import timeout from '../../../../../../lib/test-timeout'

import PageContainer from '../../../../ui/page-container'

import { Tab } from '../../../../ui/tabs'

const mockBasicGasEstimates = {
  blockTime: 'mockBlockTime',
}

const propsMethodSpies = {
  cancelAndClose: sinon.spy(),
  onSubmit: sinon.spy(),
  fetchBasicGasAndTimeEstimates: sinon
    .stub()
    .returns(Promise.resolve(mockBasicGasEstimates)),
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
  extraInfoRow: { label: 'mockLabel', value: 'mockValue' },
}

const GP = GasModalPageContainer.prototype
describe('GasModalPageContainer Component', function () {
  let wrapper

  beforeEach(function () {
    wrapper = shallow(
      <GasModalPageContainer
        cancelAndClose={propsMethodSpies.cancelAndClose}
        onSubmit={propsMethodSpies.onSubmit}
        fetchBasicGasAndTimeEstimates={
          propsMethodSpies.fetchBasicGasAndTimeEstimates
        }
        fetchGasEstimates={propsMethodSpies.fetchGasEstimates}
        updateCustomGasPrice={() => 'mockupdateCustomGasPrice'}
        updateCustomGasLimit={() => 'mockupdateCustomGasLimit'}
        customGasPrice={21}
        customGasLimit={54321}
        gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
        infoRowProps={mockInfoRowProps}
        currentTimeEstimate="1 min 31 sec"
        customGasPriceInHex="mockCustomGasPriceInHex"
        customGasLimitInHex="mockCustomGasLimitInHex"
        insufficientBalance={false}
        disableSave={false}
      />,
    )
  })

  afterEach(function () {
    propsMethodSpies.cancelAndClose.resetHistory()
  })

  describe('componentDidMount', function () {
    it('should call props.fetchBasicGasAndTimeEstimates', function () {
      propsMethodSpies.fetchBasicGasAndTimeEstimates.resetHistory()
      assert.equal(propsMethodSpies.fetchBasicGasAndTimeEstimates.callCount, 0)
      wrapper.instance().componentDidMount()
      assert.equal(propsMethodSpies.fetchBasicGasAndTimeEstimates.callCount, 1)
    })

    it('should call props.fetchGasEstimates with the block time returned by fetchBasicGasAndTimeEstimates', async function () {
      propsMethodSpies.fetchGasEstimates.resetHistory()
      assert.equal(propsMethodSpies.fetchGasEstimates.callCount, 0)
      wrapper.instance().componentDidMount()
      await timeout(250)
      assert.equal(propsMethodSpies.fetchGasEstimates.callCount, 1)
      assert.equal(
        propsMethodSpies.fetchGasEstimates.getCall(0).args[0],
        'mockBlockTime',
      )
    })
  })

  describe('render', function () {
    it('should render a PageContainer compenent', function () {
      assert.equal(wrapper.find(PageContainer).length, 1)
    })

    it('should pass correct props to PageContainer', function () {
      const { title, subtitle, disabled } = wrapper.find(PageContainer).props()
      assert.equal(title, 'customGas')
      assert.equal(subtitle, 'customGasSubTitle')
      assert.equal(disabled, false)
    })

    it('should pass the correct onCancel and onClose methods to PageContainer', function () {
      const { onCancel, onClose } = wrapper.find(PageContainer).props()
      assert.equal(propsMethodSpies.cancelAndClose.callCount, 0)
      onCancel()
      assert.equal(propsMethodSpies.cancelAndClose.callCount, 1)
      onClose()
      assert.equal(propsMethodSpies.cancelAndClose.callCount, 2)
    })

    it('should pass the correct renderTabs property to PageContainer', function () {
      sinon.stub(GP, 'renderTabs').returns('mockTabs')
      const renderTabsWrapperTester = shallow(
        <GasModalPageContainer
          fetchBasicGasAndTimeEstimates={
            propsMethodSpies.fetchBasicGasAndTimeEstimates
          }
          fetchGasEstimates={propsMethodSpies.fetchGasEstimates}
        />,
        { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
      )
      const { tabsComponent } = renderTabsWrapperTester
        .find(PageContainer)
        .props()
      assert.equal(tabsComponent, 'mockTabs')
      GasModalPageContainer.prototype.renderTabs.restore()
    })
  })

  describe('renderTabs', function () {
    beforeEach(function () {
      sinon.spy(GP, 'renderBasicTabContent')
      sinon.spy(GP, 'renderAdvancedTabContent')
      sinon.spy(GP, 'renderInfoRows')
    })

    afterEach(function () {
      GP.renderBasicTabContent.restore()
      GP.renderAdvancedTabContent.restore()
      GP.renderInfoRows.restore()
    })

    it('should render a Tabs component with "Basic" and "Advanced" tabs', function () {
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

    it('should call renderInfoRows with the expected props', function () {
      assert.equal(GP.renderInfoRows.callCount, 0)

      wrapper.instance().renderTabs()

      assert.equal(GP.renderInfoRows.callCount, 2)

      assert.deepEqual(GP.renderInfoRows.getCall(0).args, [
        'mockNewTotalFiat',
        'mockNewTotalEth',
        'mockSendAmount',
        'mockTransactionFee',
        { label: 'mockLabel', value: 'mockValue' },
      ])
      assert.deepEqual(GP.renderInfoRows.getCall(1).args, [
        'mockNewTotalFiat',
        'mockNewTotalEth',
        'mockSendAmount',
        'mockTransactionFee',
        { label: 'mockLabel', value: 'mockValue' },
      ])
    })

    it('should not render the basic tab if hideBasic is true', function () {
      wrapper = shallow(
        <GasModalPageContainer
          cancelAndClose={propsMethodSpies.cancelAndClose}
          onSubmit={propsMethodSpies.onSubmit}
          fetchBasicGasAndTimeEstimates={
            propsMethodSpies.fetchBasicGasAndTimeEstimates
          }
          fetchGasEstimates={propsMethodSpies.fetchGasEstimates}
          updateCustomGasPrice={() => 'mockupdateCustomGasPrice'}
          updateCustomGasLimit={() => 'mockupdateCustomGasLimit'}
          customGasPrice={21}
          customGasLimit={54321}
          gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
          infoRowProps={mockInfoRowProps}
          currentTimeEstimate="1 min 31 sec"
          customGasPriceInHex="mockCustomGasPriceInHex"
          customGasLimitInHex="mockCustomGasLimitInHex"
          insufficientBalance={false}
          disableSave={false}
          hideBasic
        />,
      )
      const renderTabsResult = wrapper.instance().renderTabs()

      const renderedTabs = shallow(renderTabsResult)
      const tabs = renderedTabs.find(Tab)
      assert.equal(tabs.length, 1)
      assert.equal(tabs.at(0).props().name, 'advanced')
    })
  })

  describe('renderBasicTabContent', function () {
    it('should render', function () {
      const renderBasicTabContentResult = wrapper
        .instance()
        .renderBasicTabContent(mockGasPriceButtonGroupProps)

      assert.deepEqual(
        renderBasicTabContentResult.props.gasPriceButtonGroupProps,
        mockGasPriceButtonGroupProps,
      )
    })
  })

  describe('renderInfoRows', function () {
    it('should render the info rows with the passed data', function () {
      const baseClassName = 'gas-modal-content__info-row'
      const renderedInfoRowsContainer = shallow(
        wrapper
          .instance()
          .renderInfoRows(
            'mockNewTotalFiat',
            ' mockNewTotalEth',
            ' mockSendAmount',
            ' mockTransactionFee',
          ),
      )

      assert(renderedInfoRowsContainer.childAt(0).hasClass(baseClassName))

      const renderedInfoRows = renderedInfoRowsContainer.childAt(0).children()
      assert.equal(renderedInfoRows.length, 4)
      assert(renderedInfoRows.at(0).hasClass(`${baseClassName}__send-info`))
      assert(
        renderedInfoRows.at(1).hasClass(`${baseClassName}__transaction-info`),
      )
      assert(renderedInfoRows.at(2).hasClass(`${baseClassName}__total-info`))
      assert(
        renderedInfoRows.at(3).hasClass(`${baseClassName}__fiat-total-info`),
      )

      assert.equal(renderedInfoRows.at(0).text(), 'sendAmount mockSendAmount')
      assert.equal(
        renderedInfoRows.at(1).text(),
        'transactionFee mockTransactionFee',
      )
      assert.equal(renderedInfoRows.at(2).text(), 'newTotal mockNewTotalEth')
      assert.equal(renderedInfoRows.at(3).text(), 'mockNewTotalFiat')
    })
  })
})
