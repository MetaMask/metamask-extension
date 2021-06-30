import sinon from 'sinon';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS_ERROR,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_WARNING,
  NEGATIVE_ETH_ERROR,
} from '../../pages/send/send.constants';
import { BASIC_ESTIMATE_STATES } from '../gas/gas.duck';
import { RINKEBY_CHAIN_ID } from '../../../shared/constants/network';
import { GAS_LIMITS } from '../../../shared/constants/gas';
import { TRANSACTION_TYPES } from '../../../shared/constants/transaction';
import sendReducer, {
  initialState,
  initializeSendState,
  updateSendAmount,
  updateSendAsset,
  updateRecipientUserInput,
  useContactListForRecipientSearch,
  useMyAccountsForRecipientSearch,
  updateRecipient,
  resetRecipientInput,
  updateSendHexData,
  toggleSendMaxMode,
  signTransaction,
  SEND_STATUSES,
  ASSET_TYPES,
  SEND_STAGES,
  AMOUNT_MODES,
  RECIPIENT_SEARCH_MODES,
  editTransaction,
} from './send';

const mockStore = createMockStore([thunk]);

jest.mock('../../store/actions', () => {
  const actual = jest.requireActual('../../store/actions');
  return {
    ...actual,
    estimateGas: jest.fn(() => Promise.resolve('0x0')),
    updateTokenType: jest.fn(() => Promise.resolve({ isERC721: false })),
  };
});

jest.mock('./send', () => {
  const actual = jest.requireActual('./send');
  return {
    __esModule: true,
    ...actual,
    getERC20Balance: jest.fn(() => '0x0'),
  };
});

