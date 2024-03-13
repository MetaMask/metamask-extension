import sinon from 'sinon';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { BigNumber } from '@ethersproject/bignumber';
import { NetworkType } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import {
  CONTRACT_ADDRESS_ERROR,
  FLOAT_TOKENS_ERROR,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_WARNING,
  NEGATIVE_ETH_ERROR,
  NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR,
} from '../../pages/confirmations/send/send.constants';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { KeyringType } from '../../../shared/constants/keyring';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';
import * as Actions from '../../store/actions';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  generateERC20TransferData,
  generateERC721TransferData,
} from '../../pages/confirmations/send/send.utils';
import { BURN_ADDRESS } from '../../../shared/modules/hexstring-utils';
import {
  getInitialSendStateWithExistingTxState,
  INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
} from '../../../test/jest/mocks';
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
  SEND_STAGES,
  AMOUNT_MODES,
  RECIPIENT_SEARCH_MODES,
  getSendAsset,
  getSendAssetAddress,
  getIsAssetSendable,
  getSendAmount,
  getSendMaxModeState,
  getDraftTransactionID,
  sendAmountIsInError,
  getSendHexData,
  getSendTo,
  getIsUsingMyAccountForRecipientSearch,
  getRecipientUserInput,
  getRecipient,
  getSendErrors,
  isSendStateInitialized,
  isSendFormInvalid,
  getSendStage,
} from './send';
import { draftTransactionInitialState, editExistingTransaction } from '.';

const mockStore = createMockStore([thunk]);

const mockAddress1 = '0xdafea492d9c6733ae3d56b7ed1adb60692c98123';
const mockNftAddress1 = 'f4831105676a5fc024684d056390b8bc529daf51c7';

jest.mock('./send', () => {
  const actual = jest.requireActual('./send');
  return {
    __esModule: true,
    ...actual,
    getERC20Balance: jest.fn(() => '0x0'),
  };
});

jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn) => fn,
}));

setBackgroundConnection({
  addPollingTokenToAppState: jest.fn(),
  addTransaction: jest.fn((_u, _v, cb) => {
    cb(null, { transactionMeta: null });
  }),
  updateTransactionSendFlowHistory: jest.fn((_x, _y, _z, cb) => cb(null)),
});

const getTestUUIDTx = (state) => state.draftTransactions['test-uuid'];

