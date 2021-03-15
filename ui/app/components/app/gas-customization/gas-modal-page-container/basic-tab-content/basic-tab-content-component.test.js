import assert from 'assert';
import React from 'react';
import shallow from '../../../../../../lib/shallow-with-context';
import GasPriceButtonGroup from '../../gas-price-button-group';
import Loading from '../../../../ui/loading-screen';
import { GAS_ESTIMATE_TYPES } from '../../../../../helpers/constants/common';
import BasicTabContent from './basic-tab-content.component';

const mockGasPriceButtonGroupProps = {
  buttonDataLoading: false,
  className: 'gas-price-button-group',
  gasButtonInfo: [
    {
      feeInPrimaryCurrency: '$0.52',
      feeInSecondaryCurrency: '0.0048 ETH',
      timeEstimate: '~ 1 min 0 sec',
      priceInHexWei: '0xa1b2c3f',
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
    },
    {
      feeInPrimaryCurrency: '$0.39',
      feeInSecondaryCurrency: '0.004 ETH',
      timeEstimate: '~ 1 min 30 sec',
      priceInHexWei: '0xa1b2c39',
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
    },
    {
      feeInPrimaryCurrency: '$0.30',
      feeInSecondaryCurrency: '0.00354 ETH',
      timeEstimate: '~ 2 min 1 sec',
      priceInHexWei: '0xa1b2c30',
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
    },
  ],
  handleGasPriceSelection: ({ gasPrice }) =>
    console.log('NewPrice: ', gasPrice),
  noButtonActiveByDefault: true,
  showCheck: true,
};

describe('BasicTabContent Component', function () {
  describe('render', function () {
    let wrapper;

    beforeEach(function () {
      wrapper = shallow(
        <BasicTabContent
          gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
        />,
      );
    });

    it('should have a title', function () {
      assert(
        wrapper
          .find('.basic-tab-content')
          .childAt(0)
          .hasClass('basic-tab-content__title'),
      );
    });

    it('should render a GasPriceButtonGroup compenent', function () {
      assert.strictEqual(wrapper.find(GasPriceButtonGroup).length, 1);
    });

    it('should pass correct props to GasPriceButtonGroup', function () {
      const {
        buttonDataLoading,
        className,
        gasButtonInfo,
        handleGasPriceSelection,
        noButtonActiveByDefault,
        showCheck,
      } = wrapper.find(GasPriceButtonGroup).props();
      assert.strictEqual(wrapper.find(GasPriceButtonGroup).length, 1);
      assert.strictEqual(
        buttonDataLoading,
        mockGasPriceButtonGroupProps.buttonDataLoading,
      );
      assert.strictEqual(className, mockGasPriceButtonGroupProps.className);
      assert.strictEqual(
        noButtonActiveByDefault,
        mockGasPriceButtonGroupProps.noButtonActiveByDefault,
      );
      assert.strictEqual(showCheck, mockGasPriceButtonGroupProps.showCheck);
      assert.deepStrictEqual(
        gasButtonInfo,
        mockGasPriceButtonGroupProps.gasButtonInfo,
      );
      assert.strictEqual(
        JSON.stringify(handleGasPriceSelection),
        JSON.stringify(mockGasPriceButtonGroupProps.handleGasPriceSelection),
      );
    });

    it('should render a loading component instead of the GasPriceButtonGroup if gasPriceButtonGroupProps.loading is true', function () {
      wrapper.setProps({
        gasPriceButtonGroupProps: {
          ...mockGasPriceButtonGroupProps,
          loading: true,
        },
      });

      assert.strictEqual(wrapper.find(GasPriceButtonGroup).length, 0);
      assert.strictEqual(wrapper.find(Loading).length, 1);
    });
  });
});
