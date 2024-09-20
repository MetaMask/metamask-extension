import React from 'react';
import { act, RenderResult } from '@testing-library/react';
import { InternalAccount } from '@metamask/keyring-api';
import { createListenerMiddleware, configureStore } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import {
  renderWithProvider,
  waitFor,
  fireEvent,
} from '../../../../../test/jest';
import mockMultichainSendState from '../../../../../test/data/mock-multichain-send-state-with-empty-draft.json';
import messages from '../../../../../app/_locales/en/messages.json';
import { getSelectedInternalAccount } from '../../../../selectors';
import {
  addNewDraft,
  editTransaction,
  FeeLevel,
  initialMultichainSendState,
  SendStage,
  updateSendAmount,
  updateStage,
} from '../../../../ducks/multichain-send/multichain-send';
import { getMultichainProviderConfig } from '../../../../selectors/multichain';
import rootReducer from '../../../../ducks';
import { CombinedBackgroundAndReduxState } from '../../../../store/store';
import { MockTransactionBuilder } from '../../../../ducks/multichain-send/transaction-builders/__mocks__/mock-transaction-builder';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import { AssetType } from '../../../../../shared/constants/transaction';
import { shortenAddress } from '../../../../helpers/utils/util';
import {
  DEFAULT_ROUTE,
  MULTICHAIN_CONFIRM_TRANSACTION_ROUTE,
} from '../../../../helpers/constants/routes';
import { MultichainSendPage } from './multichain-send';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ search: '' })),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock(
  '../../../../ducks/multichain-send/transaction-builders/transaction-builder.ts',
  () => {
    return {
      TransactionBuilderFactory: {
        getBuilder: jest.fn(() => {
          // @ts-expect-error mock doesn't need the constructor args
          return new MockTransactionBuilder();
        }),
      },
    };
  },
);

const mockTransactionId = 'test-id';

const baseStore = {
  ...mockMultichainSendState,
  metamask: {
    ...mockMultichainSendState.metamask,
    rates: {
      btc: {
        conversionDate: 1620710825.03,
        conversionRate: 56594.07,
        usdConversionRate: 56594.07,
      },
    },
    permissionHistory: {},
    pinnedAccountList: [],
    hiddenAccountList: [],
    balances: {
      'a39f7dd5-04f8-48a0-9359-6780d8fe397a': {
        'bip122:000000000933ea01ad0ee984209779ba/slip44:0': {
          amount: '0.00108995',
          unit: 'BTC',
        },
      },
    },
  },
};

const baseStoreWithDraft = {
  ...mockMultichainSendState,
  metamask: {
    ...mockMultichainSendState.metamask,
    rates: {
      btc: {
        conversionDate: 1620710825.03,
        conversionRate: 56594.07,
        usdConversionRate: 56594.07,
      },
    },
  },
  multichainSend: {
    stage: SendStage.DRAFT,
    draftTransactions: {
      [mockTransactionId]: {
        id: mockTransactionId,
        transactionParams: {
          sender: {
            id: '',
            address: '',
          },
          sendAsset: {
            amount: '0',
            assetDetails: {
              type: AssetType.native,
              image: './images/placeholder.svg',
              symbol: '',
              balance: '0',
              details: {
                decimals: 8,
              },
            },
            asset: '',
            denominatinon: undefined,
            valid: false,
            error: '',
          },
          receiveAsset: {
            amount: '0',
            asset: '',
            denominatinon: undefined,
            valid: false,
            error: '',
          },
          recipient: {
            address: '',
            valid: false,
            error: '',
          },
          fee: {
            valid: false,
            error: '',
            isLoading: true,
            fee: '0',
            unit: '',
            confirmationTime: '',
            feeInFiat: '',
            feeLevel: FeeLevel.Average,
          },
          data: {},
          network: {
            network: MultichainNetworks.BITCOIN,
            error: '',
          },
        },
        transaction: null,
        valid: false,
        error: '',
      },
    },
    currentTransactionUUID: mockTransactionId,
    error: '',
  },
};