describe('Send Slice', () => {
  let getTokenStandardAndDetailsStub;
  let addTransactionAndRouteToConfirmationPageStub;
  beforeEach(() => {
    jest.useFakeTimers();
    getTokenStandardAndDetailsStub = jest
      .spyOn(Actions, 'getTokenStandardAndDetails')
      .mockImplementation(() =>
        Promise.resolve({
          standard: 'ERC20',
          balance: '0x0',
          symbol: 'SYMB',
          decimals: 18,
        }),
      );
    addTransactionAndRouteToConfirmationPageStub = jest.spyOn(
      Actions,
      'addTransactionAndRouteToConfirmationPage',
    );
    jest
      .spyOn(Actions, 'updateTokenType')
      .mockImplementation(() => Promise.resolve({ isERC721: false }));
    jest
      .spyOn(Actions, 'isNftOwner')
      .mockImplementation(() => Promise.resolve(true));
    jest.spyOn(Actions, 'updateEditableParams').mockImplementation(() => ({
      type: 'UPDATE_TRANSACTION_EDITABLE_PARAMS',
    }));
  });

  describe('Reducers', () => {
    describe('addNewDraft', () => {
      it('should add new draft transaction and set currentTransactionUUID', () => {
        const action = {
          type: 'send/addNewDraft',
          payload: { ...draftTransactionInitialState, id: 4 },
        };
        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );
        expect(result.currentTransactionUUID).not.toStrictEqual('test-uuid');
        const uuid = result.currentTransactionUUID;
        const draft = result.draftTransactions[uuid];
        expect(draft.id).toStrictEqual(4);
      });
    });
    describe('addHistoryEntry', () => {
      it('should append a history item to the current draft transaction, including timestamp', () => {
        const action = {
          type: 'send/addHistoryEntry',
          payload: 'test entry',
        };
        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );
        expect(result.currentTransactionUUID).toStrictEqual('test-uuid');
        const draft = getTestUUIDTx(result);
        const latestHistory = draft.history[draft.history.length - 1];
        expect(latestHistory.timestamp).toBeDefined();
        expect(latestHistory.entry).toStrictEqual('test entry');
      });
    });
    describe('resetSendState', () => {
      it('should set the state back to a blank slate matching the initialState object', () => {
        const action = {
          type: 'send/resetSendState',
        };

        const result = sendReducer({}, action);

        expect(result).toStrictEqual(initialState);
      });
    });
    describe('updateSendAmount', () => {
      it('should', async () => {
        const action = { type: 'send/updateSendAmount', payload: '0x1' };
        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );
        expect(getTestUUIDTx(result).amount.value).toStrictEqual('0x1');
      });
    });

    describe('updateAmountToMax', () => {
      it('should set account balance', () => {
        const maxAmountState = {
          amount: {
            value: '',
          },
          asset: {
            balance: '0x56bc75e2d63100000', // 100000000000000000000
          },
        };

        const state = getInitialSendStateWithExistingTxState(maxAmountState);
        const action = { type: 'send/updateAmountToMax' };
        const result = sendReducer(state, action);

        expect(getTestUUIDTx(result).amount.value).toStrictEqual(
          '0x56bc75e2d63100000',
        );
      });
    });

    describe('updateUserInputHexData', () => {
      it('should update the state with the provided data', () => {
        const action = {
          type: 'send/updateUserInputHexData',
          payload: 'TestData',
        };
        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );
        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.userInputHexData).toStrictEqual(action.payload);
      });
    });

    describe('updateAmountMode', () => {
      it('should change to INPUT amount mode', () => {
        const emptyAmountModeState = {
          amountMode: '',
        };

        const action = {
          type: 'send/updateAmountMode',
          payload: AMOUNT_MODES.INPUT,
        };
        const result = sendReducer(emptyAmountModeState, action);

        expect(result.amountMode).toStrictEqual(action.payload);
      });

      it('should change to MAX amount mode', () => {
        const action = {
          type: 'send/updateAmountMode',
          payload: AMOUNT_MODES.MAX,
        };
        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.amountMode).toStrictEqual(action.payload);
      });

      it('should', () => {
        const action = {
          type: 'send/updateAmountMode',
          payload: 'RANDOM',
        };
        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.amountMode).not.toStrictEqual(action.payload);
      });
    });

    describe('updateAsset', () => {
      it('should update asset type and balance from respective action payload', () => {
        const updateAssetState = getInitialSendStateWithExistingTxState({
          asset: {
            type: 'old type',
            balance: 'old balance',
          },
        });

        const action = {
          type: 'send/updateAsset',
          payload: {
            asset: {
              type: 'new type',
              balance: 'new balance',
            },
          },
        };

        const result = sendReducer(updateAssetState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.asset.type).toStrictEqual(
          action.payload.asset.type,
        );
        expect(draftTransaction.asset.balance).toStrictEqual(
          action.payload.asset.balance,
        );
      });

      it('should update hex data if its not the initial asset set', () => {
        const updateAssetState = getInitialSendStateWithExistingTxState({
          asset: {
            type: 'old type',
            balance: 'old balance',
          },
          userInputHexData: '0xTestHexData',
        });

        const action = {
          type: 'send/updateAsset',
          payload: {
            asset: {
              type: 'new type',
              balance: 'new balance',
            },
            initialAssetSet: false,
          },
        };

        const result = sendReducer(updateAssetState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.userInputHexData).toStrictEqual('');
      });

      it('should nullify old contract address error when asset types is not TOKEN', () => {
        const recipientErrorState = getInitialSendStateWithExistingTxState({
          recipient: {
            error: CONTRACT_ADDRESS_ERROR,
          },
          asset: {
            type: AssetType.token,
          },
        });

        const action = {
          type: 'send/updateAsset',
          payload: {
            asset: {
              type: 'New Type',
            },
          },
        };

        const result = sendReducer(recipientErrorState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.error).not.toStrictEqual(
          CONTRACT_ADDRESS_ERROR,
        );
        expect(draftTransaction.recipient.error).toBeNull();
      });

      it('should update asset type and details to TOKEN payload', () => {
        const action = {
          type: 'send/updateAsset',
          payload: {
            asset: {
              type: AssetType.token,
              details: {
                address: '0xTokenAddress',
                decimals: 0,
                symbol: 'TKN',
              },
            },
          },
        };

        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.asset.type).toStrictEqual(
          action.payload.asset.type,
        );
        expect(draftTransaction.asset.details).toStrictEqual(
          action.payload.asset.details,
        );
      });
    });

    describe('updateRecipient', () => {
      it('should', () => {
        const action = {
          type: 'send/updateRecipient',
          payload: {
            address: mockNftAddress1,
          },
        };

        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        const draftTransaction = getTestUUIDTx(result);

        expect(result.stage).toStrictEqual(SEND_STAGES.DRAFT);
        expect(draftTransaction.recipient.address).toStrictEqual(
          action.payload.address,
        );
      });
    });

    describe('updateRecipientUserInput', () => {
      it('should update recipient user input with payload', () => {
        const action = {
          type: 'send/updateRecipientUserInput',
          payload: 'user input',
        };

        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.recipientInput).toStrictEqual(action.payload);
      });
    });

    describe('validateRecipientUserInput', () => {
      it('should set recipient error and warning to null when user input is', () => {
        const noUserInputState = {
          ...getInitialSendStateWithExistingTxState({
            recipient: {
              error: 'someError',
              warning: 'someWarning',
            },
            amount: {},
            asset: {},
          }),
          recipientInput: '',
          recipientMode: RECIPIENT_SEARCH_MODES.MY_ACCOUNTS,
        };

        const action = {
          type: 'send/validateRecipientUserInput',
        };

        const result = sendReducer(noUserInputState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.error).toBeNull();
        expect(draftTransaction.recipient.warning).toBeNull();
      });

      it('should error with an invalid address error when user input is not a valid hex string', () => {
        const tokenAssetTypeState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          recipientInput: '0xValidateError',
        };
        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '',
            tokens: [],
            useTokenDetection: true,
            tokenAddressList: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.error).toStrictEqual(
          'invalidAddressRecipient',
        );
      });

      // TODO: Expectation might change in the future
      it('should error with an invalid network error when user input is not a valid hex string on a non default network', () => {
        const tokenAssetTypeState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          recipientInput: '0xValidateError',
        };
        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '0x55',
            tokens: [],
            useTokenDetection: true,
            tokenAddressList: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.error).toStrictEqual(
          'invalidAddressRecipientNotEthNetwork',
        );
      });

      it('should error with invalid address recipient when the user inputs the burn address', () => {
        const tokenAssetTypeState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          recipientInput: '0x0000000000000000000000000000000000000000',
        };
        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '',
            tokens: [],
            useTokenDetection: true,
            tokenAddressList: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.error).toStrictEqual(
          'invalidAddressRecipient',
        );
      });

      it('should error with same address recipient as a token', () => {
        const tokenAssetTypeState = {
          ...getInitialSendStateWithExistingTxState({
            asset: {
              type: AssetType.token,
              details: {
                address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              },
            },
          }),
          recipientInput: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        };

        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '0x5',
            tokens: [],
            useTokenDetection: true,
            tokenAddressList: ['0x514910771af9ca656af840dff83e8264ecf986ca'],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);
        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.error).toStrictEqual(
          'contractAddressError',
        );
      });

      it('should set a warning when sending to a token address in the token address list', () => {
        const tokenAssetTypeState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          recipientInput: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        };

        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '0x5',
            tokens: [],
            useTokenDetection: true,
            tokenAddressList: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.warning).toStrictEqual(
          KNOWN_RECIPIENT_ADDRESS_WARNING,
        );
      });

      it('should set a warning when sending to a token address in the token list', () => {
        const tokenAssetTypeState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          recipientInput: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        };

        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '0x5',
            tokens: [{ address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' }],
            useTokenDetection: true,
            tokenAddressList: [],
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.warning).toStrictEqual(
          KNOWN_RECIPIENT_ADDRESS_WARNING,
        );
      });

      it('should set a warning when sending to an address that is probably a token contract', () => {
        const tokenAssetTypeState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          recipientInput: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        };

        const action = {
          type: 'send/validateRecipientUserInput',
          payload: {
            chainId: '0x5',
            tokens: [{ address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }],
            useTokenDetection: true,
            tokenAddressList: ['0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
            isProbablyAnAssetContract: true,
          },
        };

        const result = sendReducer(tokenAssetTypeState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.warning).toStrictEqual(
          KNOWN_RECIPIENT_ADDRESS_WARNING,
        );
      });
    });

    describe('updateRecipientSearchMode', () => {
      it('should', () => {
        const action = {
          type: 'send/updateRecipientSearchMode',
          payload: 'a-random-string',
        };

        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.recipientMode).toStrictEqual(action.payload);
      });
    });

    describe('validateAmountField', () => {
      it('should error with insufficient tokens when amount value of tokens is higher than asset balance of token', () => {
        const tokenAssetState = getInitialSendStateWithExistingTxState({
          amount: {
            value: '0x77359400', // 2000000000
          },
          asset: {
            type: AssetType.token,
            balance: '0x6fc23ac0', // 1875000000
            details: {
              decimals: 0,
            },
          },
        });

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(tokenAssetState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.amount.error).toStrictEqual(
          INSUFFICIENT_TOKENS_ERROR,
        );
      });

      it('should error negative value amount', () => {
        const negativeAmountState = getInitialSendStateWithExistingTxState({
          amount: {
            value: '-1',
          },
        });

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(negativeAmountState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.amount.error).toStrictEqual(NEGATIVE_ETH_ERROR);
      });

      it('should error float value amount of erc1155', () => {
        const negativeAmountState = getInitialSendStateWithExistingTxState({
          amount: {
            value: '1.2',
          },
          asset: {
            type: AssetType.NFT,
            details: {
              balance: '2',
              standard: TokenStandard.ERC1155,
            },
          },
        });

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(negativeAmountState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.amount.error).toStrictEqual(FLOAT_TOKENS_ERROR);
      });

      it('should error negative value amount of erc1155', () => {
        const negativeAmountState = getInitialSendStateWithExistingTxState({
          amount: {
            value: '-1',
          },
          asset: {
            type: AssetType.NFT,
            details: {
              balance: '2',
              standard: TokenStandard.ERC1155,
            },
          },
        });

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(negativeAmountState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.amount.error).toStrictEqual(
          NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR,
        );
      });

      it('should not error for positive value amount', () => {
        const otherState = getInitialSendStateWithExistingTxState({
          amount: {
            error: 'someError',
            value: '1',
          },
          asset: {
            type: '',
          },
        });

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(otherState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.amount.error).toBeNull();
      });

      it('should error with insufficient tokens amount when amount value of an erc1155 is higher than asset balance', () => {
        const tokenAssetState = getInitialSendStateWithExistingTxState({
          amount: {
            value: '2',
          },
          asset: {
            type: AssetType.NFT,
            balance: '0x6fc23ac0',
            details: {
              standard: TokenStandard.ERC1155,
              balance: '1',
              decimals: 0,
            },
          },
        });

        const action = {
          type: 'send/validateAmountField',
        };

        const result = sendReducer(tokenAssetState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.amount.error).toStrictEqual(
          INSUFFICIENT_FUNDS_ERROR,
        );
      });
    });

    describe('validateSendState', () => {
      it('should set `INVALID` send state status when amount error is present', () => {
        const amountErrorState = getInitialSendStateWithExistingTxState({
          amount: {
            error: 'Some Amount Error',
          },
        });

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(amountErrorState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.status).toStrictEqual(SEND_STATUSES.INVALID);
      });

      it('should set `INVALID` send state status when asset type is `TOKEN` without token details present', () => {
        const assetErrorState = getInitialSendStateWithExistingTxState({
          asset: {
            type: AssetType.token,
          },
        });

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(assetErrorState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.status).toStrictEqual(SEND_STATUSES.INVALID);
      });

      it('should set `VALID` send state status when conditionals have not been met', () => {
        const validSendStatusState = {
          ...getInitialSendStateWithExistingTxState({
            asset: {
              type: AssetType.token,
              details: {
                address: '0x000',
              },
            },
          }),
          stage: SEND_STAGES.DRAFT,
        };

        const action = {
          type: 'send/validateSendState',
        };

        const result = sendReducer(validSendStatusState, action);

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.status).toStrictEqual(SEND_STATUSES.VALID);
      });
    });
  });

  describe('extraReducers/externalReducers', () => {
    describe('QR Code Detected', () => {
      const qrCodestate = getInitialSendStateWithExistingTxState({
        recipient: {
          address: mockAddress1,
        },
      });

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

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.address).toStrictEqual(
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

        const draftTransaction = getTestUUIDTx(result);

        expect(draftTransaction.recipient.address).toStrictEqual(mockAddress1);
        expect(draftTransaction.recipient.error).toStrictEqual(
          INVALID_RECIPIENT_ADDRESS_ERROR,
        );
      });
    });

    describe('Selected Address Changed', () => {
      it('should update selected account address and balance on non-edit stages', () => {
        const olderState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          selectedAccount: {
            balance: '0x0',
            address: mockAddress1,
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

        expect(result.selectedAccount.balance).toStrictEqual(
          action.payload.account.balance,
        );
        expect(result.selectedAccount.address).toStrictEqual(
          action.payload.account.address,
        );
      });
      it('should reset to native asset on selectedAccount changed', () => {
        const olderState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          selectedAccount: {
            balance: '0x3',
            address: mockAddress1,
          },
          draftTransactions: {
            'test-uuid': {
              ...draftTransactionInitialState,
              asset: {
                type: AssetType.token,
                error: null,
                details: {
                  address: 'tokenAddress',
                  symbol: 'tokenSymbol',
                  decimals: 'tokenDecimals',
                },
                balance: '0x2',
              },
            },
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
        expect(result.selectedAccount.balance).toStrictEqual(
          action.payload.account.balance,
        );
        expect(result.selectedAccount.address).toStrictEqual(
          action.payload.account.address,
        );

        expect(result.draftTransactions['test-uuid'].asset).toStrictEqual({
          ...draftTransactionInitialState.asset,
          balance: action.payload.account.balance,
        });
      });

      it('should gracefully handle missing account in payload', () => {
        const olderState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          selectedAccount: {
            balance: '0x0',
            address: mockAddress1,
          },
        };

        const action = {
          type: 'SELECTED_ACCOUNT_CHANGED',
          payload: {
            account: undefined,
          },
        };

        const result = sendReducer(olderState, action);

        expect(result.selectedAccount.balance).toStrictEqual('0x0');
        expect(result.selectedAccount.address).toStrictEqual(mockAddress1);
      });
    });

    describe('Account Changed', () => {
      it('should correctly update the fromAccount in an edit', () => {
        const accountsChangedState = {
          ...getInitialSendStateWithExistingTxState({
            fromAccount: {
              address: mockAddress1,
              balance: '0x0',
            },
          }),
          stage: SEND_STAGES.EDIT,
          selectedAccount: {
            address: mockAddress1,
            balance: '0x0',
          },
        };

        const action = {
          type: 'ACCOUNT_CHANGED',
          payload: {
            account: {
              address: mockAddress1,
              balance: '0x1',
            },
          },
        };

        const result = sendReducer(accountsChangedState, action);

        const draft = getTestUUIDTx(result);

        expect(draft.fromAccount.balance).toStrictEqual(
          action.payload.account.balance,
        );
      });

      it('should gracefully handle missing account param in payload', () => {
        const accountsChangedState = {
          ...getInitialSendStateWithExistingTxState({
            fromAccount: {
              address: mockAddress1,
              balance: '0x0',
            },
          }),
          stage: SEND_STAGES.EDIT,
          selectedAccount: {
            address: mockAddress1,
            balance: '0x0',
          },
        };

        const action = {
          type: 'ACCOUNT_CHANGED',
          payload: {
            account: undefined,
          },
        };

        const result = sendReducer(accountsChangedState, action);

        const draft = getTestUUIDTx(result);

        expect(draft.fromAccount.balance).toStrictEqual('0x0');
      });

      it(`should not edit account balance if action payload address is not the same as state's address`, () => {
        const accountsChangedState = {
          ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          stage: SEND_STAGES.EDIT,
          selectedAccount: {
            address: mockAddress1,
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
        expect(result.selectedAccount.address).not.toStrictEqual(
          action.payload.account.address,
        );
        expect(result.selectedAccount.balance).not.toStrictEqual(
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
            selectedNetworkClientId: NetworkType.goerli,
            networksMetadata: {
              [NetworkType.goerli]: {
                EIPS: {
                  1559: true,
                },
                status: NetworkStatus.Available,
              },
            },
            selectedAddress: mockAddress1,
            identities: { [mockAddress1]: { address: mockAddress1 } },
            internalAccounts: {
              accounts: {
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                  address: mockAddress1,
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            },
            keyrings: [
              {
                type: KeyringType.hdKeyTree,
                accounts: [mockAddress1],
              },
            ],
            accounts: {
              [mockAddress1]: {
                address: mockAddress1,
                balance: '0x0',
              },
            },
            accountsByChainId: {
              0x5: {
                [mockAddress1]: { balance: '0x0' },
              },
            },
            providerConfig: {
              chainId: '0x5',
              ticker: 'ETH',
            },
            useTokenDetection: true,
            tokenList: {
              '0x514910771af9ca656af840dff83e8264ecf986ca': {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                symbol: 'LINK',
                decimals: 18,
                name: 'Chainlink',
                iconUrl:
                  'https://s3.amazonaws.com/airswap-token-images/LINK.png',
                aggregators: [
                  'airswapLight',
                  'bancor',
                  'cmc',
                  'coinGecko',
                  'kleros',
                  'oneInch',
                  'paraswap',
                  'pmm',
                  'totle',
                  'zapper',
                  'zerion',
                  'zeroEx',
                ],
                occurrences: 12,
              },
            },
          },
          send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
        });

        const action = initializeSendState();
        await action(dispatchSpy, getState, undefined);

        expect(dispatchSpy).toHaveBeenCalledTimes(2);

        expect(dispatchSpy.mock.calls[0][0].type).toStrictEqual(
          'send/initializeSendState/pending',
        );
        expect(dispatchSpy.mock.calls[1][0].type).toStrictEqual(
          'send/initializeSendState/fulfilled',
        );
      });
    });
  });

  describe('Action Creators', () => {
    describe('UpdateSendAmount', () => {
      it('should create an action to update send amount', async () => {
        const sendState = {
          metamask: {
            selectedAddress: '',
            internalAccounts: {
              accounts: {
                'mock-id': {
                  address: '0x0',
                  id: 'mock-id',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'mock-id',
            },
            accounts: {},
            providerConfig: {
              chainId: '0x1',
            },
          },
          send: getInitialSendStateWithExistingTxState({
            asset: {
              details: {},
            },
            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            userInputHexData: '',
          }),
        };
        const store = mockStore(sendState);

        const newSendAmount = 'DE0B6B3A7640000';

        await store.dispatch(updateSendAmount(newSendAmount));

        const actionResult = store.getActions();

        const expectedFirstActionResult = {
          type: 'send/addHistoryEntry',
          payload: 'sendFlow - user set amount to 1 ETH',
        };

        const expectedSecondActionResult = {
          type: 'send/updateSendAmount',
          payload: 'DE0B6B3A7640000',
        };

        expect(actionResult[0]).toStrictEqual(expectedFirstActionResult);
        expect(actionResult[1]).toStrictEqual(expectedSecondActionResult);
      });

      it('should create an action to update send amount ERC1155', async () => {
        const sendState = {
          metamask: {
            selectedAddress: '',
            internalAccounts: {
              accounts: {
                'mock-id': {
                  address: '0x0',
                  id: 'mock-id',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'mock-id',
            },
            accounts: {},
            providerConfig: {
              chainId: '0x1',
            },
          },
          send: getInitialSendStateWithExistingTxState({
            asset: {
              balance: '0x1',
              details: {
                address: '0x24204A596025b871BD01F31D89474C1c15785baF',
                description: 'This is a collection of Rock NFTs.',
                favorite: false,
                image:
                  'https://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi.ipfs.dweb.link',
                isCurrentlyOwned: true,
                name: 'ERC1155',
                standard: 'ERC1155',
                tokenId: '1',
                tokenURI:
                  'https://bafybeidxfmwycgzcp4v2togflpqh2gnibuexjy4m4qqwxp7nh3jx5zlh4y.ipfs.dweb.link/1.json',
                balance: '6',
              },
              error: null,
              type: 'NFT',
            },
            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            userInputHexData: '',
          }),
        };
        const store = mockStore(sendState);

        const newSendAmount = '0x12';

        await store.dispatch(updateSendAmount(newSendAmount));

        const expectedActionResult = {
          type: 'send/updateSendAmount',
          payload: '0x12',
        };

        const actionResult = store.getActions();

        expect(null).toBe(null);
        expect(actionResult[1]).toStrictEqual(expectedActionResult);
      });

      it('should create an action to update send amount mode to `INPUT` when mode is `MAX`', async () => {
        const sendState = {
          metamask: {
            selectedAddress: '',
            internalAccounts: {
              accounts: {
                'mock-id': {
                  address: '0x0',
                  id: 'mock-id',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'mock-id',
            },
            accounts: {},
            providerConfig: {
              chainId: '0x1',
            },
          },
          send: getInitialSendStateWithExistingTxState({
            asset: {
              details: {},
            },

            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            userInputHexData: '',
          }),
        };

        const store = mockStore(sendState);

        await store.dispatch(updateSendAmount());

        const actionResult = store.getActions();

        const expectedFirstActionResult = {
          type: 'send/addHistoryEntry',
          payload: 'sendFlow - user set amount to 0 ETH',
        };

        const expectedSecondActionResult = {
          type: 'send/updateSendAmount',
          payload: undefined,
        };

        expect(actionResult[0]).toStrictEqual(expectedFirstActionResult);
        expect(actionResult[1]).toStrictEqual(expectedSecondActionResult);
      });
    });

    describe('UpdateSendAsset', () => {
      const defaultSendAssetState = {
        metamask: {
          selectedAddress: '',
          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                address: mockAddress1,
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: [...Object.values(EthMethod)],
                type: EthAccountType.Eoa,
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
          },
          accountsByChainId: {
            [CHAIN_IDS.GOERLI]: {
              [mockAddress1]: { balance: '0x0' },
            },
          },
          accounts: {
            [mockAddress1]: {
              address: '0x0',
            },
          },
          identities: {
            [mockAddress1]: {},
          },
        },
        send: {
          ...getInitialSendStateWithExistingTxState({
            asset: {
              type: '',
              details: {},
            },

            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            userInputHexData: '',
          }),
          selectedAccount: {
            address: mockAddress1,
          },
        },
      };

      it('should create actions for updateSendAsset', async () => {
        const store = mockStore(defaultSendAssetState);

        const newSendAsset = {
          type: AssetType.native,
        };

        await store.dispatch(updateSendAsset(newSendAsset));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(2);

        expect(actionResult[0]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload: 'sendFlow - user set asset of type NATIVE with symbol ETH',
        });
        expect(actionResult[1].type).toStrictEqual('send/updateAsset');
        expect(actionResult[1].payload).toStrictEqual({
          asset: {
            type: AssetType.native,
            balance: '0x0',
            error: null,
            details: null,
          },
          initialAssetSet: false,
        });
      });

      it('should create actions for updateSendAsset with tokens', async () => {
        getTokenStandardAndDetailsStub.mockImplementation(() =>
          Promise.resolve({
            standard: 'ERC20',
            balance: '0x0',
            symbol: 'TokenSymbol',
            decimals: 18,
          }),
        );
        global.eth = {
          contract: sinon.stub().returns({
            at: sinon.stub().returns({
              balanceOf: sinon.stub().returns(undefined),
            }),
          }),
        };
        const store = mockStore(defaultSendAssetState);

        const newSendAsset = {
          type: AssetType.token,
          details: {
            address: 'tokenAddress',
            symbol: 'tokenSymbol',
            decimals: 'tokenDecimals',
          },
        };

        await store.dispatch(updateSendAsset(newSendAsset));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(4);
        expect(actionResult[0].type).toStrictEqual('SHOW_LOADING_INDICATION');
        expect(actionResult[1].type).toStrictEqual('HIDE_LOADING_INDICATION');
        expect(actionResult[2]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload: `sendFlow - user set asset to ERC20 token with symbol TokenSymbol and address tokenAddress`,
        });
        expect(actionResult[3].payload).toStrictEqual({
          asset: {
            type: AssetType.token,
            details: {
              address: 'tokenAddress',
              symbol: 'TokenSymbol',
              decimals: 18,
              standard: 'ERC20',
              balance: '0x0',
            },
            balance: '0x0',
            error: null,
          },
          initialAssetSet: false,
        });
      });

      it('should show ConvertTokenToNFT modal and throw "invalidAssetType" error when token passed in props is an ERC721 or ERC1155', async () => {
        getTokenStandardAndDetailsStub.mockImplementation(() =>
          Promise.resolve({ standard: 'ERC1155', balance: '0x1' }),
        );
        const store = mockStore(defaultSendAssetState);

        const newSendAsset = {
          type: AssetType.token,
          details: {
            address: 'tokenAddress',
            symbol: 'tokenSymbol',
            decimals: 'tokenDecimals',
          },
        };

        await expect(() =>
          store.dispatch(updateSendAsset(newSendAsset)),
        ).rejects.toThrow('invalidAssetType');
        const actionResult = store.getActions();
        expect(actionResult).toHaveLength(3);
        expect(actionResult[0].type).toStrictEqual('SHOW_LOADING_INDICATION');
        expect(actionResult[1].type).toStrictEqual('HIDE_LOADING_INDICATION');
        expect(actionResult[2]).toStrictEqual({
          payload: {
            name: 'CONVERT_TOKEN_TO_NFT',
            tokenAddress: 'tokenAddress',
          },
          type: 'UI_MODAL_OPEN',
        });
      });
    });

    describe('updateRecipientUserInput', () => {
      const updateRecipientUserInputState = {
        metamask: {
          providerConfig: {
            chainId: '',
          },
          tokens: [],
          useTokenDetection: true,
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
              name: 'Chainlink',
              iconUrl: 'https://s3.amazonaws.com/airswap-token-images/LINK.png',
              aggregators: [
                'airswapLight',
                'bancor',
                'cmc',
                'coinGecko',
                'kleros',
                'oneInch',
                'paraswap',
                'pmm',
                'totle',
                'zapper',
                'zerion',
                'zeroEx',
              ],
              occurrences: 12,
            },
          },
          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: [...Object.values(EthMethod)],
                type: EthAccountType.Eoa,
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
        },
        send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
      };

      it('should create actions for updateRecipientUserInput and checks debounce for validation', async () => {
        const store = mockStore(updateRecipientUserInputState);
        const newUserRecipientInput = 'newUserRecipientInput';

        await store.dispatch(updateRecipientUserInput(newUserRecipientInput));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(5);

        expect(actionResult[0].type).toStrictEqual(
          'send/updateRecipientWarning',
        );
        expect(actionResult[0].payload).toStrictEqual('loading');

        expect(actionResult[1].type).toStrictEqual(
          'send/updateDraftTransactionStatus',
        );

        expect(actionResult[2].type).toStrictEqual(
          'send/updateRecipientUserInput',
        );
        expect(actionResult[2].payload).toStrictEqual(newUserRecipientInput);

        expect(actionResult[3]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload: `sendFlow - user typed ${newUserRecipientInput} into recipient input field`,
        });

        expect(actionResult[4].type).toStrictEqual(
          'send/validateRecipientUserInput',
        );
        expect(actionResult[4].payload).toStrictEqual({
          chainId: '',
          tokens: [],
          useTokenDetection: true,
          isProbablyAnAssetContract: false,
          userInput: newUserRecipientInput,
          tokenAddressList: ['0x514910771af9ca656af840dff83e8264ecf986ca'],
        });
      });
    });

    describe('useContactListForRecipientSearch', () => {
      it('should create action to change send recipient search to contact list', async () => {
        const store = mockStore();

        await store.dispatch(useContactListForRecipientSearch());

        const actionResult = store.getActions();
        expect(actionResult).toHaveLength(2);

        expect(actionResult).toStrictEqual([
          {
            type: 'send/addHistoryEntry',
            payload: 'sendFlow - user selected back to all on recipient screen',
          },
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

        expect(actionResult).toHaveLength(2);

        expect(actionResult).toStrictEqual([
          {
            type: 'send/addHistoryEntry',
            payload:
              'sendFlow - user selected transfer to my accounts on recipient screen',
          },
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

      it('should create actions to update recipient', async () => {
        global.eth = {
          getCode: sinon.stub(),
        };

        const updateRecipientState = {
          metamask: {
            addressBook: {},
            identities: {},
            internalAccounts: {
              accounts: {},
              selectedAccount: '',
            },
            providerConfig: {
              chainId: '0x1',
            },
          },
          send: {
            account: {
              balance: '',
            },
            asset: {
              type: '',
            },

            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            userInputHexData: '',
          },
        };

        const store = mockStore(updateRecipientState);

        await store.dispatch(updateRecipient(recipient));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(1);
        expect(actionResult[0].type).toStrictEqual('send/updateRecipient');
      });

      it('should update recipient nickname if the passed address exists in the addressBook state but no nickname param is provided', async () => {
        global.eth = {
          getCode: sinon.stub(),
        };

        const TEST_RECIPIENT_ADDRESS =
          '0x0000000000000000000000000000000000000001';
        const TEST_RECIPIENT_NAME = 'The 1 address';

        const updateRecipientState = {
          metamask: {
            addressBook: {
              '0x1': [
                {
                  address: TEST_RECIPIENT_ADDRESS,
                  name: TEST_RECIPIENT_NAME,
                },
              ],
            },
            providerConfig: {
              chainId: '0x1',
            },
          },
          send: {
            account: {
              balance: '',
            },
            asset: {
              type: '',
            },

            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            userInputHexData: '',
          },
        };

        const store = mockStore(updateRecipientState);

        await store.dispatch(
          updateRecipient({
            address: '0x0000000000000000000000000000000000000001',
            nickname: '',
          }),
        );

        const actionResult = store.getActions();
        expect(actionResult).toHaveLength(1);
        expect(actionResult[0].type).toStrictEqual('send/updateRecipient');
        expect(actionResult[0].payload.address).toStrictEqual(
          TEST_RECIPIENT_ADDRESS,
        );
        expect(actionResult[0].payload.nickname).toStrictEqual(
          TEST_RECIPIENT_NAME,
        );
      });

      it('should create actions to reset recipient input and ens', async () => {
        const tokenState = {
          metamask: {
            addressBook: {},
            identities: {},
            internalAccounts: {
              accounts: {},
              selectedAccount: '',
            },

            selectedAddress: '',
            providerConfig: {
              chainId: '0x1',
            },
          },
          send: {
            account: {
              balance: '',
            },
            asset: {
              type: AssetType.token,
              details: {},
            },

            recipient: {
              address: '',
            },
            amount: {
              value: '',
            },
            userInputHexData: '',
          },
        };

        const store = mockStore(tokenState);

        await store.dispatch(updateRecipient(recipient));

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(1);
        expect(actionResult[0].type).toStrictEqual('send/updateRecipient');
      });
    });

    describe('ResetRecipientInput', () => {
      it('should create actions to reset recipient input and ens then validates input', async () => {
        const updateRecipientState = {
          metamask: {
            addressBook: {},
            identities: {},
            providerConfig: {
              chainId: '',
            },
            tokens: [],
            useTokenDetection: true,
            tokenList: {
              '0x514910771af9ca656af840dff83e8264ecf986ca': {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                symbol: 'LINK',
                decimals: 18,
                name: 'Chainlink',
                iconUrl:
                  'https://s3.amazonaws.com/airswap-token-images/LINK.png',
                aggregators: [
                  'airswapLight',
                  'bancor',
                  'cmc',
                  'coinGecko',
                  'kleros',
                  'oneInch',
                  'paraswap',
                  'pmm',
                  'totle',
                  'zapper',
                  'zerion',
                  'zeroEx',
                ],
                occurrences: 12,
              },
            },
            internalAccounts: {
              accounts: {
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            },
            accounts: {},
          },
          send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
        };

        const store = mockStore(updateRecipientState);

        await store.dispatch(resetRecipientInput());
        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(9);
        expect(actionResult[0]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload: 'sendFlow - user cleared recipient input',
        });
        expect(actionResult[1].type).toStrictEqual(
          'send/updateRecipientWarning',
        );
        expect(actionResult[2].type).toStrictEqual(
          'send/updateDraftTransactionStatus',
        );

        expect(actionResult[3].type).toStrictEqual(
          'send/updateRecipientUserInput',
        );
        expect(actionResult[4].payload).toStrictEqual(
          'sendFlow - user typed  into recipient input field',
        );
        expect(actionResult[5].type).toStrictEqual(
          'send/validateRecipientUserInput',
        );
        expect(actionResult[6].type).toStrictEqual('send/updateRecipient');
        expect(actionResult[7].type).toStrictEqual('DNS/resetDomainResolution');
        expect(actionResult[8].type).toStrictEqual(
          'send/validateRecipientUserInput',
        );
      });
    });

    describe('UpdateSendHexData', () => {
      const sendHexDataState = {
        send: getInitialSendStateWithExistingTxState({
          asset: {
            type: '',
          },
        }),
      };

      it('should create action to update hexData', async () => {
        const hexData = '0x1';
        const store = mockStore(sendHexDataState);

        await store.dispatch(updateSendHexData(hexData));

        const actionResult = store.getActions();

        const expectActionResult = [
          {
            type: 'send/addHistoryEntry',
            payload: 'sendFlow - user added custom hexData 0x1',
          },
          { type: 'send/updateUserInputHexData', payload: hexData },
        ];

        expect(actionResult).toHaveLength(2);
        expect(actionResult).toStrictEqual(expectActionResult);
      });
    });

    describe('ToggleSendMaxMode', () => {
      it('should create actions to toggle update max mode when send amount mode is not max', async () => {
        const sendMaxModeState = {
          send: {
            asset: {
              type: AssetType.token,
              details: {},
            },

            recipient: {
              address: '',
            },
            amount: {
              mode: '',
              value: '',
            },
            userInputHexData: '',
          },
          metamask: {
            providerConfig: {
              chainId: CHAIN_IDS.GOERLI,
            },
          },
        };

        const store = mockStore(sendMaxModeState);

        await store.dispatch(toggleSendMaxMode());

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(3);
        expect(actionResult[0].type).toStrictEqual('send/updateAmountMode');
        expect(actionResult[1].type).toStrictEqual('send/updateAmountToMax');
        expect(actionResult[2]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload: 'sendFlow - user toggled max mode on',
        });
      });

      it('should create actions to toggle off max mode when send amount mode is max', async () => {
        const sendMaxModeState = {
          send: {
            ...getInitialSendStateWithExistingTxState({
              asset: {
                type: AssetType.token,
                details: {},
              },

              recipient: {
                address: '',
              },
              amount: {
                value: '',
              },
              userInputHexData: '',
            }),
            amountMode: AMOUNT_MODES.MAX,
          },
          metamask: {
            providerConfig: {
              chainId: CHAIN_IDS.GOERLI,
            },
            internalAccounts: {
              accounts: {
                'mock-id': {
                  address: '0x0',
                  id: 'mock-id',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'mock-id',
            },
            accounts: {},
          },
        };
        const store = mockStore(sendMaxModeState);

        await store.dispatch(toggleSendMaxMode());

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(3);
        expect(actionResult[0].type).toStrictEqual('send/updateAmountMode');
        expect(actionResult[1].type).toStrictEqual('send/updateSendAmount');
        expect(actionResult[2]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload: 'sendFlow - user toggled max mode off',
        });
      });
    });

    describe('SignTransaction', () => {
      const signTransactionState = {
        send: getInitialSendStateWithExistingTxState({
          id: 1,
          asset: {},
          recipient: {},
          amount: {},
        }),
      };

      it('should show confirm tx page when no other conditions for signing have been met', async () => {
        const store = mockStore(signTransactionState);

        await store.dispatch(signTransaction());

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(3);
        expect(actionResult[0]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload:
            'sendFlow - user clicked next and transaction should be added to controller',
        });
        expect(actionResult[1].type).toStrictEqual('SHOW_CONF_TX_PAGE');
      });

      describe('with token transfers', () => {
        it('should pass the correct transaction parameters to addTransactionAndRouteToConfirmationPage', async () => {
          const tokenTransferTxState = {
            metamask: {
              providerConfig: {
                chainId: CHAIN_IDS.GOERLI,
              },
              transactions: [
                {
                  id: 1,
                  chainId: CHAIN_IDS.GOERLI,
                  status: 'unapproved',
                  txParams: {
                    value: 'oldTxValue',
                  },
                },
              ],
            },
            send: {
              ...getInitialSendStateWithExistingTxState({
                id: 1,
                asset: {
                  details: {
                    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                  },
                  type: 'TOKEN',
                },
                recipient: {
                  address: '4F90e18605Fd46F9F9Fab0e225D88e1ACf5F5324',
                },
                amount: {
                  value: '0x1',
                },
              }),
              stage: SEND_STAGES.DRAFT,
              selectedAccount: {
                address: '0x6784e8507A1A46443f7bDc8f8cA39bdA92A675A6',
              },
            },
          };

          jest.mock('../../store/actions.ts');

          const store = mockStore(tokenTransferTxState);

          await store.dispatch(signTransaction());

          expect(
            addTransactionAndRouteToConfirmationPageStub.mock.calls[0][0].data,
          ).toStrictEqual(
            '0xa9059cbb0000000000000000000000004f90e18605fd46f9f9fab0e225d88e1acf5f53240000000000000000000000000000000000000000000000000000000000000001',
          );
          expect(
            addTransactionAndRouteToConfirmationPageStub.mock.calls[0][0].to,
          ).toStrictEqual('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
        });
      });

      it('should create actions for updateTransaction rejecting', async () => {
        const editStageSignTxState = {
          metamask: {
            providerConfig: {
              chainId: '0x1',
            },
            transactions: [
              {
                id: 1,
                chainId: '0x1',
                status: 'unapproved',
                txParams: {
                  value: 'oldTxValue',
                },
              },
            ],
          },
          send: {
            ...signTransactionState.send,
            stage: SEND_STAGES.EDIT,
          },
        };

        jest.mock('../../store/actions.ts');

        const store = mockStore(editStageSignTxState);

        await store.dispatch(signTransaction());

        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(3);
        expect(actionResult[0]).toMatchObject({
          type: 'send/addHistoryEntry',
          payload:
            'sendFlow - user clicked next and transaction should be updated in controller',
        });
        expect(actionResult[1].type).toStrictEqual(
          'UPDATE_TRANSACTION_EDITABLE_PARAMS',
        );
      });
    });

    describe('editExistingTransaction', () => {
      it('should set up the appropriate state for editing a native asset transaction', async () => {
        const editTransactionState = {
          metamask: {
            providerConfig: {
              chainId: CHAIN_IDS.GOERLI,
            },
            tokens: [],
            addressBook: {
              [CHAIN_IDS.GOERLI]: {},
            },
            identities: {
              [mockAddress1]: {},
            },
            internalAccounts: {
              accounts: {
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                  address: mockAddress1,
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            },
            accounts: {
              [mockAddress1]: {
                address: mockAddress1,
                balance: '0x0',
              },
            },
            accountsByChainId: {
              [CHAIN_IDS.GOERLI]: {
                [mockAddress1]: { balance: '0x0' },
              },
            },
            tokenList: {},
            transactions: [
              {
                id: 1,
                chainId: CHAIN_IDS.GOERLI,
                status: 'unapproved',
                txParams: {
                  data: '',
                  from: mockAddress1,
                  to: '0xRecipientAddress',
                  value: '0xde0b6b3a7640000', // 1000000000000000000,
                },
              },
            ],
          },
          send: {
            // We are going to remove this transaction as a part of the flow,
            // but we need this stub to have the fromAccount because for our
            // action checker the state isn't actually modified after each
            // action is ran.
            ...getInitialSendStateWithExistingTxState({
              id: 1,
              fromAccount: {
                address: mockAddress1,
              },
            }),
          },
          confirmTransaction: {
            maxValueMode: {},
          },
        };

        const store = mockStore(editTransactionState);

        await store.dispatch(editExistingTransaction(AssetType.native, 1));
        const actionResult = store.getActions();

        expect(actionResult).toHaveLength(6);
        expect(actionResult[0]).toMatchObject({
          type: 'send/clearPreviousDrafts',
        });
        expect(actionResult[1]).toStrictEqual({
          type: 'send/addNewDraft',
          payload: {
            amount: {
              value: '0xde0b6b3a7640000',
              error: null,
            },
            asset: {
              balance: '0x0',
              details: null,
              error: null,
              type: AssetType.native,
            },
            fromAccount: {
              address: mockAddress1,
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [...Object.values(EthMethod)],
              type: EthAccountType.Eoa,
              balance: '0x0',
            },
            history: ['sendFlow - user clicked edit on transaction with id 1'],
            id: 1,
            recipient: {
              address: '0xRecipientAddress',
              error: null,
              nickname: '0xRecipientAddress',
              warning: null,
              recipientWarningAcknowledged: false,
              type: '',
            },
            status: SEND_STATUSES.VALID,
            transactionType: '0x0',
            userInputHexData: '',
          },
        });

        const action = actionResult[1];

        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.currentTransactionUUID).not.toStrictEqual('test-uuid');

        const draftTransaction =
          result.draftTransactions[result.currentTransactionUUID];

        expect(draftTransaction.amount.value).toStrictEqual(
          action.payload.amount.value,
        );
      });

      it('should set up the appropriate state for editing an NFT asset transaction', async () => {
        getTokenStandardAndDetailsStub.mockImplementation(() =>
          Promise.resolve({
            standard: 'ERC721',
            balance: '0x1',
            address: '0xNftAddress',
          }),
        );
        const editTransactionState = {
          metamask: {
            selectedAddress: '',
            providerConfig: {
              chainId: CHAIN_IDS.GOERLI,
            },
            tokens: [],
            addressBook: {
              [CHAIN_IDS.GOERLI]: {},
            },
            identities: {
              [mockAddress1]: {},
            },
            accounts: {
              [mockAddress1]: {
                address: mockAddress1,
                balance: '0x0',
              },
            },
            internalAccounts: {
              accounts: {
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                  address: mockAddress1,
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  metadata: {
                    name: 'Test Account',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
                },
              },
              selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            },
            accountsByChainId: {
              [CHAIN_IDS.GOERLI]: {
                [mockAddress1]: { balance: '0x0' },
              },
            },
            tokenList: {},
            transactions: [
              {
                id: 1,
                chainId: CHAIN_IDS.GOERLI,
                status: 'unapproved',
                txParams: {
                  data: generateERC721TransferData({
                    toAddress: BURN_ADDRESS,
                    fromAddress: mockAddress1,
                    tokenId: BigNumber.from(15000).toString(),
                  }),
                  from: mockAddress1,
                  to: '0xNftAddress',
                  value: '0x0',
                },
              },
            ],
          },
          send: {
            ...getInitialSendStateWithExistingTxState({
              id: 1,
              test: 'wow',
            }),
            stage: SEND_STAGES.EDIT,
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

        await store.dispatch(editExistingTransaction(AssetType.NFT, 1));
        const actionResult = store.getActions();
        expect(actionResult).toHaveLength(8);
        expect(actionResult[0]).toMatchObject({
          type: 'send/clearPreviousDrafts',
        });
        expect(actionResult[1]).toStrictEqual({
          type: 'send/addNewDraft',
          payload: {
            amount: {
              error: null,
              value: '0x1',
            },
            asset: {
              balance: '0x0',
              details: null,
              error: null,
              type: AssetType.native,
            },
            fromAccount: {
              address: mockAddress1,
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [...Object.values(EthMethod)],
              type: EthAccountType.Eoa,
              balance: '0x0',
            },
            history: ['sendFlow - user clicked edit on transaction with id 1'],
            id: 1,
            recipient: {
              address: BURN_ADDRESS,
              error: null,
              nickname: BURN_ADDRESS,
              warning: null,
              type: '',
              recipientWarningAcknowledged: false,
            },
            status: SEND_STATUSES.VALID,
            transactionType: '0x0',
            userInputHexData:
              editTransactionState.metamask.transactions[0].txParams.data,
          },
        });
        expect(actionResult[2].type).toStrictEqual('SHOW_LOADING_INDICATION');
        expect(actionResult[3].type).toStrictEqual('HIDE_LOADING_INDICATION');
        expect(actionResult[4]).toStrictEqual({
          type: 'send/addHistoryEntry',
          payload:
            'sendFlow - user set asset to NFT with tokenId 15000 and address 0xNftAddress',
        });
        expect(actionResult[5]).toStrictEqual({
          type: 'send/updateAsset',
          payload: {
            asset: {
              balance: '0x1',
              details: {
                address: '0xNftAddress',
                balance: '0x1',
                standard: TokenStandard.ERC721,
                tokenId: '15000',
              },
              error: null,
              type: AssetType.NFT,
            },
            initialAssetSet: true,
          },
        });
        expect(actionResult[6].type).toStrictEqual(
          'send/initializeSendState/pending',
        );
        expect(actionResult[7].type).toStrictEqual(
          'send/initializeSendState/fulfilled',
        );

        const action = actionResult[1];

        const result = sendReducer(
          INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          action,
        );

        expect(result.currentTransactionUUID).not.toStrictEqual('test-uuid');
      });
    });

    it('should set up the appropriate state for editing a token asset transaction', async () => {
      const editTransactionState = {
        metamask: {
          selectedAddress: '',
          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                address: mockAddress1,
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                options: {},
                methods: [...Object.values(EthMethod)],
                type: EthAccountType.Eoa,
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
          },
          tokens: [
            {
              address: '0xTokenAddress',
              symbol: 'SYMB',
            },
          ],
          tokenList: {
            '0xTokenAddress': {
              symbol: 'SYMB',
              address: '0xTokenAddress',
            },
          },
          addressBook: {
            [CHAIN_IDS.GOERLI]: {},
          },
          identities: {
            [mockAddress1]: {},
          },
          accounts: {
            [mockAddress1]: {
              address: mockAddress1,
              balance: '0x0',
            },
          },
          accountsByChainId: {
            [CHAIN_IDS.GOERLI]: {
              [mockAddress1]: { balance: '0x0' },
            },
          },
          transactions: [
            {
              id: 1,
              chainId: CHAIN_IDS.GOERLI,
              status: 'unapproved',
              txParams: {
                data: generateERC20TransferData({
                  toAddress: BURN_ADDRESS,
                  amount: '0x3a98',
                  sendToken: {
                    address: '0xTokenAddress',
                    symbol: 'SYMB',
                    decimals: 18,
                  },
                }),
                from: mockAddress1,
                to: '0xTokenAddress',
                value: '0x0',
              },
            },
          ],
        },
        send: {
          ...getInitialSendStateWithExistingTxState({
            id: 1,
            recipient: {
              address: 'Address',
              nickname: 'NickName',
            },
          }),
          selectedAccount: {
            address: mockAddress1,
            balance: '0x0',
          },
          stage: SEND_STAGES.EDIT,
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

      await store.dispatch(editExistingTransaction(AssetType.token, 1));
      const actionResult = store.getActions();

      expect(actionResult).toHaveLength(8);
      expect(actionResult[0].type).toStrictEqual('send/clearPreviousDrafts');
      expect(actionResult[1]).toStrictEqual({
        type: 'send/addNewDraft',
        payload: {
          amount: {
            error: null,
            value: '0x3a98',
          },
          asset: {
            balance: '0x0',
            details: null,
            error: null,
            type: AssetType.native,
          },
          fromAccount: {
            address: mockAddress1,
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
            balance: '0x0',
          },
          history: ['sendFlow - user clicked edit on transaction with id 1'],
          id: 1,
          recipient: {
            address: BURN_ADDRESS,
            error: null,
            warning: null,
            nickname: BURN_ADDRESS,
            type: '',
            recipientWarningAcknowledged: false,
          },
          status: SEND_STATUSES.VALID,
          transactionType: '0x0',
          userInputHexData:
            editTransactionState.metamask.transactions[0].txParams.data,
        },
      });
      expect(actionResult[2].type).toStrictEqual('SHOW_LOADING_INDICATION');
      expect(actionResult[3].type).toStrictEqual('HIDE_LOADING_INDICATION');
      expect(actionResult[4]).toMatchObject({
        type: 'send/addHistoryEntry',
        payload:
          'sendFlow - user set asset to ERC20 token with symbol SYMB and address 0xTokenAddress',
      });
      expect(actionResult[5]).toStrictEqual({
        type: 'send/updateAsset',
        payload: {
          asset: {
            balance: '0x0',
            type: AssetType.token,
            error: null,
            details: {
              balance: '0x0',
              address: '0xTokenAddress',
              decimals: 18,
              symbol: 'SYMB',
              standard: 'ERC20',
            },
          },
          initialAssetSet: true,
        },
      });
      expect(actionResult[6].type).toStrictEqual(
        'send/initializeSendState/pending',
      );
      expect(actionResult[7].type).toStrictEqual(
        'send/initializeSendState/fulfilled',
      );

      const action = actionResult[1];

      const result = sendReducer(INITIAL_SEND_STATE_FOR_EXISTING_DRAFT, action);

      expect(result.currentTransactionUUID).not.toStrictEqual('test-uuid');
    });
  });

  describe('selectors', () => {
    describe('asset selectors', () => {
      it('has a selector to get the asset', () => {
        expect(
          getSendAsset({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toMatchObject(
          getTestUUIDTx(INITIAL_SEND_STATE_FOR_EXISTING_DRAFT).asset,
        );
      });

      it('has a selector to get the asset address', () => {
        expect(
          getSendAssetAddress({
            send: getInitialSendStateWithExistingTxState({
              asset: {
                balance: '0x0',
                details: { address: '0x0' },
                type: AssetType.token,
              },
            }),
          }),
        ).toBe('0x0');
      });

      it('has a selector that determines if asset is sendable based on ERC721 status', () => {
        expect(
          getIsAssetSendable({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toBe(true);
        expect(
          getIsAssetSendable({
            send: getInitialSendStateWithExistingTxState({
              asset: {
                type: AssetType.token,
                details: { isERC721: true },
              },
            }),
          }),
        ).toBe(false);
      });
    });

    describe('amount selectors', () => {
      it('has a selector to get send amount', () => {
        expect(
          getSendAmount({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toBe('0x0');
      });

      it('has a selector to get max mode state', () => {
        expect(
          getSendMaxModeState({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toBe(false);
        expect(
          getSendMaxModeState({
            send: {
              ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
              amountMode: AMOUNT_MODES.MAX,
            },
          }),
        ).toBe(true);
      });

      it('has a selector to get the draft transaction ID', () => {
        expect(
          getDraftTransactionID({
            send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          }),
        ).toBeNull();
        expect(
          getDraftTransactionID({
            send: getInitialSendStateWithExistingTxState({
              id: 'ID',
            }),
          }),
        ).toBe('ID');
      });

      it('has a selector to get the user entered hex data', () => {
        expect(
          getSendHexData({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toBeNull();
        expect(
          getSendHexData({
            send: getInitialSendStateWithExistingTxState({
              userInputHexData: '0x0',
            }),
          }),
        ).toBe('0x0');
      });

      it('has a selector to get if there is an amount error', () => {
        expect(
          sendAmountIsInError({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toBe(false);
        expect(
          sendAmountIsInError({
            send: getInitialSendStateWithExistingTxState({
              amount: { error: 'any' },
            }),
          }),
        ).toBe(true);
      });
    });

    describe('recipient selectors', () => {
      it('has a selector to get recipient address', () => {
        expect(
          getSendTo({
            send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
            metamask: {
              ensResolutionsByAddress: {},
              identities: {},
              internalAccounts: {
                accounts: {},
                selectedAccount: '',
              },
              addressBook: {},
              providerConfig: {
                chainId: '0x5',
              },
            },
          }),
        ).toBe('');
        expect(
          getSendTo({
            send: getInitialSendStateWithExistingTxState({
              recipient: { address: '0xb' },
            }),
            metamask: {
              ensResolutionsByAddress: {},
              addressBook: {},
              identities: {},
              internalAccounts: {
                accounts: {},
                selectedAccount: '',
              },
              providerConfig: {
                chainId: '0x5',
              },
            },
          }),
        ).toBe('0xb');
      });

      it('has a selector to check if using the my accounts option for recipient selection', () => {
        expect(
          getIsUsingMyAccountForRecipientSearch({
            send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          }),
        ).toBe(false);
        expect(
          getIsUsingMyAccountForRecipientSearch({
            send: {
              ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
              recipientMode: RECIPIENT_SEARCH_MODES.MY_ACCOUNTS,
            },
          }),
        ).toBe(true);
      });

      it('has a selector to get recipient user input in input field', () => {
        expect(
          getRecipientUserInput({
            send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          }),
        ).toBe('');
        expect(
          getRecipientUserInput({
            send: {
              ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
              recipientInput: 'domain.eth',
            },
          }),
        ).toBe('domain.eth');
      });

      it('has a selector to get recipient state', () => {
        expect(
          getRecipient({
            send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
            metamask: {
              ensResolutionsByAddress: {},
              identities: {},
              internalAccounts: {
                accounts: {},
                selectedAccount: '',
              },
              addressBook: {},
              providerConfig: {
                chainId: '0x5',
              },
            },
          }),
        ).toMatchObject(
          getTestUUIDTx(INITIAL_SEND_STATE_FOR_EXISTING_DRAFT).recipient,
        );
      });
    });

    describe('send validity selectors', () => {
      it('has a selector to get send errors', () => {
        expect(
          getSendErrors({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toMatchObject({
          amount: null,
        });
        expect(
          getSendErrors({
            send: getInitialSendStateWithExistingTxState({
              amount: {
                error: 'amountTest',
              },
            }),
          }),
        ).toMatchObject({ amount: 'amountTest' });
      });

      it('has a selector to get send state initialization status', () => {
        expect(
          isSendStateInitialized({
            send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          }),
        ).toBe(false);
        expect(
          isSendStateInitialized({
            send: {
              ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
              stage: SEND_STATUSES.ADD_RECIPIENT,
            },
          }),
        ).toBe(true);
      });

      it('has a selector to get send state validity', () => {
        expect(
          isSendFormInvalid({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toBe(false);
        expect(
          isSendFormInvalid({
            send: getInitialSendStateWithExistingTxState({
              status: SEND_STATUSES.INVALID,
            }),
          }),
        ).toBe(true);
      });

      it('has a selector to get send stage', () => {
        expect(
          getSendStage({ send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT }),
        ).toBe(SEND_STAGES.INACTIVE);
        expect(
          getSendStage({
            send: {
              ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
              stage: SEND_STAGES.ADD_RECIPIENT,
            },
          }),
        ).toBe(SEND_STAGES.ADD_RECIPIENT);
      });
    });
  });
});
