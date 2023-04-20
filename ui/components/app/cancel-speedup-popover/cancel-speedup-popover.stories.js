import React from 'react';
import { Provider } from 'react-redux';
import BigNumber from 'bignumber.js';
import configureStore from '../../../store/store';
import { TransactionModalContext } from '../../../contexts/transaction-modal';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../shared/constants/gas';
import { decGWEIToHexWEI } from '../../../../shared/modules/conversion.utils';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import CancelSpeedupPopover from './cancel-speedup-popover';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
    accounts: {
      [mockState.metamask.selectedAddress]: {
        address: mockState.metamask.selectedAddress,
        balance: '0x1F4',
      },
    },
    gasFeeEstimates: mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
  },
});

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI =
  mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates.medium
    .suggestedMaxFeePerGas;

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI = new BigNumber(
  decGWEIToHexWEI(MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI),
  16,
);

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI =
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.toString(16);

export default {
  title: 'Components/App/CancelSpeedupPopover',
  component: CancelSpeedupPopover,
  decorators: [
    (story) => (
      <Provider store={store}>
        <GasFeeContextProvider
          transaction={{
            userFeeLevel: 'tenPercentIncreased',
            txParams: {
              gas: '0x5208',
              maxFeePerGas: MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI,
              maxPriorityFeePerGas: '0x59682f00',
            },
          }}
          editGasMode={EditGasModes.cancel}
        >
          <TransactionModalContext.Provider
            value={{
              closeModal: () => undefined,
              currentModal: 'cancelSpeedUpTransaction',
            }}
          >
            {story()}
          </TransactionModalContext.Provider>
        </GasFeeContextProvider>
      </Provider>
    ),
  ],
};

export const DefaultStory = (args) => {
  return (
    <div style={{ width: '600px' }}>
      <CancelSpeedupPopover {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