const createCombinedStateWithUser = (
  multichainSendState: CombinedBackgroundAndReduxState,
  account?: InternalAccount,
): Partial<CombinedBackgroundAndReduxState> => {
  return {
    ...multichainSendState,
    metamask: {
      ...multichainSendState.metamask,
      internalAccounts: {
        ...multichainSendState.metamask.internalAccounts,
        accounts: {
          ...multichainSendState.metamask.internalAccounts.accounts,
          // conditionally add account here if its defined
          ...(account ? { [account.id]: account } : {}),
        },
        selectedAccount: account
          ? account.id
          : multichainSendState.metamask.internalAccounts.selectedAccount,
      },
    },
    multichainSend: multichainSendState.multichainSend,
  };
};

// This is only used to test async actions that has side effects
// This store only contains the multichainSend slice
// TODO: fix combined reducer state type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createRealStore = (state: any) => {
  const actions: AnyAction[] = [];
  const listenerMiddleware = createListenerMiddleware();

  listenerMiddleware.startListening({
    predicate: () => true, // Listen to all actions
    effect: (action) => {
      actions.push(action);
    },
  });
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    preloadedState: state,
  });

  return {
    actions,
    store,
  };
};

// TODO: fix any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const render = async (state: any, account?: InternalAccount) => {
  const { store, actions } = createRealStore(
    createCombinedStateWithUser(state, account),
  );

  let result;

  await act(
    // @ts-expect-error TODO: fix type error
    async () => (result = renderWithProvider(<MultichainSendPage />, store)),
  );

  return { store, result: result as unknown as RenderResult, actions };
};

