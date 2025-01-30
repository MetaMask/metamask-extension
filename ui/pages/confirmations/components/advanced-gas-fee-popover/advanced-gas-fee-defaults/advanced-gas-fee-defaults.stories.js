import React from 'react';
import { Provider } from 'react-redux';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { AdvancedGasFeePopoverContextProvider } from '../context';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import { GasEstimateTypes } from '../../../../../../shared/constants/gas';
import { getSelectedInternalAccountFromMockState } from '../../../../../../test/jest/mocks';
import AdvancedGasFeeDefaults from './advanced-gas-fee-defaults';

const mockInternalAccount = getSelectedInternalAccountFromMockState(mockState);

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    accounts: {
      [mockInternalAccount.address]: {
        address: mockInternalAccount.address,
        balance: '0x1F4',
      },
    },
    featureFlags: { advancedInlineGas: true },
    gasFeeEstimates: mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
  },
});

export default {
  title:
    'Confirmations/Components/AdvancedGasFeePopover/AdvancedGasFeeDefaults',
  decorators: [
    (story) => (
      <Provider store={store}>
        <GasFeeContextProvider
          transaction={{
            userFeeLevel: 'medium',
          }}
        >
          <AdvancedGasFeePopoverContextProvider>
            {story()}
          </AdvancedGasFeePopoverContextProvider>
        </GasFeeContextProvider>
      </Provider>
    ),
  ],
};

export const DefaultStory = () => <AdvancedGasFeeDefaults />;

DefaultStory.storyName = 'Default';
