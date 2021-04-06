import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import shallow from '../../../../../../lib/shallow-with-context';
import AdvancedTabContent from './advanced-tab-content.component';

describe('AdvancedTabContent Component', function () {
  let wrapper;

  beforeEach(function () {
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

  afterEach(function () {
    sinon.restore();
  });

  describe('render()', function () {
    it('should render the advanced-tab root node', function () {
      assert(wrapper.hasClass('advanced-tab'));
    });

    it('should render the expected child of the advanced-tab div', function () {
      const advancedTabChildren = wrapper.children();
      assert.strictEqual(advancedTabChildren.length, 2);

      assert(
        advancedTabChildren
          .at(0)
          .hasClass('advanced-tab__transaction-data-summary'),
      );
    });

    it('should call renderDataSummary with the expected params', function () {
      const renderDataSummaryArgs = AdvancedTabContent.prototype.renderDataSummary.getCall(
        0,
      ).args;
      assert.deepStrictEqual(renderDataSummaryArgs, ['$0.25']);
    });
  });

  describe('renderDataSummary()', function () {
    let dataSummary;

    beforeEach(function () {
      dataSummary = shallow(
        wrapper.instance().renderDataSummary('mockTotalFee'),
      );
    });

    it('should render the transaction-data-summary root node', function () {
      assert(dataSummary.hasClass('advanced-tab__transaction-data-summary'));
    });

    it('should render titles of the data', function () {
      const titlesNode = dataSummary.children().at(0);
      assert(
        titlesNode.hasClass('advanced-tab__transaction-data-summary__titles'),
      );
      assert.strictEqual(
        titlesNode.children().at(0).text(),
        'newTransactionFee',
      );
    });

    it('should render the data', function () {
      const dataNode = dataSummary.children().at(1);
      assert(
        dataNode.hasClass('advanced-tab__transaction-data-summary__container'),
      );
      assert.strictEqual(dataNode.children().at(0).text(), 'mockTotalFee');
    });
  });
});
