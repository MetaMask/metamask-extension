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

describe('BasicTabContent Component', () => {
  describe('render', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallow(
        <BasicTabContent
          gasPriceButtonGroupProps={mockGasPriceButtonGroupProps}
        />,
      );
    });

    it('should have a title', () => {
      expect(
        wrapper
          .find('.basic-tab-content')
          .childAt(0)
          .hasClass('basic-tab-content__title'),
      ).toStrictEqual(true);
    });

    it('should render a GasPriceButtonGroup compenent', () => {
      expect(wrapper.find(GasPriceButtonGroup)).toHaveLength(1);
    });

    it('should pass correct props to GasPriceButtonGroup', () => {
      const {
        buttonDataLoading,
        className,
        gasButtonInfo,
        handleGasPriceSelection,
        noButtonActiveByDefault,
        showCheck,
      } = wrapper.find(GasPriceButtonGroup).props();
      expect(wrapper.find(GasPriceButtonGroup)).toHaveLength(1);
      expect(buttonDataLoading).toStrictEqual(
        mockGasPriceButtonGroupProps.buttonDataLoading,
      );
      expect(className).toStrictEqual(mockGasPriceButtonGroupProps.className);
      expect(noButtonActiveByDefault).toStrictEqual(
        mockGasPriceButtonGroupProps.noButtonActiveByDefault,
      );
      expect(showCheck).toStrictEqual(mockGasPriceButtonGroupProps.showCheck);
      expect(gasButtonInfo).toStrictEqual(
        mockGasPriceButtonGroupProps.gasButtonInfo,
      );
      expect(handleGasPriceSelection).toStrictEqual(
        mockGasPriceButtonGroupProps.handleGasPriceSelection,
      );
    });

    it('should render a loading component instead of the GasPriceButtonGroup if gasPriceButtonGroupProps.loading is true', () => {
      wrapper.setProps({
        gasPriceButtonGroupProps: {
          ...mockGasPriceButtonGroupProps,
          loading: true,
        },
      });

      expect(wrapper.find(GasPriceButtonGroup)).toHaveLength(0);
      expect(wrapper.find(Loading)).toHaveLength(1);
    });
  });
});
