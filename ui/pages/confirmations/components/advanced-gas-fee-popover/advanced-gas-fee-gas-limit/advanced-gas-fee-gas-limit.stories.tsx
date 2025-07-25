import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../../../.storybook/test-data';
import configureStore from '../../../../../store/store';
import { AdvancedGasFeePopoverContextProvider } from '../context';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import AdvancedGasFeeGasLimit from './advanced-gas-fee-gas-limit';

const store = configureStore(testData);

const meta: Meta<typeof AdvancedGasFeeGasLimit> = {
  title: 'Pages/Confirmations/Components/AdvancedGasFeePopover/AdvancedGasFeeGasLimit',
  component: AdvancedGasFeeGasLimit,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <GasFeeContextProvider
          transaction={{
            userFeeLevel: 'custom',
            txParams: { gas: '0x5208' }, // 21000 in hex
            chainId: '0x1',
            originalGasEstimate: '0x5208',
          }}
        >
          <AdvancedGasFeePopoverContextProvider>
              <Story />
          </AdvancedGasFeePopoverContextProvider>
        </GasFeeContextProvider>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdvancedGasFeeGasLimit>;

export const Default: Story = {};
