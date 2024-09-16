import { BtcAccountType, InternalAccount } from '@metamask/keyring-api';
import { toHex } from '@metamask/controller-utils';
import {
  AnyAction,
  configureStore,
  createListenerMiddleware,
} from '@reduxjs/toolkit';
import {
  createMockInternalAccount,
  INITIAL_MULTICHAIN_SEND_STATE_FOR_EXISTING_DRAFT,
} from '../../../test/jest/mocks';
import messages from '../../../app/_locales/en/messages.json';
import mockMultichainSendStateWithoutDraft from '../../../test/data/mock-multichain-send-state-with-empty-draft.json';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { SEND_STAGES } from '../send';
import {
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_FUNDS_FOR_GAS_ERROR,
  NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR,
} from '../../pages/confirmations/send/send.constants';
import { AssetType } from '../../../shared/constants/transaction';
import { MultichainNativeAssets } from '../../../shared/constants/multichain/assets';
import rootReducer from '..';
import { CombinedBackgroundAndReduxState } from '../../store/store';
import multichainSendReducer, {
  multichainSendSlice,
  initializeSendState,
  estimateFee,
  updateAndValidateRecipient,
  setMaxSendAssetAmount,
  signAndSend,
  addNewDraft,
  clearDraft,
  updateSendAmount,
  updateStage,
  validateAmountField,
  initialMultichainSendState,
  SendStage,
  FeeLevel,
  MultichainSendState,
  validateChecks,
} from './multichain-send';
import { MockTransactionBuilder } from './transaction-builders/__mocks__/mock-transaction-builder';

const mockBtcAccount = createMockInternalAccount({
  name: 'Btc Account',
  address: 'bc1qa4muxuheal3suc3hyn9d8k45urqsc4tj2n7c6x',
  type: BtcAccountType.P2wpkh,
});
const network = MultichainNetworks.BITCOIN;