describe('Send Slice', () => {
  describe('Reducers', () => {
    describe('updateSendAmount', () => {
      it('should', async () => {
        const action = { type: 'send/updateSendAmount', payload: '0x1' };
        const result = sendReducer(initialState, action);
        expect(result.amount.value).toStrictEqual('0x1');
      });
    });

    describe('updateAmountToMax', () => {
      it('should calculate the max amount based off of the asset balance and gas total then updates send amount value', () => {
        const maxAmountState = {
          amount: {
            value: '',
          },
          asset: {
            balance: '0x56bc75e2d63100000', // 100000000000000000000
          },
          gas: {
            gasLimit: '0x5208', // 21000
            gasTotal: '0x1319718a5000', // 21000000000000
            minimumGasLimit: '0x5208',
          },
        };

        const state = { ...initialState, ...maxAmountState };
        const action = { type: 'send/updateAmountToMax' };
        const result = sendReducer(state, action);

        expect(result.amount.value).toStrictEqual('0x56bc74b13f185b000'); // 99999979000000000000
      });
    });

    describe('updateUserInputHexData', () => {
      it('should', () => {
        const action = {
          type: 'send/updateUserInputHexData',
          payload: 'TestData',
        };
        const result = sendReducer(initialState, action);

        expect(result.draftTransaction.userInputHexData).toStrictEqual(
          action.payload,
        );
      });
    });

    describe('updateGasLimit', () => {
      const action = {
        type: 'send/updateGasLimit',
        payload: '0x5208', // 21000
      };

      it('should', () => {
        const result = sendReducer(
          {
            ...initialState,
            stage: SEND_STAGES.DRAFT,
            gas: { ...initialState.gas, isGasEstimateLoading: false },
          },
          action,
        );

        expect(result.gas.gasLimit).toStrictEqual(action.payload);
        expect(result.draftTransaction.txParams.gas).toStrictEqual(
          action.payload,
        );
      });

      it('should recalculate gasTotal', () => {
        const gasState = {
          ...initialState,
          gas: {
            gasLimit: '0x0',
            gasPrice: '0x3b9aca00', // 1000000000
          },
        };

        const result = sendReducer(gasState, action);

        expect(result.gas.gasLimit).toStrictEqual(action.payload);
        expect(result.gas.gasPrice).toStrictEqual(gasState.gas.gasPrice);
        expect(result.gas.gasTotal).toStrictEqual('0x1319718a5000'); // 21000000000000
      });
    });

    describe('updateGasPrice', () => {
      const action = {
        type: 'send/updateGasPrice',
        payload: '0x3b9aca00', // 1000000000
      };

      it('should update gas price and update draft transaction with validated state', () => {
        const validSendState = {
          ...initialState,
          stage: SEND_STAGES.DRAFT,
          account: {
            balance: '0x56bc75e2d63100000',
          },
          asset: {
            balance: '0x56bc75e2d63100000',
            type: ASSET_TYPES.NATIVE,
          },
          gas: {
            isGasEstimateLoading: false,
            gasTotal: '0x1319718a5000', // 21000000000000
            gasLimit: '0x5208', // 21000
            minimumGasLimit: '0x5208',
          },
        };

        const result = sendReducer(validSendState, action);

        expect(result.gas.gasPrice).toStrictEqual(action.payload);
        expect(result.draftTransaction.txParams.gasPrice).toStrictEqual(
          action.payload,
        );
      });

      it('should recalculate gasTotal', () => {
        const gasState = {
          gas: {
            gasLimit: '0x5208', // 21000,
            gasPrice: '0x0',
          },
        };

        const state = { ...initialState, ...gasState };
        const result = sendReducer(state, action);

        expect(result.gas.gasPrice).toStrictEqual(action.payload);
        expect(result.gas.gasLimit).toStrictEqual(gasState.gas.gasLimit);
        expect(result.gas.gasTotal).toStrictEqual('0x1319718a5000'); // 21000000000000
      });
    });

    describe('updateAmountMode', () => {
      it('should change to INPUT amount mode', () => {
        const emptyAmountModeState = {
          amount: {
            mode: '',
          },
        };

        const action = {
          type: 'send/updateAmountMode',
          payload: AMOUNT_MODES.INPUT,
        };
        const result = sendReducer(emptyAmountModeState, action);

        expect(result.amount.mode).toStrictEqual(action.payload);
      });

      it('should change to MAX amount mode', () => {
        const action = {
          type: 'send/updateAmountMode',
          payload: AMOUNT_MODES.MAX,
        };
        const result = sendReducer(initialState, action);

        expect(result.amount.mode).toStrictEqual(action.payload);
      });

      it('should', () => {
        const action = {
          type: 'send/updateAmountMode',
          payload: 'RANDOM',
        };
        const result = sendReducer(initialState, action);

        expect(result.amount.mode).not.toStrictEqual(action.payload);
      });
    });

    describe('updateAsset', () => {
      it('should update asset type and balance from respective action payload', () => {
        const updateAssetState = {
          ...initialState,
          asset: {
            type: 'old type',
            balance: 'old balance',
          },
        };

        const action = {
          type: 'send/updateAsset',
          payload: {
            type: 'new type',
            balance: 'new balance',
          },
        };

        const result = sendReducer(updateAssetState, action);

        expect(result.asset.type).toStrictEqual(action.payload.type);
        expect(result.asset.balance).toStrictEqual(action.payload.balance);
      });

      it('should nullify old contract address error when asset types is not TOKEN', () => {
        const recipientErrorState = {
          ...initialState,
          recipient: {
            error: CONTRACT_ADDRESS_ERROR,
          },
          asset: {
            type: ASSET_TYPES.TOKEN,
          },
        };

        const action = {
          type: 'send/updateAsset',
          payload: {
            type: 'New Type',
          },
        };

        const result = sendReducer(recipientErrorState, action);

        expect(result.recipient.error).not.toStrictEqual(
          recipientErrorState.recipient.error,
        );
        expect(result.recipient.error).toBeNull();
      });

      it('should nullify old known address error when asset types is not TOKEN', () => {
        const recipientErrorState = {
          ...initialState,
          recipient: {
            warning: KNOWN_RECIPIENT_ADDRESS_WARNING,
          },
          asset: {
            type: ASSET_TYPES.TOKEN,
          },
        };

        const action = {
          type: 'send/updateAsset',
          payload: {
            type: 'New Type',
          },
        };

        const result = sendReducer(recipientErrorState, action);

        expect(result.recipient.warning).not.toStrictEqual(
          recipientErrorState.recipient.warning,
        );
        expect(result.recipient.warning).toBeNull();
      });

      it('should update asset type and details to TOKEN payload', () => {
        const action = {
          type: 'send/updateAsset',
          payload: {
            type: ASSET_TYPES.TOKEN,
            details: {
              address: '0xTokenAddress',
              decimals: 0,
              symbol: 'TKN',
            },
          },
        };

        const result = sendReducer(initialState, action);
        expect(result.asset.type).toStrictEqual(action.payload.type);
        expect(result.asset.details).toStrictEqual(action.payload.details);
      });
    });

    describe('updateRecipient', () => {
      it('should', () => {
        const action = {
          type: 'send/updateRecipient',
          payload: {
            address: '0xNewAddress',
          },
        };

        const result = sendReducer(initialState, action);

        expect(result.stage).toStrictEqual(SEND_STAGES.DRAFT);
        expect(result.recipient.address).toStrictEqual(action.payload.address);
      });
    });

    describe('updateDraftTransaction', () => {
      it('should', () => {
        const detailsForDraftTransactionState = {
          ...initialState,
          status: SEND_STATUSES.VALID,
          account: {
            address: '0xCurrentAddress',
          },
          asset: {
            type: '',
          },
          recipient: {
            address: '0xRecipientAddress',
          },
          amount: {
            value: '0x1',
          },
          gas: {
            gasPrice: '0x3b9aca00', // 1000000000
            gasLimit: '0x5208', // 21000
          },
        };

        const action = {
          type: 'send/updateDraftTransaction',
        };

        const result = sendReducer(detailsForDraftTransactionState, action);

        expect(result.draftTransaction.txParams.to).toStrictEqual(
          detailsForDraftTransactionState.recipient.address,
        );
        expect(result.draftTransaction.txParams.value).toStrictEqual(
          detailsForDraftTransactionState.amount.value,
        );
        expect(result.draftTransaction.txParams.gas).toStrictEqual(
          detailsForDraftTransactionState.gas.gasLimit,
        );
        expect(result.draftTransaction.txParams.gasPrice).toStrictEqual(
          detailsForDraftTransactionState.gas.gasPrice,
        );
      });

      it('should update the draftTransaction txParams recipient to token address when asset is type TOKEN', () => {
        const detailsForDraftTransactionState = {
          ...initialState,
          status: SEND_STATUSES.VALID,
          account: {
            address: '0xCurrentAddress',
          },
          asset: {
            type: ASSET_TYPES.TOKEN,
            details: {
              address: '0xTokenAddress',
            },
          },
          amount: {
            value: '0x1',
          },
          gas: {
            gasPrice: '0x3b9aca00', // 1000000000
            gasLimit: '0x5208', // 21000
          },
        };

        const action = {
          type: 'send/updateDraftTransaction',
        };

        const result = sendReducer(detailsForDraftTransactionState, action);

        expect(result.draftTransaction.txParams.to).toStrictEqual(
          detailsForDraftTransactionState.asset.details.address,
        );
        expect(result.draftTransaction.txParams.value).toStrictEqual('0x0');
        expect(result.draftTransaction.txParams.gas).toStrictEqual(
          detailsForDraftTransactionState.gas.gasLimit,
        );
        expect(result.draftTransaction.txParams.gasPrice).toStrictEqual(
          detailsForDraftTransactionState.gas.gasPrice,
        );
        expect(result.draftTransaction.txParams.data).toStrictEqual(
          '0xa9059cbb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
        );
      });
    });

    describe('useDefaultGas', () => {
      it('should', () => {
        const action = {
          type: 'send/useDefaultGas',
        };

        const result = sendReducer(initialState, action);

        expect(result.gas.isCustomGasSet).toStrictEqual(false);
      });
    });

    describe('useCustomGas', () => {
      it('should', () => {
        const action = {
          type: 'send/useCustomGas',
        };

        const result = sendReducer(initialState, action);

        expect(result.gas.isCustomGasSet).toStrictEqual(true);
      });
    });

    describe('updateRecipientUserInput', () => {
      it('should update recipient user input with payload', () => {
        const action = {
          type: 'send/updateRecipientUserInput',
          payload: 'user input',
        };

        const result = sendReducer(initialState, action);

        expect(result.recipient.userInput).toStrictEqual(action.payload);
      });
    });

    describe('validateRecipientUserInput', () => {
      it('should set recipient error and warning to null when user input is', () => {
        const noUserInputState = {
          recipient: {
            mode: RECIPIENT_SEARCH_MODES.MY_ACCOUNTS,
            userInput: '',
            error: 'someError',
            warning: 'someWarning',
          },
        };

        const action = {
          type: 'send/validateRecipientUserInput',
        };

        const result = sendReducer(noUserInputState, action);

        expect(result.recipient.error).toBeNull();
        expect(result.recipient.warning).toBeNull();
      });

      it('should error with an invalid address error when user input is not a valid hex string', () => {
        const tokenAssetTypeState = {
          ...initialState,
          recipient: {
            userInput: '0xValidateError',
          },
        };
        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '',
            tokens: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        expect(result.recipient.error).toStrictEqual('invalidAddressRecipient');
      });

      // TODO: Expectation might change in the future
      it('should error with an invalid network error when user input is not a valid hex string on a non default network', () => {
        const tokenAssetTypeState = {
          ...initialState,
          recipient: {
            userInput: '0xValidateError',
          },
        };
        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '0x55',
            tokens: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        expect(result.recipient.error).toStrictEqual(
          'invalidAddressRecipientNotEthNetwork',
        );
      });

      it('should error with invalid address recipient when the user inputs the burn address', () => {
        const tokenAssetTypeState = {
          ...initialState,
          recipient: {
            userInput: '0x0000000000000000000000000000000000000000',
          },
        };
        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '',
            tokens: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        expect(result.recipient.error).toStrictEqual('invalidAddressRecipient');
      });

      it('should error with same address recipient as a token', () => {
        const tokenAssetTypeState = {
          ...initialState,
          asset: {
            type: ASSET_TYPES.TOKEN,
            details: {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            },
          },
          recipient: {
            userInput: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          },
        };

        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '0x4',
            tokens: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        expect(result.recipient.error).toStrictEqual('contractAddressError');
      });
    });

    describe('updateRecipientSearchMode', () => {
      it('should', () => {
        const action = {
          type: 'send/updateRecipientSearchMode',
          payload: 'a-random-string',
        };

        const result = sendReducer(initialState, action);

        expect(result.recipient.mode).toStrictEqual(action.payload);
      });
    });

    describe('resetSendState', () => {
      it('should', () => {
        const action = {
          type: 'send/resetSendState',
        };

        const result = sendReducer({}, action);

        expect(result).toStrictEqual(initialState);
      });
    });

    describe('validateAmountField', () => {
      it('should error with insufficient funds when amount asset value plust gas is higher than asset balance', () => {
        const nativeAssetState = {
          ...initialState,
          amount: {
            value: '0x6fc23ac0', // 1875000000
          },
          asset: {
            type: ASSET_TYPES.NATIVE,
            balance: '0x77359400', // 2000000000
          },
          gas: {
            gasTotal: '0x8f0d180', // 150000000
          },
        };

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(nativeAssetState, action);

        expect(result.amount.error).toStrictEqual(INSUFFICIENT_FUNDS_ERROR);
      });

      it('should error with insufficient tokens when amount value of tokens is higher than asset balance of token', () => {
        const tokenAssetState = {
          ...initialState,
          amount: {
            value: '0x77359400', // 2000000000
          },
          asset: {
            type: ASSET_TYPES.TOKEN,
            balance: '0x6fc23ac0', // 1875000000
            details: {
              decimals: 0,
            },
          },
        };

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(tokenAssetState, action);

        expect(result.amount.error).toStrictEqual(INSUFFICIENT_TOKENS_ERROR);
      });

      it('should error negative value amount', () => {
        const negativeAmountState = {
          ...initialState,
          amount: {
            value: '-1',
          },
        };

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(negativeAmountState, action);

        expect(result.amount.error).toStrictEqual(NEGATIVE_ETH_ERROR);
      });

      it('should not error for positive value amount', () => {
        const otherState = {
          ...initialState,
          amount: {
            error: 'someError',
            value: '1',
          },
          asset: {
            type: '',
          },
        };

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(otherState, action);
        expect(result.amount.error).toBeNull();
      });
    });

    describe('validateGasField', () => {
      it('should error when total amount of gas is higher than account balance', () => {
        const gasFieldState = {
          ...initialState,
          account: {
            balance: '0x0',
          },
          gas: {
            gasTotal: '0x1319718a5000', // 21000000000000
          },
        };

        const action = {
          type: 'send/validateGasField',
        };

        const result = sendReducer(gasFieldState, action);
        expect(result.gas.error).toStrictEqual(INSUFFICIENT_FUNDS_ERROR);
      });
    });

    describe('validateSendState', () => {
      it('should set `INVALID` send state status when amount error is present', () => {
        const amountErrorState = {
          ...initialState,
          amount: {
            error: 'Some Amount Error',
          },
        };

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(amountErrorState, action);
        expect(result.status).toStrictEqual(SEND_STATUSES.INVALID);
      });

      it('should set `INVALID` send state status when gas error is present', () => {
        const gasErrorState = {
          ...initialState,
          gas: {
            error: 'Some Amount Error',
          },
        };

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(gasErrorState, action);
        expect(result.status).toStrictEqual(SEND_STATUSES.INVALID);
      });

      it('should set `INVALID` send state status when asset type is `TOKEN` without token details present', () => {
        const assetErrorState = {
          ...initialState,
          asset: {
            type: ASSET_TYPES.TOKEN,
          },
        };

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(assetErrorState, action);
        expect(result.status).toStrictEqual(SEND_STATUSES.INVALID);
      });

      it('should set `INVALID` send state status when gasLimit is under the minimumGasLimit', () => {
        const gasLimitErroState = {
          ...initialState,
          gas: {
            gasLimit: '0x5207',
            minimumGasLimit: '0x5208',
          },
        };

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(gasLimitErroState, action);
        expect(result.status).toStrictEqual(SEND_STATUSES.INVALID);
      });

      it('should set `VALID` send state status when conditionals have not been met', () => {
        const validSendStatusState = {
          ...initialState,
          stage: SEND_STAGES.DRAFT,
          asset: {
            type: ASSET_TYPES.TOKEN,
            details: {
              address: '0x000',
            },
          },
          gas: {
            isGasEstimateLoading: false,
            gasLimit: '0x5208',
            minimumGasLimit: '0x5208',
          },
        };

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(validSendStatusState, action);

        expect(result.status).toStrictEqual(SEND_STATUSES.VALID);
      });
    });
  });

  describe('extraReducers/externalReducers', () => {
    describe('QR Code Detected', () => {
      const qrCodestate = {
        ...initialState,
        recipient: {
          address: '0xAddress',
        },
      };

      it('should set the recipient address to the scanned address value if they are not equal', () => {
        const action = {
          type: 'UI_QR_CODE_DETECTED',
          value: {
            type: 'address',
            values: {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            },
          },
        };

        const result = sendReducer(qrCodestate, action);
        expect(result.recipient.address).toStrictEqual(
          action.value.values.address,
        );
      });

      it('should not set the recipient address to invalid scanned address and errors', () => {
        const badQRAddressAction = {
          type: 'UI_QR_CODE_DETECTED',
          value: {
            type: 'address',
            values: {
              address: '0xBadAddress',
            },
          },
        };

        const result = sendReducer(qrCodestate, badQRAddressAction);

        expect(result.recipient.address).toStrictEqual(
          qrCodestate.recipient.address,
        );
        expect(result.recipient.error).toStrictEqual(
          INVALID_RECIPIENT_ADDRESS_ERROR,
        );
      });
    });

    describe('Selected Address Changed', () => {
      it('should update selected account address and balance on non-edit stages', () => {
        const olderState = {
          ...initialState,
          account: {
            balance: '0x0',
            address: '0xAddress',
          },
        };

        const action = {
          type: 'SELECTED_ACCOUNT_CHANGED',
          payload: {
            account: {
              address: '0xDifferentAddress',
              balance: '0x1',
            },
          },
        };

        const result = sendReducer(olderState, action);

        expect(result.account.balance).toStrictEqual(
          action.payload.account.balance,
        );
        expect(result.account.address).toStrictEqual(
          action.payload.account.address,
        );
      });
    });

    describe('Account Changed', () => {
      it('should', () => {
        const accountsChangedState = {
          ...initialState,
          stage: SEND_STAGES.EDIT,
          account: {
            address: '0xAddress',
            balance: '0x0',
          },
        };

        const action = {
          type: 'ACCOUNT_CHANGED',
          payload: {
            account: {
              address: '0xAddress',
              balance: '0x1',
            },
          },
        };

        const result = sendReducer(accountsChangedState, action);

        expect(result.account.balance).toStrictEqual(
          action.payload.account.balance,
        );
      });

      it(`should not edit account balance if action payload address is not the same as state's address`, () => {
        const accountsChangedState = {
          ...initialState,
          stage: SEND_STAGES.EDIT,
          account: {
            address: '0xAddress',
            balance: '0x0',
          },
        };

        const action = {
          type: 'ACCOUNT_CHANGED',
          payload: {
            account: {
              address: '0xDifferentAddress',
              balance: '0x1',
            },
          },
        };

        const result = sendReducer(accountsChangedState, action);
        expect(result.account.address).not.toStrictEqual(
          action.payload.account.address,
        );
        expect(result.account.balance).not.toStrictEqual(
          action.payload.account.balance,
        );
      });
    });

    describe('Initialize Pending Send State', () => {
      let dispatchSpy;
      let getState;

      beforeEach(() => {
        dispatchSpy = jest.fn();
      });

      it('should dispatch async action thunk first with pending, then finally fulfilling from minimal state', async () => {
        getState = jest.fn().mockReturnValue({
          metamask: {
            accounts: {
              '0xAddress': {
                address: '0xAddress',
                balance: '0x0',
              },
            },
            cachedBalances: {
              0x4: {
                '0xAddress': '0x0',
              },
            },
            selectedAddress: '0xAddress',
            provider: {
              chainId: '0x4',
            },
          },
          send: initialState,
          gas: {
            basicEstimateStatus: 'LOADING',
            basicEstimatesStatus: {
              safeLow: null,
              average: null,
              fast: null,
            },
          },
        });

        const action = initializeSendState();
        await action(dispatchSpy, getState, undefined);

        expect(dispatchSpy).toHaveBeenCalledTimes(4);

        expect(dispatchSpy.mock.calls[0][0].type).toStrictEqual(
          'send/initializeSendState/pending',
        );
        expect(dispatchSpy.mock.calls[3][0].type).toStrictEqual(
          'send/initializeSendState/fulfilled',
        );
      });
    });

    describe('Set Basic Gas Estimate Data', () => {
      it('should recalculate gas based off of average basic estimate data', () => {
        const gasState = {
          ...initialState,
          gas: {
            gasPrice: '0x0',
            gasLimit: '0x5208',
            gasTotal: '0x0',
            minimumGasLimit: '0x5208',
          },
        };

        const action = {
          type: 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA',
          value: {
            average: '1',
          },
        };

        const result = sendReducer(gasState, action);

        expect(result.gas.gasPrice).toStrictEqual('0x3b9aca00'); // 1000000000
        expect(result.gas.gasLimit).toStrictEqual(gasState.gas.gasLimit);
        expect(result.gas.gasTotal).toStrictEqual('0x1319718a5000');
      });
    });

    describe('BASIC_GAS_ESTIMATE_STATUS', () => {
      it('should invalidate the send status when status is LOADING', () => {
        const validSendStatusState = {
          ...initialState,
          status: SEND_STATUSES.VALID,
        };

        const action = {
          type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS',
          value: BASIC_ESTIMATE_STATES.LOADING,
        };

        const result = sendReducer(validSendStatusState, action);

        expect(result.status).not.toStrictEqual(validSendStatusState.status);
      });

      it('should invalidate the send status when status is FAILED and use INLINE gas input mode', () => {
        const validSendStatusState = {
          ...initialState,
          status: SEND_STATUSES.VALID,
        };

        const action = {
          type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS',
          value: BASIC_ESTIMATE_STATES.FAILED,
        };

        const result = sendReducer(validSendStatusState, action);

        expect(result.status).not.toStrictEqual(validSendStatusState.status);
      });
    });
  });

  describe('Action Creators', () => {
    describe('UpdateSendAmount', () => {
      const defaultSendAmountState = {
        send: {
          amount: {
            mode: undefined,
          },
          asset: {
            type: '',
          },
        },
      };

      it('should create an action to update send amount', async () => {
        const store = mockStore(defaultSendAmountState);

        const newSendAmount = 'aNewSendAmount';

        await store.dispatch(updateSendAmount(newSendAmount));

        const actionResult = store.getActions();

        const expectedActionResult = [
          { type: 'send/updateSendAmount', payload: 'aNewSendAmount' },
        ];

        expect(actionResult).toStrictEqual(expectedActionResult);
      });

      it('should create an action to update send amount mode to `INPUT` when mode is `MAX`', async () => {
        const maxModeSendState = {
          send: {
            ...defaultSendAmountState.send,
            amount: {
              mode: AMOUNT_MODES.MAX,
            },
          },
        };

        const store = mockStore(maxModeSendState);

        await store.dispatch(updateSendAmount());

        const actionResult = store.getActions();

        const expectedActionResult = [
          { type: 'send/updateSendAmount', payload: undefined },
          { type: 'send/updateAmountMode', payload: AMOUNT_MODES.INPUT },
        ];

        expect(actionResult).toStrictEqual(expectedActionResult);
      });

      it('should create an action computeEstimateGasLimit and change states from pending to fulfilled with token asset types', async () => {
        const tokenAssetTypeSendState = {
          metamask: {
            blockGasLimit: '',
            selectedAddress: '',
          },
          ...defaultSendAmountState.send,
          send: {
            asset: {
              type: ASSET_TYPES.TOKEN,
              details: {},
            },
            gas: {
              gasPrice: '',
            },
            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            draftTransaction: {
              userInputHexData: '',
            },
          },
        };

        const store = mockStore(tokenAssetTypeSendState);

        await store.dispatch(updateSendAmount());

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(4);
        expect(actionResult[0].type).toStrictEqual('send/updateSendAmount');
        expect(actionResult[1].type).toStrictEqual(
          'send/computeEstimatedGasLimit/pending',
        );
        expect(actionResult[2].type).toStrictEqual(
          'metamask/gas/SET_CUSTOM_GAS_LIMIT',
        );
        expect(actionResult[3].type).toStrictEqual(
          'send/computeEstimatedGasLimit/fulfilled',
        );
      });
    });

    describe('UpdateSendAsset', () => {
      const defaultSendAssetState = {
        metamask: {
          blockGasLimit: '',
          selectedAddress: '',
        },
        send: {
          account: {
            balance: '',
          },
          asset: {
            type: '',
            details: {},
          },
          gas: {
            gasPrice: '',
          },
          recipient: {
            address: '',
          },
          amount: {
            value: '',
          },
          draftTransaction: {
            userInputHexData: '',
          },
        },
      };

      it('should create actions for updateSendAsset', async () => {
        const store = mockStore(defaultSendAssetState);

        const newSendAsset = {
          type: '',
          details: {
            address: '',
            symbol: '',
            decimals: '',
          },
        };

        await store.dispatch(updateSendAsset(newSendAsset));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(4);

        expect(actionResult[0].type).toStrictEqual('send/updateAsset');
        expect(actionResult[0].payload).toStrictEqual({
          ...newSendAsset,
          balance: '',
        });

        expect(actionResult[1].type).toStrictEqual(
          'send/computeEstimatedGasLimit/pending',
        );
        expect(actionResult[2].type).toStrictEqual(
          'metamask/gas/SET_CUSTOM_GAS_LIMIT',
        );
        expect(actionResult[3].type).toStrictEqual(
          'send/computeEstimatedGasLimit/fulfilled',
        );
      });

      it('should create actions for updateSendAsset with tokens', async () => {
        global.eth = {
          contract: sinon.stub().returns({
            at: sinon.stub().returns({
              balanceOf: sinon.stub().returns(undefined),
            }),
          }),
        };
        const store = mockStore(defaultSendAssetState);

        const newSendAsset = {
          type: ASSET_TYPES.TOKEN,
          details: {
            address: 'tokenAddress',
            symbol: 'tokenSymbol',
            decimals: 'tokenDecimals',
          },
        };

        await store.dispatch(updateSendAsset(newSendAsset));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(6);
        expect(actionResult[0].type).toStrictEqual('SHOW_LOADING_INDICATION');
        expect(actionResult[1].type).toStrictEqual('HIDE_LOADING_INDICATION');
        expect(actionResult[2].payload).toStrictEqual({
          ...newSendAsset,
          balance: '0x0',
        });

        expect(actionResult[3].type).toStrictEqual(
          'send/computeEstimatedGasLimit/pending',
        );
        expect(actionResult[4].type).toStrictEqual(
          'metamask/gas/SET_CUSTOM_GAS_LIMIT',
        );
        expect(actionResult[5].type).toStrictEqual(
          'send/computeEstimatedGasLimit/fulfilled',
        );
      });
    });

    describe('updateRecipientUserInput', () => {
      const updateRecipientUserInputState = {
        metamask: {
          provider: {
            chainId: '',
          },
          tokens: [],
        },
      };

      it('should create actions for updateRecipientUserInput and checks debounce for validation', async () => {
        const clock = sinon.useFakeTimers();

        const store = mockStore(updateRecipientUserInputState);
        const newUserRecipientInput = 'newUserRecipientInput';

        await store.dispatch(updateRecipientUserInput(newUserRecipientInput));

        expect(store.getActions()).toHaveLength(1);
        expect(store.getActions()[0].type).toStrictEqual(
          'send/updateRecipientUserInput',
        );
        expect(store.getActions()[0].payload).toStrictEqual(
          newUserRecipientInput,
        );

        clock.tick(300); // debounce

        expect(store.getActions()).toHaveLength(2);
        expect(store.getActions()[1].type).toStrictEqual(
          'send/validateRecipientUserInput',
        );
        expect(store.getActions()[1].payload).toStrictEqual({
          chainId: '',
          tokens: [],
        });
      });
    });

    describe('useContactListForRecipientSearch', () => {
      it('should create action to change send recipient search to contact list', async () => {
        const store = mockStore();

        await store.dispatch(useContactListForRecipientSearch());

        const actionResult = store.getActions();

        expect(actionResult).toStrictEqual([
          {
            type: 'send/updateRecipientSearchMode',
            payload: RECIPIENT_SEARCH_MODES.CONTACT_LIST,
          },
        ]);
      });
    });

    describe('UseMyAccountsForRecipientSearch', () => {
      it('should create action to change send recipient search to derived accounts', async () => {
        const store = mockStore();

        await store.dispatch(useMyAccountsForRecipientSearch());

        const actionResult = store.getActions();

        expect(actionResult).toStrictEqual([
          {
            type: 'send/updateRecipientSearchMode',
            payload: RECIPIENT_SEARCH_MODES.MY_ACCOUNTS,
          },
        ]);
      });
    });

    describe('UpdateRecipient', () => {
      const recipient = {
        address: '',
        nickname: '',
      };

      it('should create an action to update recipient', async () => {
        const updateRecipientState = {
          send: {
            asset: {
              type: '',
            },
          },
        };

        const store = mockStore(updateRecipientState);

        await store.dispatch(updateRecipient(recipient));

        const actionResult = store.getActions();

        const expectedActionResult = [
          {
            type: 'send/updateRecipient',
            payload: recipient,
          },
        ];

        expect(actionResult).toHaveLength(1);
        expect(actionResult).toStrictEqual(expectedActionResult);
      });

      it('should create actions to update recipient and recalculate gas limit if the asset is a token', async () => {
        const tokenState = {
          metamask: {
            blockGasLimit: '',
            selectedAddress: '',
          },
          send: {
            account: {
              balance: '',
            },
            asset: {
              type: ASSET_TYPES.TOKEN,
              details: {},
            },
            gas: {
              gasPrice: '',
            },
            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            draftTransaction: {
              userInputHexData: '',
            },
          },
        };

        const store = mockStore(tokenState);

        await store.dispatch(updateRecipient(recipient));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(4);
        expect(actionResult[0].type).toStrictEqual('send/updateRecipient');
        expect(actionResult[1].type).toStrictEqual(
          'send/computeEstimatedGasLimit/pending',
        );
        expect(actionResult[2].type).toStrictEqual(
          'metamask/gas/SET_CUSTOM_GAS_LIMIT',
        );
        expect(actionResult[3].type).toStrictEqual(
          'send/computeEstimatedGasLimit/fulfilled',
        );
      });
    });

    describe('ResetRecipientInput', () => {
      it('should create actions to reset recipient input and ens then validates input', async () => {
        const updateRecipientState = {
          metamask: {
            provider: {
              chainId: '',
            },
            tokens: [],
          },
          send: {
            asset: {
              type: '',
            },
            recipient: {
              address: 'Address',
              nickname: 'NickName',
            },
          },
        };

        const store = mockStore(updateRecipientState);

        await store.dispatch(resetRecipientInput());
        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(4);
        expect(actionResult[0].type).toStrictEqual(
          'send/updateRecipientUserInput',
        );
        expect(actionResult[0].payload).toStrictEqual('');
        expect(actionResult[1].type).toStrictEqual('send/updateRecipient');
        expect(actionResult[2].type).toStrictEqual('ENS/resetResolution');
        expect(actionResult[3].type).toStrictEqual(
          'send/validateRecipientUserInput',
        );
      });
    });

    describe('UpdateSendHexData', () => {
      const sendHexDataState = {
        send: {
          asset: {
            type: '',
          },
        },
      };

      it('should create action to update hexData', async () => {
        const hexData = '0x1';
        const store = mockStore(sendHexDataState);

        await store.dispatch(updateSendHexData(hexData));

        const actionResult = store.getActions();

        const expectActionResult = [
          { type: 'send/updateUserInputHexData', payload: hexData },
        ];

        expect(actionResult).toHaveLength(1);
        expect(actionResult).toStrictEqual(expectActionResult);
      });
    });

    describe('ToggleSendMaxMode', () => {
      it('should create actions to toggle update max mode when send amount mode is not max', async () => {
        const sendMaxModeState = {
          send: {
            amount: {
              mode: '',
            },
          },
        };

        const store = mockStore(sendMaxModeState);

        await store.dispatch(toggleSendMaxMode());

        const actionResult = store.getActions();

        const expectedActionReslt = [
          { type: 'send/updateAmountMode', payload: AMOUNT_MODES.MAX },
          { type: 'send/updateAmountToMax', payload: undefined },
        ];

        expect(actionResult).toHaveLength(2);
        expect(actionResult).toStrictEqual(expectedActionReslt);
      });

      it('should create actions to toggle off  max mode when send amount mode is max', async () => {
        const sendMaxModeState = {
          send: {
            amount: {
              mode: AMOUNT_MODES.MAX,
            },
          },
        };
        const store = mockStore(sendMaxModeState);

        await store.dispatch(toggleSendMaxMode());

        const actionResult = store.getActions();

        const expectedActionReslt = [
          { type: 'send/updateAmountMode', payload: AMOUNT_MODES.INPUT },
          { type: 'send/updateSendAmount', payload: '0x0' },
        ];

        expect(actionResult).toHaveLength(2);
        expect(actionResult).toStrictEqual(expectedActionReslt);
      });
    });

    describe('SignTransaction', () => {
      const signTransactionState = {
        send: {
          asset: {},
          stage: '',
          draftTransaction: {},
          recipient: {},
          amount: {},
        },
      };

      it('should show confirm tx page when no other conditions for signing have been met', async () => {
        global.ethQuery = {
          sendTransaction: sinon.stub(),
        };

        const store = mockStore(signTransactionState);

        await store.dispatch(signTransaction());

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(1);
        expect(actionResult[0].type).toStrictEqual('SHOW_CONF_TX_PAGE');
      });

      it('should create actions for updateTransaction rejecting', async () => {
        const editStageSignTxState = {
          metamask: {
            unapprovedTxs: {
              1: {
                id: 1,
                txParams: {
                  value: 'oldTxValue',
                },
              },
            },
          },
          send: {
            ...signTransactionState.send,
            stage: SEND_STAGES.EDIT,
            draftTransaction: {
              id: 1,
              txParams: {
                value: 'newTxValue',
              },
            },
          },
        };

        jest.mock('../../store/actions.js');

        const store = mockStore(editStageSignTxState);

        await store.dispatch(signTransaction());

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(5);
        expect(actionResult[0].type).toStrictEqual('SHOW_LOADING_INDICATION');
        expect(actionResult[1].type).toStrictEqual('UPDATE_TRANSACTION_PARAMS');
        expect(actionResult[2].type).toStrictEqual('HIDE_LOADING_INDICATION');
      });
    });

    describe('editTransaction', () => {
      it('should set up the appropriate state for editing a native asset transaction', async () => {
        const editTransactionState = {
          metamask: {
            provider: {
              chainId: RINKEBY_CHAIN_ID,
            },
            tokens: [],
            addressBook: {
              [RINKEBY_CHAIN_ID]: {},
            },
            identities: {},
            unapprovedTxs: {
              1: {
                id: 1,
                txParams: {
                  from: '0xAddress',
                  to: '0xRecipientAddress',
                  gas: GAS_LIMITS.SIMPLE,
                  gasPrice: '0x3b9aca00', // 1000000000
                  value: '0xde0b6b3a7640000', // 1000000000000000000
                },
              },
            },
          },
          send: {
            asset: {
              type: '',
            },
            recipient: {
              address: 'Address',
              nickname: 'NickName',
            },
          },
        };

        const store = mockStore(editTransactionState);

        await store.dispatch(editTransaction(ASSET_TYPES.NATIVE, 1));
        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(1);
        expect(actionResult[0].type).toStrictEqual('send/editTransaction');
        expect(actionResult[0].payload).toStrictEqual({
          address: '0xRecipientAddress',
          amount: '0xde0b6b3a7640000',
          from: '0xAddress',
          gasLimit: GAS_LIMITS.SIMPLE,
          gasPrice: '0x3b9aca00',
          id: 1,
          nickname: '',
        });

        const action = actionResult[0];

        const result = sendReducer(initialState, action);

        expect(result.gas.gasLimit).toStrictEqual(action.payload.gasLimit);
        expect(result.gas.gasPrice).toStrictEqual(action.payload.gasPrice);

        expect(result.amount.value).toStrictEqual(action.payload.amount);

        expect(result.draftTransaction.txParams.to).toStrictEqual(
          action.payload.address,
        );
        expect(result.draftTransaction.txParams.value).toStrictEqual(
          action.payload.amount,
        );
        expect(result.draftTransaction.txParams.gasPrice).toStrictEqual(
          action.payload.gasPrice,
        );
        expect(result.draftTransaction.txParams.gas).toStrictEqual(
          action.payload.gasLimit,
        );
      });

      it('should set up the appropriate state for editing a token asset transaction', async () => {
        const editTransactionState = {
          metamask: {
            blockGasLimit: '0x3a98',
            selectedAddress: '',
            provider: {
              chainId: RINKEBY_CHAIN_ID,
            },
            tokens: [],
            addressBook: {
              [RINKEBY_CHAIN_ID]: {},
            },
            identities: {},
            unapprovedTxs: {
              1: {
                id: 1,
                txParams: {
                  from: '0xAddress',
                  to: '0xTokenAddress',
                  gas: GAS_LIMITS.SIMPLE,
                  gasPrice: '0x3b9aca00', // 1000000000
                  value: '0x0',
                },
              },
            },
          },
          send: {
            account: {
              address: '0xAddress',
              balance: '0x0',
            },
            asset: {
              type: '',
            },
            gas: {
              gasPrice: '',
            },
            amount: {
              value: '',
            },
            draftTransaction: {
              userInputHexData: '',
            },
            recipient: {
              address: 'Address',
              nickname: 'NickName',
            },
          },
        };

        global.eth = {
          contract: sinon.stub().returns({
            at: sinon.stub().returns({
              balanceOf: sinon.stub().returns(undefined),
            }),
          }),
          getCode: jest.fn(() => '0xa'),
        };

        const store = mockStore(editTransactionState);

        await store.dispatch(
          editTransaction(
            ASSET_TYPES.TOKEN,
            1,
            {
              name: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
              args: {
                _to: '0xRecipientAddress',
                _value: ethers.BigNumber.from(15000),
              },
            },
            { address: '0xAddress', symbol: 'SYMB', decimals: 18 },
          ),
        );
        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(7);
        expect(actionResult[0].type).toStrictEqual('SHOW_LOADING_INDICATION');
        expect(actionResult[1].type).toStrictEqual('HIDE_LOADING_INDICATION');
        expect(actionResult[2].type).toStrictEqual('send/updateAsset');
        expect(actionResult[2].payload).toStrictEqual({
          balance: '0x0',
          type: ASSET_TYPES.TOKEN,
          details: {
            address: '0xTokenAddress',
            decimals: 18,
            symbol: 'SYMB',
            isERC721: false,
          },
        });
        expect(actionResult[3].type).toStrictEqual(
          'send/computeEstimatedGasLimit/pending',
        );
        expect(actionResult[4].type).toStrictEqual(
          'metamask/gas/SET_CUSTOM_GAS_LIMIT',
        );
        expect(actionResult[5].type).toStrictEqual(
          'send/computeEstimatedGasLimit/fulfilled',
        );
        expect(actionResult[6].type).toStrictEqual('send/editTransaction');
        expect(actionResult[6].payload).toStrictEqual({
          address: '0xrecipientaddress', // getting address from tokenData does .toLowerCase
          amount: '0x3a98',
          from: '0xAddress',
          gasLimit: GAS_LIMITS.SIMPLE,
          gasPrice: '0x3b9aca00',
          id: 1,
          nickname: '',
        });

        const action = actionResult[6];

        const result = sendReducer(initialState, action);

        expect(result.gas.gasLimit).toStrictEqual(action.payload.gasLimit);
        expect(result.gas.gasPrice).toStrictEqual(action.payload.gasPrice);

        expect(result.amount.value).toStrictEqual(action.payload.amount);

        expect(result.draftTransaction.txParams.to).toStrictEqual(
          action.payload.address,
        );
        expect(result.draftTransaction.txParams.value).toStrictEqual(
          action.payload.amount,
        );
        expect(result.draftTransaction.txParams.gasPrice).toStrictEqual(
          action.payload.gasPrice,
        );
        expect(result.draftTransaction.txParams.gas).toStrictEqual(
          action.payload.gasLimit,
        );
      });
    });
  });
});
