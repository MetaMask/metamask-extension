import React from 'react';
import { GAS_ESTIMATE_TYPES } from '../../../../helpers/constants/common';
import GasPriceButtonGroup from '.';

export default {
  title: 'Components/App/GasCustomization/GasPriceButtonGroup',
  id: __filename,
  argTypes: {
    handleGasPriceSelection: {
      action: 'handleGasPriceSelection',
    },
  },
  args: {
    buttonDataLoading: false,
    className: 'gas-price-button-group',
    gasButtonInfo: [
      {
        gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
        feeInPrimaryCurrency: '$0.52',
        feeInSecondaryCurrency: '0.0048 ETH',
        timeEstimate: '~ 1 min 0 sec',
        priceInHexWei: '0xa1b2c3f',
      },
      {
        gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
        feeInPrimaryCurrency: '$0.39',
        feeInSecondaryCurrency: '0.004 ETH',
        timeEstimate: '~ 1 min 30 sec',
        priceInHexWei: '0xa1b2c39',
      },
      {
        gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
        feeInPrimaryCurrency: '$0.30',
        feeInSecondaryCurrency: '0.00354 ETH',
        timeEstimate: '~ 2 min 1 sec',
        priceInHexWei: '0xa1b2c30',
      },
    ],
    noButtonActiveByDefault: true,
    defaultActiveButtonIndex: 2,
    showCheck: true,
  },
};

export const DefaultStory = (args) => <GasPriceButtonGroup {...args} />;

DefaultStory.storyName = 'Default';
