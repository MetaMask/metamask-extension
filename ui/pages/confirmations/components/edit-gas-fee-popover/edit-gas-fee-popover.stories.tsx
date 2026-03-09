import React, { ComponentType } from 'react';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import { TransactionModalContext } from '../../../../contexts/transaction-modal';
import { ConfirmContextProvider } from '../../context/confirm';
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

type MockTransactionModalProviderProps = {
  children: React.ReactNode;
};

const MockTransactionModalProvider: React.FC<
  MockTransactionModalProviderProps
> = ({ children }) => {
  return (
    <TransactionModalContext.Provider
      value={{
        closeModal: () => undefined,
        closeAllModals: () => undefined,
        currentModal: 'editGasFee',
        openModal: () => undefined,
        openModalCount: 1,
      }}
    >
      {children}
    </TransactionModalContext.Provider>
  );
};

const createTransaction = (editGasMode = EditGasModes.modifyInPlace) =>
  ({
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
  }) as unknown as TransactionMeta;

interface StoryArgs {
  editGasMode: EditGasModes;
  transaction: TransactionMeta;
}

const mockCurrentConfirmation = {
  networkClientId: 'mainnet',
} as React.ComponentProps<typeof ConfirmContextProvider>['currentConfirmationOverride'];

const defaultEditGasMode = EditGasModes.modifyInPlace;
const defaultTransaction = createTransaction(defaultEditGasMode);

const meta: Meta<StoryArgs> = {
  title: 'Pages/Confirmations/Components/EditGasFeePopover',
  component: EditGasFeePopover as unknown as ComponentType<StoryArgs>,
  decorators: [
    (Story, context) => {
      const editGasMode =
        context.args?.editGasMode ?? defaultEditGasMode;
      const transaction =
        context.args?.transaction ?? defaultTransaction;
      return (
        <Provider store={store}>
          <ConfirmContextProvider
            currentConfirmationOverride={mockCurrentConfirmation}
          >
            <MockTransactionModalProvider>
              <GasFeeContextProvider
                transaction={transaction}
                editGasMode={editGasMode}
              >
                <Story />
              </GasFeeContextProvider>
            </MockTransactionModalProvider>
          </ConfirmContextProvider>
        </Provider>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  args: {
    editGasMode: defaultEditGasMode,
    transaction: defaultTransaction,
  },
  render: (args) => <EditGasFeePopover {...args} />,
};
