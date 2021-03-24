import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import shallow from '../../../../../lib/shallow-with-context';

import PageContainer from '../../../ui/page-container';

import { Tab } from '../../../ui/tabs';
import GasModalPageContainer from './gas-modal-page-container.component';

const mockBasicGasEstimates = {
  average: '20',
};

const propsMethodSpies = {
  cancelAndClose: sinon.spy(),
  onSubmit: sinon.spy(),
  fetchBasicGasEstimates: sinon
    .stub()
    .returns(Promise.resolve(mockBasicGasEstimates)),
};

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
};
const mockInfoRowProps = {
  originalTotalFiat: 'mockOriginalTotalFiat',
  originalTotalEth: 'mockOriginalTotalEth',
  newTotalFiat: 'mockNewTotalFiat',
  newTotalEth: 'mockNewTotalEth',
  sendAmount: 'mockSendAmount',
  transactionFee: 'mockTransactionFee',
  extraInfoRow: { label: 'mockLabel', value: 'mockValue' },
};

const GP = GasModalPageContainer.prototype;
describe('GasModalPageContainer Component', function () {
  let wrapper;

  beforeEach(function () {
    wrapper = shallow(
      <GasModalPageContainer
        cancelAndClose={propsMethodSpies.cancelAndClose}
        onSubmit={propsMethodSpies.onSubmit}
        fetchBasicGasEstimates={propsMethodSpies.fetchBasicGasEstimates}
        updateCustomGasPrice={() => 'mockupdateCustomGasPrice'}
        updateCustomGasLimit={() => 'mockupdateCustomGasLimit'}
        gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
        infoRowProps={mockInfoRowProps}
        customGasPriceInHex="mockCustomGasPriceInHex"
        customGasLimitInHex="mockCustomGasLimitInHex"
        insufficientBalance={false}
        disableSave={false}
      />,
    );
  });

  afterEach(function () {
    propsMethodSpies.cancelAndClose.resetHistory();
  });

  describe('componentDidMount', function () {
    it('should call props.fetchBasicGasEstimates', function () {
      propsMethodSpies.fetchBasicGasEstimates.resetHistory();
      assert.strictEqual(propsMethodSpies.fetchBasicGasEstimates.callCount, 0);
      wrapper.instance().componentDidMount();
      assert.strictEqual(propsMethodSpies.fetchBasicGasEstimates.callCount, 1);
    });
  });

  describe('render', function () {
    it('should render a PageContainer compenent', function () {
      assert.strictEqual(wrapper.find(PageContainer).length, 1);
    });

    it('should pass correct props to PageContainer', function () {
      const { title, subtitle, disabled } = wrapper.find(PageContainer).props();
      assert.strictEqual(title, 'customGas');
      assert.strictEqual(subtitle, 'customGasSubTitle');
      assert.strictEqual(disabled, false);
    });

    it('should pass the correct onCancel and onClose methods to PageContainer', function () {
      const { onCancel, onClose } = wrapper.find(PageContainer).props();
      assert.strictEqual(propsMethodSpies.cancelAndClose.callCount, 0);
      onCancel();
      assert.strictEqual(propsMethodSpies.cancelAndClose.callCount, 1);
      onClose();
      assert.strictEqual(propsMethodSpies.cancelAndClose.callCount, 2);
    });

    it('should pass the correct renderTabs property to PageContainer', function () {
      sinon.stub(GP, 'renderTabs').returns('mockTabs');
      const renderTabsWrapperTester = shallow(
        <GasModalPageContainer
          fetchBasicGasEstimates={propsMethodSpies.fetchBasicGasEstimates}
          fetchGasEstimates={propsMethodSpies.fetchGasEstimates}
        />,
        { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
      );
      const { tabsComponent } = renderTabsWrapperTester
        .find(PageContainer)
        .props();
      assert.strictEqual(tabsComponent, 'mockTabs');
      GasModalPageContainer.prototype.renderTabs.restore();
    });
  });

  describe('renderTabs', function () {
    beforeEach(function () {
      sinon.spy(GP, 'renderBasicTabContent');
      sinon.spy(GP, 'renderAdvancedTabContent');
      sinon.spy(GP, 'renderInfoRows');
    });

    afterEach(function () {
      GP.renderBasicTabContent.restore();
      GP.renderAdvancedTabContent.restore();
      GP.renderInfoRows.restore();
    });

    it('should render a Tabs component with "Basic" and "Advanced" tabs', function () {
      const renderTabsResult = wrapper.instance().renderTabs();
      const renderedTabs = shallow(renderTabsResult);
      assert.strictEqual(renderedTabs.props().className, 'tabs');

      const tabs = renderedTabs.find(Tab);
      assert.strictEqual(tabs.length, 2);

      assert.strictEqual(tabs.at(0).props().name, 'basic');
      assert.strictEqual(tabs.at(1).props().name, 'advanced');

      assert.strictEqual(
        tabs.at(0).childAt(0).props().className,
        'gas-modal-content',
      );
      assert.strictEqual(
        tabs.at(1).childAt(0).props().className,
        'gas-modal-content',
      );
    });

    it('should call renderInfoRows with the expected props', function () {
      assert.strictEqual(GP.renderInfoRows.callCount, 0);

      wrapper.instance().renderTabs();

      assert.strictEqual(GP.renderInfoRows.callCount, 2);

      assert.deepStrictEqual(GP.renderInfoRows.getCall(0).args, [
        'mockNewTotalFiat',
        'mockNewTotalEth',
        'mockSendAmount',
        'mockTransactionFee',
      ]);
      assert.deepStrictEqual(GP.renderInfoRows.getCall(1).args, [
        'mockNewTotalFiat',
        'mockNewTotalEth',
        'mockSendAmount',
        'mockTransactionFee',
      ]);
    });

    it('should not render the basic tab if hideBasic is true', function () {
      wrapper = shallow(
        <GasModalPageContainer
          cancelAndClose={propsMethodSpies.cancelAndClose}
          onSubmit={propsMethodSpies.onSubmit}
          fetchBasicGasEstimates={propsMethodSpies.fetchBasicGasEstimates}
          updateCustomGasPrice={() => 'mockupdateCustomGasPrice'}
          updateCustomGasLimit={() => 'mockupdateCustomGasLimit'}
          gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
          infoRowProps={mockInfoRowProps}
          customGasPriceInHex="mockCustomGasPriceInHex"
          customGasLimitInHex="mockCustomGasLimitInHex"
          insufficientBalance={false}
          disableSave={false}
          hideBasic
        />,
      );
      const renderTabsResult = wrapper.instance().renderTabs();

      const renderedTabs = shallow(renderTabsResult);
      const tabs = renderedTabs.find(Tab);
      assert.strictEqual(tabs.length, 1);
      assert.strictEqual(tabs.at(0).props().name, 'advanced');
    });
  });

  describe('renderBasicTabContent', function () {
    it('should render', function () {
      const renderBasicTabContentResult = wrapper
        .instance()
        .renderBasicTabContent(mockGasPriceButtonGroupProps);

      assert.deepStrictEqual(
        renderBasicTabContentResult.props.gasPriceButtonGroupProps,
        mockGasPriceButtonGroupProps,
      );
    });
  });

  describe('renderInfoRows', function () {
    it('should render the info rows with the passed data', function () {
      const baseClassName = 'gas-modal-content__info-row';
      const renderedInfoRowsContainer = shallow(
        wrapper
          .instance()
          .renderInfoRows(
            'mockNewTotalFiat',
            ' mockNewTotalEth',
            ' mockSendAmount',
            ' mockTransactionFee',
          ),
      );

      assert(renderedInfoRowsContainer.childAt(0).hasClass(baseClassName));

      const renderedInfoRows = renderedInfoRowsContainer.childAt(0).children();
      assert.strictEqual(renderedInfoRows.length, 4);
      assert(renderedInfoRows.at(0).hasClass(`${baseClassName}__send-info`));
      assert(
        renderedInfoRows.at(1).hasClass(`${baseClassName}__transaction-info`),
      );
      assert(renderedInfoRows.at(2).hasClass(`${baseClassName}__total-info`));
      assert(
        renderedInfoRows.at(3).hasClass(`${baseClassName}__fiat-total-info`),
      );

      assert.strictEqual(
        renderedInfoRows.at(0).text(),
        'sendAmount mockSendAmount',
      );
      assert.strictEqual(
        renderedInfoRows.at(1).text(),
        'transactionFee mockTransactionFee',
      );
      assert.strictEqual(
        renderedInfoRows.at(2).text(),
        'newTotal mockNewTotalEth',
      );
      assert.strictEqual(renderedInfoRows.at(3).text(), 'mockNewTotalFiat');
    });
  });
});
