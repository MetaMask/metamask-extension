import React from 'react';
import { Provider } from 'react-redux';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import { TransactionModalContext } from '../../../../contexts/transaction-modal';
import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import { decGWEIToHexWEI } from '../../../../../shared/modules/conversion.utils';
import EditGasFeePopover from './edit-gas-fee-popover';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    featureFlags: {
      ...mockState.metamask.featureFlags,
      advancedInlineGas: true,
    },
  },
});

// Custom TransactionModalContextProvider that sets editGasFee as current modal
const MockTransactionModalProvider = ({ children }) => {
  return (
    <TransactionModalContext.Provider
      value={{
        closeModal: () => {},
        closeAllModals: () => {},
        currentModal: 'editGasFee',
        openModal: () => {},
        openModalCount: 1,
      }}
    >
      {children}
    </TransactionModalContext.Provider>
  );
};

const createTransaction = (editGasMode = EditGasModes.modifyInPlace) => ({
  userFeeLevel: PriorityLevels.medium,
  txParams: {
    maxFeePerGas: decGWEIToHexWEI('70'),
    maxPriorityFeePerGas: decGWEIToHexWEI('7'),
    gas: '0x5208',
    gasPrice: decGWEIToHexWEI('50'),
    type: '0x2',
    from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
  },
  chainId: '0x5', // Use Goerli from mock state
  editGasMode,
});

export default {
  title: 'Pages/Confirmations/Components/EditGasFeePopover',
  component: EditGasFeePopover,
  decorators: [
    (Story, { args }) => (
      <Provider store={store}>
        <MockTransactionModalProvider>
          <GasFeeContextProvider
            transaction={createTransaction(args.editGasMode)}
            editGasMode={args.editGasMode}
            balanceError={args.balanceError}
          >
            <div style={{ width: '400px', height: '600px' }}>
              <Story />
            </div>
          </GasFeeContextProvider>
        </MockTransactionModalProvider>
      </Provider>
    ),
  ],
};

export const Default = {
  args: {
    editGasMode: EditGasModes.modifyInPlace,
    balanceError: false,
  },
};
