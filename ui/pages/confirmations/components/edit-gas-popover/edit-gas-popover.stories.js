import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import {
  EditGasModes,
  GasRecommendations,
} from '../../../../../shared/constants/gas';

import { decGWEIToHexWEI } from '../../../../../shared/modules/conversion.utils';
import EditGasPopover from '.';

const store = configureStore(testData);

export default {
  title: 'Confirmations/Components/EditGasPopover',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],

  argTypes: {
    editGasDisplayProps: {
      control: 'object',
    },
    transaction: {
      control: 'object',
    },
    defaultEstimateToUse: { control: 'text' },
    mode: { control: 'text' },
    confirmButtonText: { control: 'text' },
    minimumGasLimit: { control: 'text' },
    onClose: { action: 'Close Edit Gas Popover' },
  },
};

const transaction = {
  userFeeLevel: GasRecommendations.medium,
  txParams: {
    maxFeePerGas: decGWEIToHexWEI('10000'),
    maxPriorityFeePerGas: '0x5600',
    gas: `0x5600`,
    gasPrice: '0x5600',
  },
};
const defaultEstimateToUse = GasRecommendations.high;
const mode = EditGasModes.swaps;
const confirmButtonText = 'Submit';
const minimumGasLimit = '5700';

export const DefaultStory = (args) => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasPopover {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  transaction,
  defaultEstimateToUse,
  mode,
  confirmButtonText,
  minimumGasLimit,
};