const stateWithBTCDraft: MultichainSendState & {
  currentTransactionUUID: string;
} = {
  ...INITIAL_MULTICHAIN_SEND_STATE_FOR_EXISTING_DRAFT,
  currentTransactionUUID: 'test-uuid',
  draftTransactions: {
    'test-uuid': {
      id: 'test-uuid',
      transactionParams: {
        sender: {
          id: mockBtcAccount.id,
          address: mockBtcAccount.address,
        },
        sendAsset: {
          amount: '2000000',
          assetDetails: {
            type: AssetType.native,
            // TODO: fix and add image t onative asset
            // @ts-expect-error btc image is not in the NativeAsset type
            image: './images/bitcoin.svg',
            symbol: 'BTC',
            balance: '10000000',
            details: {
              decimals: 8,
            },
          },
          asset: MultichainNativeAssets.BITCOIN,
          denominatinon: 'sat',
          valid: true,
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
          address: 'bc1qa4muxuheal3suc3hyn9d8k45urqsc4tj2n7c6x',
          valid: true,
          error: '',
        },
        fee: {
          valid: true,
          error: '',
          isLoading: true,
          fee: '123123',
          unit: 'sat',
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
    },
  },
};

const createCombinedStateWithUser = (
  multichainSendState: MultichainSendState,
  account?: InternalAccount,
): Partial<CombinedBackgroundAndReduxState> => {
  return {
    ...mockMultichainSendStateWithoutDraft,
    metamask: {
      ...mockMultichainSendStateWithoutDraft.metamask,
      internalAccounts: {
        ...mockMultichainSendStateWithoutDraft.metamask.internalAccounts,
        // @ts-expect-error account type as string is not compatible with enum
        accounts: {
          ...mockMultichainSendStateWithoutDraft.metamask.internalAccounts
            .accounts,
          // conditionally add account here if its defined
          ...(account ? { [account.id]: account } : {}),
        },
        selectedAccount: account
          ? account.id
          : mockMultichainSendStateWithoutDraft.metamask.internalAccounts
              .selectedAccount,
      },
    },
    multichainSend: multichainSendState,
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

jest.mock('./transaction-builders/transaction-builder.ts', () => {
  return {
    TransactionBuilderFactory: {
      getBuilder: jest.fn(() => {
        // @ts-expect-error mock doesn't need the constructor args
        return new MockTransactionBuilder();
      }),
    },
  };
});

describe('multichainSend slice', () => {
  describe('Reducers', () => {
    describe('addNewDraft', () => {
      it('should add a new draft transaction', () => {
        const action = {
          type: addNewDraft.type,
          payload: { account: mockBtcAccount, network },
        };

        const result = multichainSendReducer(
          initialMultichainSendState,
          action,
        );

        expect(result.currentTransactionUUID).toBeDefined();
        const uuid = result.currentTransactionUUID;
        const draft = result.draftTransactions[uuid as string];
        expect(draft.id).toStrictEqual(uuid);
      });
    });

    describe('clearDraft', () => {
      it('clears the draft transaction', () => {
        const action = {
          type: clearDraft.type,
        };

        const result = multichainSendReducer(
          INITIAL_MULTICHAIN_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.currentTransactionUUID).toBeUndefined();
        expect(result.draftTransactions).toEqual({});
        expect(result.stage).toBe(SEND_STAGES.DRAFT);
      });
    });

    describe('updateSendAmount', () => {
      it('updates the send amount', () => {
        const amount = '50000000';
        const amountInHex = toHex(amount);

        const action = {
          type: updateSendAmount.type,
          payload: amountInHex,
        };

        const result = multichainSendReducer(stateWithBTCDraft, action);

        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .amount,
        ).toBe(amount);
      });

      it("will not update the send amount if there isn't a draft transaction", () => {
        const action = {
          type: updateSendAmount.type,
          payload: '50000000',
        };

        const result = multichainSendReducer(
          initialMultichainSendState,
          action,
        );

        expect(result).toEqual(initialMultichainSendState);
      });

      it('will run validation checks after updating the send amount', () => {
        const spyValidateChecks = jest.spyOn(
          multichainSendSlice.caseReducers,
          'validateChecks',
        );
        const spyValidateSendAmount = jest.spyOn(
          multichainSendSlice.caseReducers,
          'validateAmountField',
        );

        const amount = '50000000';
        const amountInHex = toHex(amount);

        const action = {
          type: updateSendAmount.type,
          payload: amountInHex,
        };

        multichainSendReducer(stateWithBTCDraft, action);
        expect(spyValidateChecks).toHaveBeenCalled();
        expect(spyValidateSendAmount).toHaveBeenCalled();
      });
    });

    describe('validateAmountField', () => {
      it("will not update the send amount if there isn't a draft transaction", () => {
        const action = {
          type: validateAmountField.type,
        };

        const result = multichainSendReducer(
          initialMultichainSendState,
          action,
        );

        expect(result).toEqual(initialMultichainSendState);
      });

      it(`will throw ${NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR} if the amount is less than or equal to 0`, () => {
        const action = {
          type: validateAmountField.type,
        };

        const stateWithZeroAmount = {
          ...stateWithBTCDraft,
          draftTransactions: {
            'test-uuid': {
              ...stateWithBTCDraft.draftTransactions['test-uuid'],
              transactionParams: {
                ...stateWithBTCDraft.draftTransactions['test-uuid']
                  .transactionParams,
                sendAsset: {
                  ...stateWithBTCDraft.draftTransactions['test-uuid']
                    .transactionParams.sendAsset,
                  amount: '0',
                },
              },
            },
          },
        };

        const result = multichainSendReducer(stateWithZeroAmount, action);

        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .error,
        ).toEqual(NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR);
        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .valid,
        ).toEqual(false);
      });

      it(`will throw ${NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR} if the amount is empty`, () => {
        const action = {
          type: validateAmountField.type,
        };

        const stateWithZeroAmount = {
          ...stateWithBTCDraft,
          draftTransactions: {
            'test-uuid': {
              ...stateWithBTCDraft.draftTransactions['test-uuid'],
              transactionParams: {
                ...stateWithBTCDraft.draftTransactions['test-uuid']
                  .transactionParams,
                sendAsset: {
                  ...stateWithBTCDraft.draftTransactions['test-uuid']
                    .transactionParams.sendAsset,
                  amount: '',
                },
              },
            },
          },
        };

        const result = multichainSendReducer(stateWithZeroAmount, action);

        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .error,
        ).toEqual(NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR);
        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .valid,
        ).toEqual(false);
      });
      it(`will throw ${INSUFFICIENT_FUNDS_ERROR} if the amount is less than the balance`, () => {
        const action = {
          type: validateAmountField.type,
        };

        const stateWithInsufficientAmount = {
          ...stateWithBTCDraft,
          draftTransactions: {
            'test-uuid': {
              ...stateWithBTCDraft.draftTransactions['test-uuid'],
              transactionParams: {
                ...stateWithBTCDraft.draftTransactions['test-uuid']
                  .transactionParams,
                sendAsset: {
                  ...stateWithBTCDraft.draftTransactions['test-uuid']
                    .transactionParams.sendAsset,
                  amount: '1000000000000000000',
                },
              },
            },
          },
        };

        const result = multichainSendReducer(
          stateWithInsufficientAmount,
          action,
        );

        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .error,
        ).toEqual(INSUFFICIENT_FUNDS_ERROR);
        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .valid,
        ).toEqual(false);
      });
      it(`will throw ${INSUFFICIENT_FUNDS_FOR_GAS_ERROR} if the amount and gas is less than the balance`, () => {
        const action = {
          type: validateAmountField.type,
        };

        const stateWithHighGas = {
          ...stateWithBTCDraft,
          draftTransactions: {
            'test-uuid': {
              ...stateWithBTCDraft.draftTransactions['test-uuid'],
              transactionParams: {
                ...stateWithBTCDraft.draftTransactions['test-uuid']
                  .transactionParams,
                fee: {
                  ...stateWithBTCDraft.draftTransactions['test-uuid']
                    .transactionParams.fee,
                  fee: '1000000000000000000',
                },
              },
            },
          },
        };

        const result = multichainSendReducer(stateWithHighGas, action);

        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .error,
        ).toEqual(INSUFFICIENT_FUNDS_FOR_GAS_ERROR);
        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .valid,
        ).toEqual(false);
      });

      it('will return a valid status if the balance is more than the amount with gas', () => {
        const action = {
          type: validateAmountField.type,
        };

        const stateWithInvalidState = {
          ...stateWithBTCDraft,
          draftTransactions: {
            'test-uuid': {
              ...stateWithBTCDraft.draftTransactions['test-uuid'],
              transactionParams: {
                ...stateWithBTCDraft.draftTransactions['test-uuid']
                  .transactionParams,
                sendAsset: {
                  ...stateWithBTCDraft.draftTransactions['test-uuid']
                    .transactionParams.sendAsset,
                  valid: false,
                },
              },
            },
          },
        };

        const result = multichainSendReducer(stateWithInvalidState, action);
        expect(
          result.draftTransactions['test-uuid'].transactionParams.sendAsset
            .valid,
        ).toEqual(true);
      });
    });
    describe('validateChecks', () => {
      // @ts-expect-error This is missing from the Mocha type definitions
      it.each([
        // create test cases here, i want all possible combinations
        {
          sendAssetValidity: true,
          recipientValidity: true,
          feeValidity: false,
          transactionValidity: false,
        },
        {
          sendAssetValidity: true,
          recipientValidity: false,
          feeValidity: true,
          transactionValidity: false,
        },
        {
          sendAssetValidity: false,
          recipientValidity: true,
          feeValidity: true,
          transactionValidity: false,
        },
        {
          sendAssetValidity: false,
          recipientValidity: false,
          feeValidity: true,
          transactionValidity: false,
        },
        {
          sendAssetValidity: false,
          recipientValidity: true,
          feeValidity: false,
          transactionValidity: false,
        },
        {
          sendAssetValidity: false,
          recipientValidity: false,
          feeValidity: false,
          transactionValidity: false,
        },
        {
          sendAssetValidity: true,
          recipientValidity: false,
          feeValidity: false,
          transactionValidity: false,
        },
        {
          sendAssetValidity: true,
          recipientValidity: true,
          feeValidity: true,
          transactionValidity: true,
        },
      ])(
        'if sendAsset is $sendAssetValidity, recipient is $recipientValidity, and fee is $feeValidity, then the transaction is $transactionValidity',
        ({
          sendAssetValidity,
          recipientValidity,
          feeValidity,
          transactionValidity,
        }: {
          sendAssetValidity: boolean;
          recipientValidity: boolean;
          feeValidity: boolean;
          transactionValidity: boolean;
        }) => {
          const mockState = {
            ...stateWithBTCDraft,
            draftTransactions: {
              'test-uuid': {
                ...stateWithBTCDraft.draftTransactions['test-uuid'],
                transactionParams: {
                  ...stateWithBTCDraft.draftTransactions['test-uuid']
                    .transactionParams,
                  sendAsset: {
                    ...stateWithBTCDraft.draftTransactions['test-uuid']
                      .transactionParams.sendAsset,
                    valid: sendAssetValidity,
                  },
                  recipient: {
                    ...stateWithBTCDraft.draftTransactions['test-uuid']
                      .transactionParams.recipient,
                    valid: recipientValidity,
                  },
                  fee: {
                    ...stateWithBTCDraft.draftTransactions['test-uuid']
                      .transactionParams.fee,
                    valid: feeValidity,
                  },
                },
              },
            },
          };

          const action = {
            type: validateChecks.type,
          };

          const result = multichainSendReducer(mockState, action);

          expect(result.draftTransactions['test-uuid'].valid).toBe(
            transactionValidity,
          );
        },
      );
    });

    describe('updateStage', () => {
      // @ts-expect-error This is missing from the Mocha type definitions
      it.each([
        { stage: SendStage.DRAFT },
        { stage: SendStage.PUBLISHING },
        { stage: SendStage.PUBLISHED },
      ])('updates the stage to $stage', ({ stage }: { stage: SendStage }) => {
        const action = {
          type: updateStage.type,
          payload: { stage },
        };

        const result = multichainSendReducer(
          INITIAL_MULTICHAIN_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.stage).toBe(stage);
      });
    });
  });

  describe('Extra Reducers', () => {
    describe('initializeSendState', () => {
      it('should dispatch async action thunk first with pending, then finally fulfilling from minimal state', async () => {
        const { actions, store } = createRealStore(
          mockMultichainSendStateWithoutDraft,
        );

        await store.dispatch(
          initializeSendState({
            account: mockBtcAccount,
            network: MultichainNetworks.BITCOIN,
          }),
        );

        expect(actions[0].type).toStrictEqual(
          'multichainSend/initializeSendState/pending',
        );
        expect(actions[1].type).toStrictEqual('multichainSend/addNewDraft');
        expect(actions[2].type).toStrictEqual(
          'multichainSend/initializeSendState/fulfilled',
        );
      });
    });
    describe('estimateFee', () => {
      it('updates the loading status of the fee', async () => {
        // @ts-expect-error we don't need to provide args for mock builder
        const expectedFee = await new MockTransactionBuilder().estimateGas();

        const { store, actions } = createRealStore(
          createCombinedStateWithUser(stateWithBTCDraft, mockBtcAccount),
        );

        await store.dispatch(
          estimateFee({
            account: mockBtcAccount,
            transactionId: stateWithBTCDraft.currentTransactionUUID,
          }),
        );

        const newState = store.getState();

        expect(actions[0]).toStrictEqual({
          type: 'multichainSend/estimateFee/pending',
          payload: undefined,
          meta: expect.any(Object),
        });
        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/estimateFee/fulfilled',
          payload: expectedFee,
          meta: expect.any(Object),
        });
        expect(
          newState.multichainSend.draftTransactions[
            stateWithBTCDraft.currentTransactionUUID
          ].transactionParams.fee,
        ).toEqual(expectedFee);
      });
    });

    describe('updateAndValidateRecipient', () => {
      const mockRecipient = 'bc1qa4muxuheal3suc3hyn9d8k45urqsc4tj2n7c6x';
      it('updates the recipient address', async () => {
        const { store, actions } = createRealStore(
          createCombinedStateWithUser(stateWithBTCDraft, mockBtcAccount),
        );

        await store.dispatch(
          updateAndValidateRecipient({
            transactionId: stateWithBTCDraft.currentTransactionUUID,
            recipient: mockRecipient,
          }),
        );

        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/updateAndValidateRecipient/fulfilled',
          payload: {
            address: mockRecipient,
            valid: true,
            error: '',
          },
          meta: expect.any(Object),
        });
      });

      it('rejects if the address is invalid', async () => {
        const { store, actions } = createRealStore(
          createCombinedStateWithUser(stateWithBTCDraft, mockBtcAccount),
        );

        await store.dispatch(
          updateAndValidateRecipient({
            transactionId: stateWithBTCDraft.currentTransactionUUID,
            recipient: 'mock', // invalid address
          }),
        );

        const updatedState = store.getState();

        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/updateAndValidateRecipient/rejected',
          payload: undefined,
          error: expect.any(Object),
          meta: expect.any(Object),
        });

        // The state should be the same
        expect(
          updatedState.multichainSend.draftTransactions[
            stateWithBTCDraft.currentTransactionUUID
          ].transactionParams.recipient,
        ).toEqual(
          stateWithBTCDraft.draftTransactions['test-uuid'].transactionParams
            .recipient,
        );
      });
    });

    describe('setMaxSendAssetAmount', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });
      it('sets max send asset amount', async () => {
        const expectedAmount = '333333';
        const { store, actions } = createRealStore(
          createCombinedStateWithUser(stateWithBTCDraft, mockBtcAccount),
        );

        await store.dispatch(
          setMaxSendAssetAmount({
            transactionId: stateWithBTCDraft.currentTransactionUUID,
          }),
        );

        const updatedState = store.getState();

        expect(actions[0]).toStrictEqual({
          type: 'multichainSend/setMaxSendAssetAmount/pending',
          meta: expect.any(Object),
          payload: undefined,
        });
        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/setMaxSendAssetAmount/fulfilled',
          payload: expectedAmount,
          meta: expect.any(Object),
        });
        expect(
          updatedState.multichainSend.draftTransactions[
            stateWithBTCDraft.currentTransactionUUID
          ].transactionParams.sendAsset.amount,
        ).toStrictEqual(expectedAmount);
      });

      it('rejects if there is an error while setting max amount', async () => {
        jest
          .spyOn(MockTransactionBuilder.prototype, 'setMaxSendAmount')
          .mockRejectedValue(undefined);
        const { store, actions } = createRealStore(
          createCombinedStateWithUser(stateWithBTCDraft, mockBtcAccount),
        );

        await store.dispatch(
          setMaxSendAssetAmount({
            transactionId: stateWithBTCDraft.currentTransactionUUID,
          }),
        );

        const updatedState = store.getState();

        expect(actions[0]).toStrictEqual({
          type: 'multichainSend/setMaxSendAssetAmount/pending',
          meta: expect.any(Object),
          payload: undefined,
        });
        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/setMaxSendAssetAmount/rejected',
          payload: undefined,
          meta: expect.any(Object),
          error: expect.any(Object),
        });

        expect(
          updatedState.multichainSend.draftTransactions[
            stateWithBTCDraft.currentTransactionUUID
          ].transactionParams.sendAsset.error,
        ).toBe(messages.setMaxAmountError.message);

        expect(
          updatedState.multichainSend.draftTransactions[
            stateWithBTCDraft.currentTransactionUUID
          ].transactionParams.sendAsset.valid,
        ).toBe(false);
      });
    });

    describe('signAndSend', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });
      it('calls sendTranasaction to the builder', async () => {
        const mockTxHash = 'mock-tx-hash';
        const sendSpy = jest
          .spyOn(MockTransactionBuilder.prototype, 'sendTransaction')
          .mockResolvedValue(mockTxHash);
        const { store, actions } = createRealStore(
          createCombinedStateWithUser(stateWithBTCDraft, mockBtcAccount),
        );

        await store.dispatch(
          signAndSend({
            account: mockBtcAccount,
            transactionId: stateWithBTCDraft.currentTransactionUUID,
          }),
        );

        const updatedState = store.getState();

        expect(actions[0]).toStrictEqual({
          type: 'multichainSend/signAndSend/pending',
          meta: expect.any(Object),
          payload: undefined,
        });
        expect(actions[1]).toStrictEqual({
          type: 'multichainSend/signAndSend/fulfilled',
          meta: expect.any(Object),
          payload: mockTxHash,
        });
        expect(sendSpy).toHaveBeenCalled();
        expect(updatedState.multichainSend.stage).toBe(SEND_STAGES.DRAFT);
        expect(
          updatedState.multichainSend.currentTransactionUUID,
        ).toBeUndefined();
        expect(updatedState.multichainSend.draftTransactions).toEqual({});
      });

      it('displays error if there is an error signing', async () => {});

      it('displays error if there is an error propagating the tranaction', async () => {});
    });
  });
});