describe('MultichainSendPage', () => {
  it('renders correctly', async () => {
    const {
      result: { getByText, container },
    } = await render(baseStore);

    expect(getByText('Send')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('creates a new draft transaction if one does not exist', async () => {
    const mockStoreWithNoDrafts = {
      ...baseStore,
      multichainSend: {
        ...initialMultichainSendState,
      },
    };

    const { actions } = await render(mockStoreWithNoDrafts);
    const selectedAccount = getSelectedInternalAccount(mockStoreWithNoDrafts);
    // TODO: fix type error
    // @ts-expect-error selector type should be the same a combined reducer state
    const network = getMultichainProviderConfig(mockStoreWithNoDrafts).chainId;
    expect(actions[1]).toStrictEqual({
      type: addNewDraft.type,
      payload: {
        account: selectedAccount,
        network,
      },
    });
  });

  describe('Account selector', () => {
    it('only shows non EVM account', async () => {
      const {
        result: { getByTestId, getAllByTestId },
      } = await render(baseStore);

      const accountSelector = getByTestId('send-page-account-picker');

      fireEvent.click(accountSelector);

      expect(getAllByTestId('account-list-item-menu-button')).toHaveLength(1);
    });
  });

  describe('Recipient input', () => {
    const mockRecipient =
      'bc1qwzrryqr3ja8w7hnja2spmkgfdcgvqwp5swz4af4ngsjecfz0w0pqud7k38';
    const mockInvalidRecipient = 'mock';
    const selectedAccount = getSelectedInternalAccount(baseStore);
    // TODO: fix type error
    // @ts-expect-error selector type should be the same a combined reducer state
    const network = getMultichainProviderConfig(baseStore).chainId;

    it("should update the recipient's address", async () => {
      const {
        actions,
        result: { getByTestId },
      } = await render(baseStore);

      const input = getByTestId('multichain-send-recipient-input');

      fireEvent.change(input, { target: { value: mockRecipient } });

      await waitFor(() => {
        expect(actions[1]).toStrictEqual({
          type: addNewDraft.type,
          payload: {
            account: selectedAccount,
            network,
          },
        });
      });
    });

    it("should clear the recipient's address", async () => {
      const {
        actions,
        result: { getByTestId, getByLabelText },
      } = await render(baseStoreWithDraft);

      const input = getByTestId('multichain-send-recipient-input');

      fireEvent.change(input, { target: { value: mockRecipient } });

      await waitFor(() => {
        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/updateAndValidateRecipient/fulfilled',
          meta: expect.any(Object),
          payload: {
            address: mockRecipient,
            error: '',
            valid: true,
          },
        });
      });

      const recipient = getByTestId('multichain-recipient');
      expect(recipient).toHaveTextContent(shortenAddress(mockRecipient));

      const clearButton = getByLabelText('Close');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(actions[2]).toStrictEqual({
          type: editTransaction.type,
          payload: {
            recipient: { address: '', valid: false },
          },
        });
      });
    });

    it("shows an error message if the recipient's address is invalid", async () => {
      const {
        actions,
        result: { getByTestId },
      } = await render(baseStoreWithDraft);

      const input = getByTestId('multichain-send-recipient-input');

      fireEvent.change(input, { target: { value: mockInvalidRecipient } });

      await waitFor(() => {
        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/updateAndValidateRecipient/rejected',
          meta: expect.any(Object),
          payload: undefined,
          error: expect.any(Object),
        });
        const recipientError = getByTestId('multichain-recipient-error');
        expect(recipientError).toHaveTextContent(
          messages.invalidAddressRecipient.message,
        );
      });
    });
  });

  describe('Amount Input', () => {
    const mockAmount = 0.00123;
    const mockAmountInHex = '0x1e078';
    const mockInvalidAmount = 'invalid';
    const mockLargeAmount = 100;
    const mockLargeAmountInHex = '0x2540be400';
    const mockZeroAmount = 0;
    const mockZeroHexAmount = '0x0';

    it('updates the amount and estimates fees', async () => {
      const {
        actions,
        result: { getByTestId },
      } = await render(baseStoreWithDraft);
      const selectedAccount = getSelectedInternalAccount(baseStoreWithDraft);
      // @ts-expect-error this builder is mocked, therefore no need for constructor args
      const expectedFees = await new MockTransactionBuilder().estimateGas();

      const input = getByTestId('currency-input');

      fireEvent.change(input, { target: { value: mockAmount } });

      await waitFor(() => {
        expect(actions[0]).toStrictEqual({
          type: updateSendAmount.type,
          payload: mockAmountInHex, // the amount input converts the user input value to hex
        });

        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/estimateFee/pending',
          payload: undefined,
          meta: {
            arg: {
              account: selectedAccount,
              transactionId: mockTransactionId,
            },
            requestId: expect.any(String),
            requestStatus: 'pending',
          },
        });

        expect(actions[2]).toStrictEqual({
          type: 'multichainSend/estimateFee/fulfilled',
          meta: expect.any(Object),
          payload: expectedFees,
        });

        expect(getByTestId('currency-input')).toHaveValue(mockAmount);
        expect(getByTestId('multichain-confirmation-fee')).toHaveTextContent(
          expectedFees.fee,
        );
      });
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      {
        amount: mockLargeAmount,
        amountInHex: mockLargeAmountInHex,
        error: messages.insufficientFunds.message,
      },
      {
        amount: mockZeroAmount,
        amountInHex: mockZeroHexAmount,
        error: messages.negativeOrZeroAmountToken.message,
      },
    ])(
      `shows error '$error' for amount $amount`,
      async ({
        amount,
        amountInHex,
        error,
      }: {
        amount: number;
        amountInHex: string;
        error: string;
      }) => {
        const {
          actions,
          result: { getByTestId },
        } = await render(baseStoreWithDraft);

        const input = getByTestId('currency-input');

        fireEvent.change(input, { target: { value: amount } });

        await waitFor(() => {
          expect(actions[0]).toStrictEqual({
            type: updateSendAmount.type,
            payload: amountInHex, // the amount input converts the user input value to hex
          });
          expect(getByTestId('send-page-amount-error')).toHaveTextContent(
            error,
          );
        });
      },
    );

    it("shows an error message if the amount's value is invalid", async () => {
      const {
        actions,
        result: { getByTestId },
      } = await render(baseStoreWithDraft);

      const input = getByTestId('currency-input');

      fireEvent.change(input, { target: { value: mockInvalidAmount } });

      await waitFor(() => {
        expect(actions).toHaveLength(0);
      });
    });
  });

  describe('Footer buttons', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    describe('Cancel button', () => {
      it('clears the draft transaction on cancel', async () => {
        const {
          actions,
          result: { getByText },
        } = await render(baseStoreWithDraft);

        const cancelButton = getByText(messages.cancel.message);
        fireEvent.click(cancelButton);

        expect(actions[0]).toStrictEqual({
          type: 'multichainSend/clearDraft',
          payload: undefined,
        });

        expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
    });

    describe('Confirm button', () => {
      it('updates the stage to pending confirmation and redirects to the confirmation route', async () => {
        const {
          actions,
          result: { getByText },
        } = await render({
          ...baseStoreWithDraft,
          multichainSend: {
            ...baseStoreWithDraft.multichainSend,
            draftTransactions: {
              [baseStoreWithDraft.multichainSend.currentTransactionUUID]: {
                ...baseStoreWithDraft.multichainSend.draftTransactions[
                  baseStoreWithDraft.multichainSend
                    .currentTransactionUUID as keyof typeof baseStoreWithDraft.multichainSend.draftTransactions
                ],
                valid: true,
                transactionParams: {
                  ...baseStoreWithDraft.multichainSend.draftTransactions[
                    baseStoreWithDraft.multichainSend
                      .currentTransactionUUID as keyof typeof baseStoreWithDraft.multichainSend.draftTransactions
                  ].transactionParams,
                  recipient: {
                    address:
                      'bc1qwzrryqr3ja8w7hnja2spmkgfdcgvqwp5swz4af4ngsjecfz0w0pqud7k38',
                    valid: true,
                    error: '',
                  },
                  sendAsset: {
                    amount: '0.000123',
                    assetDetails: {
                      type: AssetType.native,
                      image: './images/placeholder.svg',
                      symbol: '',
                      balance: '0',
                      details: {
                        decimals: 8,
                      },
                    },
                    asset: '',
                    denominatinon: undefined,
                    valid: true,
                    error: '',
                  },
                  receiveAsset: {
                    amount: '0',
                    asset: '',
                    denominatinon: undefined,
                    valid: true,
                    error: '',
                  },
                  fee: {
                    valid: true,
                    error: '',
                    isLoading: false,
                    fee: '0.000123',
                    unit: 'BTC',
                    confirmationTime: '10 minutes',
                    feeInFiat: '0',
                    feeLevel: FeeLevel.Average,
                  },
                  data: {},
                  network: {
                    network: MultichainNetworks.BITCOIN,
                    error: '',
                  },
                },
              },
            },
          },
        });

        const reviewButton = getByText(messages.review.message);
        fireEvent.click(reviewButton);

        await waitFor(() => {
          expect(actions[0]).toStrictEqual({
            type: updateStage.type,
            payload: { stage: SendStage.PENDING_CONFIRMATION },
          });
          expect(mockHistoryPush).toHaveBeenCalledWith(
            `${MULTICHAIN_CONFIRM_TRANSACTION_ROUTE}/test-id`,
          );
        });
      });

      it('review is disabled if the transaction is invalid', async () => {
        const {
          result: { getByText },
        } = await render(baseStore);

        const reviewButton = getByText(messages.review.message);
        expect(reviewButton).toBeDisabled();
        expect(mockHistoryPush).not.toHaveBeenCalled();
      });
    });
  });
});
