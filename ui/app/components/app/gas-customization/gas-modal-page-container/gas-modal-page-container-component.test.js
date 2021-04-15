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
describe('GasModalPageContainer Component', () => {
  let wrapper;

  beforeEach(() => {
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

  afterEach(() => {
    propsMethodSpies.cancelAndClose.resetHistory();
  });

  describe('componentDidMount', () => {
    it('should call props.fetchBasicGasEstimates', () => {
      propsMethodSpies.fetchBasicGasEstimates.resetHistory();
      expect(propsMethodSpies.fetchBasicGasEstimates.callCount).toStrictEqual(
        0,
      );
      wrapper.instance().componentDidMount();
      expect(propsMethodSpies.fetchBasicGasEstimates.callCount).toStrictEqual(
        1,
      );
    });
  });

  describe('render', () => {
    it('should render a PageContainer compenent', () => {
      expect(wrapper.find(PageContainer)).toHaveLength(1);
    });

    it('should pass correct props to PageContainer', () => {
      const { title, subtitle, disabled } = wrapper.find(PageContainer).props();
      expect(title).toStrictEqual('customGas');
      expect(subtitle).toStrictEqual('customGasSubTitle');
      expect(disabled).toStrictEqual(false);
    });

    it('should pass the correct onCancel and onClose methods to PageContainer', () => {
      const { onCancel, onClose } = wrapper.find(PageContainer).props();
      expect(propsMethodSpies.cancelAndClose.callCount).toStrictEqual(0);
      onCancel();
      expect(propsMethodSpies.cancelAndClose.callCount).toStrictEqual(1);
      onClose();
      expect(propsMethodSpies.cancelAndClose.callCount).toStrictEqual(2);
    });

    it('should pass the correct renderTabs property to PageContainer', () => {
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
      expect(tabsComponent).toStrictEqual('mockTabs');
      GasModalPageContainer.prototype.renderTabs.restore();
    });
  });

  describe('renderTabs', () => {
    beforeEach(() => {
      sinon.spy(GP, 'renderBasicTabContent');
      sinon.spy(GP, 'renderAdvancedTabContent');
      sinon.spy(GP, 'renderInfoRows');
    });

    afterEach(() => {
      GP.renderBasicTabContent.restore();
      GP.renderAdvancedTabContent.restore();
      GP.renderInfoRows.restore();
    });

    it('should render a Tabs component with "Basic" and "Advanced" tabs', () => {
      const renderTabsResult = wrapper.instance().renderTabs();
      const renderedTabs = shallow(renderTabsResult);
      expect(renderedTabs.props().className).toStrictEqual('tabs');

      const tabs = renderedTabs.find(Tab);
      expect(tabs).toHaveLength(2);

      expect(tabs.at(0).props().name).toStrictEqual('basic');
      expect(tabs.at(1).props().name).toStrictEqual('advanced');

      expect(tabs.at(0).childAt(0).props().className).toStrictEqual(
        'gas-modal-content',
      );
      expect(tabs.at(1).childAt(0).props().className).toStrictEqual(
        'gas-modal-content',
      );
    });

    it('should call renderInfoRows with the expected props', () => {
      expect(GP.renderInfoRows.callCount).toStrictEqual(0);

      wrapper.instance().renderTabs();

      expect(GP.renderInfoRows.callCount).toStrictEqual(2);

      expect(GP.renderInfoRows.getCall(0).args).toStrictEqual([
        'mockNewTotalFiat',
        'mockNewTotalEth',
        'mockSendAmount',
        'mockTransactionFee',
      ]);
      expect(GP.renderInfoRows.getCall(1).args).toStrictEqual([
        'mockNewTotalFiat',
        'mockNewTotalEth',
        'mockSendAmount',
        'mockTransactionFee',
      ]);
    });

    it('should not render the basic tab if hideBasic is true', () => {
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
      expect(tabs).toHaveLength(1);
      expect(tabs.at(0).props().name).toStrictEqual('advanced');
    });
  });

  describe('renderBasicTabContent', () => {
    it('should render', () => {
      const renderBasicTabContentResult = wrapper
        .instance()
        .renderBasicTabContent(mockGasPriceButtonGroupProps);

      expect(
        renderBasicTabContentResult.props.gasPriceButtonGroupProps,
      ).toStrictEqual(mockGasPriceButtonGroupProps);
    });
  });

  describe('renderInfoRows', () => {
    it('should render the info rows with the passed data', () => {
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

      expect(
        renderedInfoRowsContainer.childAt(0).hasClass(baseClassName),
      ).toStrictEqual(true);

      const renderedInfoRows = renderedInfoRowsContainer.childAt(0).children();
      expect(renderedInfoRows).toHaveLength(4);
      expect(
        renderedInfoRows.at(0).hasClass(`${baseClassName}__send-info`),
      ).toStrictEqual(true);
      expect(
        renderedInfoRows.at(1).hasClass(`${baseClassName}__transaction-info`),
      ).toStrictEqual(true);
      expect(
        renderedInfoRows.at(2).hasClass(`${baseClassName}__total-info`),
      ).toStrictEqual(true);
      expect(
        renderedInfoRows.at(3).hasClass(`${baseClassName}__fiat-total-info`),
      ).toStrictEqual(true);

      expect(renderedInfoRows.at(0).text()).toStrictEqual(
        'sendAmount mockSendAmount',
      );
      expect(renderedInfoRows.at(1).text()).toStrictEqual(
        'transactionFee mockTransactionFee',
      );
      expect(renderedInfoRows.at(2).text()).toStrictEqual(
        'newTotal mockNewTotalEth',
      );
      expect(renderedInfoRows.at(3).text()).toStrictEqual('mockNewTotalFiat');
    });
  });
});
