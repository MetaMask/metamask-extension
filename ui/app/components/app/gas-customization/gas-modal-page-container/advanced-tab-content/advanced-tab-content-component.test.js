import React from 'react';
import sinon from 'sinon';
import shallow from '../../../../../../lib/shallow-with-context';
import AdvancedTabContent from './advanced-tab-content.component';

describe('AdvancedTabContent Component', () => {
  let wrapper;

  beforeEach(() => {
    const propsMethodSpies = {
      updateCustomGasPrice: sinon.spy(),
      updateCustomGasLimit: sinon.spy(),
    };
    sinon.spy(AdvancedTabContent.prototype, 'renderDataSummary');

    wrapper = shallow(
      <AdvancedTabContent
        updateCustomGasPrice={propsMethodSpies.updateCustomGasPrice}
        updateCustomGasLimit={propsMethodSpies.updateCustomGasLimit}
        customModalGasPriceInHex="11"
        customModalGasLimitInHex="23456"
        transactionFee="$0.25"
        insufficientBalance={false}
        customPriceIsSafe
        isSpeedUp={false}
      />,
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('render()', () => {
    it('should render the advanced-tab root node', () => {
      expect(wrapper.hasClass('advanced-tab')).toStrictEqual(true);
    });

    it('should render the expected child of the advanced-tab div', () => {
      const advancedTabChildren = wrapper.children();
      expect(advancedTabChildren).toHaveLength(2);

      expect(
        advancedTabChildren
          .at(0)
          .hasClass('advanced-tab__transaction-data-summary'),
      ).toStrictEqual(true);
    });

    it('should call renderDataSummary with the expected params', () => {
      const renderDataSummaryArgs = AdvancedTabContent.prototype.renderDataSummary.getCall(
        0,
      ).args;
      expect(renderDataSummaryArgs).toStrictEqual(['$0.25']);
    });
  });

  describe('renderDataSummary()', () => {
    let dataSummary;

    beforeEach(() => {
      dataSummary = shallow(
        wrapper.instance().renderDataSummary('mockTotalFee'),
      );
    });

    it('should render the transaction-data-summary root node', () => {
      expect(
        dataSummary.hasClass('advanced-tab__transaction-data-summary'),
      ).toStrictEqual(true);
    });

    it('should render titles of the data', () => {
      const titlesNode = dataSummary.children().at(0);
      expect(
        titlesNode.hasClass('advanced-tab__transaction-data-summary__titles'),
      ).toStrictEqual(true);
      expect(titlesNode.children().at(0).text()).toStrictEqual(
        'newTransactionFee',
      );
    });

    it('should render the data', () => {
      const dataNode = dataSummary.children().at(1);
      expect(
        dataNode.hasClass('advanced-tab__transaction-data-summary__container'),
      ).toStrictEqual(true);
      expect(dataNode.children().at(0).text()).toStrictEqual('mockTotalFee');
    });
  });
});
