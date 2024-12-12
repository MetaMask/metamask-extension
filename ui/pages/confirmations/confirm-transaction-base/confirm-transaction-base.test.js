import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';

import { EthAccountType } from '@metamask/keyring-api';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { act } from 'react-dom/test-utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../store/background-connection';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import { KeyringType } from '../../../../shared/constants/keyring';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { domainInitialState } from '../../../ducks/domains';

import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { defaultBuyableChains } from '../../../ducks/ramps/constants';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { mockNetworkState } from '../../../../test/stub/networks';
import ConfirmTransactionBase from './confirm-transaction-base.container';

jest.mock('../components/simulation-details/useSimulationMetrics');

const middleware = [thunk];

setBackgroundConnection({
  gasFeeStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest.fn().mockImplementation(() =>
    Promise.resolve({
      chainId: '0x5',
    }),
  ),
  getGasFeeTimeEstimate: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
  updateTransaction: jest.fn(),
  getLastInteractedConfirmationInfo: jest.fn(),
});

const mockTxParamsFromAddress = '0x123456789';

const mockTxParamsToAddress = '0x85c1685cfceaa5c0bdb1609fc536e9a8387dd65e';
const mockMaliciousToAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const mockTxParamsToAddressConcat = '0x85c16...DD65e';

const mockParsedTxDataToAddressWithout0x =
  'e57e7847fd3661a9b7c86aaf1daea08d9da5750a';
const mockParsedTxDataToAddress = '0xe57E7...5750A';

const mockPropsToAddress = '0x33m1685cfceaa5c0bdb1609fc536e9a8387dd567';
const mockPropsToAddressConcat = '0x33m16...dd567';

const mockTxParams = {
  from: mockTxParamsFromAddress,
  to: mockTxParamsToAddress,
  value: '0x5af3107a4000',
  gas: '0x5208',
  maxFeePerGas: '0x59682f16',
  maxPriorityFeePerGas: '0x59682f00',
  type: '0x2',
  data: `0xa22cb465000000000000000000000000${mockParsedTxDataToAddressWithout0x}0000000000000000000000000000000000000000000000000000000000000001`,
};

const baseStore = {
  send: {
    ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
    currentTransactionUUID: null,
    draftTransactions: {},
  },
  DNS: domainInitialState,
  gas: {
    customData: { limit: null, price: null },
  },
  history: { mostRecentOverviewPage: '/' },
  metamask: {
    transactions: [
      {
        id: 1,
        chainId: '0x5',
        txParams: { ...mockTxParams },
        status: 'unapproved',
        simulationData: {},
      },
    ],
    gasEstimateType: GasEstimateTypes.legacy,
    gasFeeEstimates: {
      low: '0',
      medium: '1',
      fast: '2',
    },
    keyrings: [
      {
        type: KeyringType.hdKeyTree,
        accounts: ['0x0'],
      },
    ],
    ...mockNetworkState({
      chainId: CHAIN_IDS.GOERLI,
    }),
    tokens: [],
    preferences: {},
    currentCurrency: 'USD',
    currencyRates: {},
    featureFlags: {
      sendHexData: false,
    },
    addressBook: {
      [CHAIN_IDS.GOERLI]: [],
    },
    accountsByChainId: {
      [CHAIN_IDS.GOERLI]: {},
    },
    accounts: {
      [mockTxParamsFromAddress]: {
        balance: '0x0',
        address: mockTxParamsFromAddress,
      },
    },
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: mockTxParamsFromAddress,
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Account 1',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: ETH_EOA_METHODS,
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    pendingApprovals: {
      '741bad30-45b6-11ef-b6ec-870d18dd6c01': {
        id: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
        origin: 'http://127.0.0.1:8080',
        type: 'transaction',
        time: 1721383540624,
        requestData: {
          txId: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
        },
        requestState: null,
        expectsResult: true,
      },
    },
    tokenAddress: '0x32e6c34cd57087abbd59b5a4aecc4cb495924356',
    tokenList: {},
    ensResolutionsByAddress: {},
    snaps: {},
    useNonceField: true,
    customNonceValue: '70',
  },
  confirmTransaction: {
    txData: {
      id: 1,
      txParams: { ...mockTxParams },
      time: 1675012496170,
      status: TransactionStatus.unapproved,
      originalGasEstimate: '0x5208',
      userEditedGasLimit: false,
      chainId: '0x5',
      loadingDefaults: false,
      dappSuggestedGasFees: null,
      sendFlowHistory: [],
      origin: 'metamask',
      actionId: 1675012496153.2039,
      type: 'simpleSend',
      history: [],
      userFeeLevel: 'medium',
      defaultGasEstimates: {
        estimateType: 'medium',
        gas: '0x5208',
        maxFeePerGas: '0x59682f16',
        maxPriorityFeePerGas: '0x59682f00',
      },
    },
    tokenData: {},
    tokenProps: {},
    fiatTransactionAmount: '0.16',
    fiatTransactionFee: '0',
    fiatTransactionTotal: '0.16',
    ethTransactionAmount: '0.0001',
    ethTransactionFee: '0',
    ethTransactionTotal: '0.0001',
    hexTransactionAmount: '0x5af3107a4000',
    hexTransactionFee: '0x0',
    hexTransactionTotal: '0x5af3107a4000',
    nonce: '',
  },
  appState: {
    sendInputCurrencySwitched: false,
  },
  ramps: {
    buyableChains: defaultBuyableChains,
  },
};

const mockedStoreWithConfirmTxParams = (
  store,
  _mockTxParams = mockTxParams,
) => {
  const [firstTx, ...restTxs] = store.metamask.transactions;

  return {
    ...store,
    metamask: {
      ...store.metamask,
      transactions: [
        {
          ...firstTx,
          txParams: {
            ..._mockTxParams,
          },
        },
        ...restTxs,
      ],
    },
    confirmTransaction: {
      ...store.confirmTransaction,
      txData: {
        ...store.confirmTransaction.txData,
        txParams: {
          ..._mockTxParams,
        },
      },
    },
  };
};

const sendToRecipientSelector =
  '.sender-to-recipient__party--recipient .sender-to-recipient__name';

const render = async ({ props, state } = {}) => {
  const store = configureMockStore(middleware)({
    ...baseStore,
    ...state,
  });

  const componentProps = {
    actionKey: 'confirm',
    ...props,
  };

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <ConfirmTransactionBase {...componentProps} />,
        store,
      )),
  );

  return result;
};

describe('Confirm Transaction Base', () => {
  it('should match snapshot', async () => {
    const state = {
      ...baseStore,
      metamask: {
        ...baseStore.metamask,
        ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI, ticker: undefined }),
      },
    };

    const { container } = await render({ state });
    expect(container).toMatchSnapshot();
  });

  it('should not contain L1 L2 fee details for chains that are not optimism', async () => {
    const { queryByText } = await render();

    expect(queryByText('Layer 1 fees')).not.toBeInTheDocument();
    expect(queryByText('Layer 2 gas fee')).not.toBeInTheDocument();
  });

  it('should render only total fee details if simulation fails', async () => {
    const state = {
      send: {
        ...baseStore.send,
        hasSimulationError: true,
      },
      metamask: {
        ...baseStore.metamask,
        transactions: [
          {
            ...baseStore.metamask.transactions[0],
            simulationData: { error: {} },
          },
        ],
      },
    };

    const { queryByText } = await render({ state });

    expect(queryByText('Total')).toBeInTheDocument();
    expect(queryByText('Amount + gas fee')).toBeInTheDocument();

    expect(queryByText('Estimated fee')).not.toBeInTheDocument();
  });

  it('renders blockaid security alert if recipient is a malicious address', async () => {
    const state = {
      send: {
        ...baseStore.send,
        hasSimulationError: false,
      },
      confirmTransaction: {
        ...baseStore.confirmTransaction,
        txData: {
          ...baseStore.confirmTransaction.txData,
          txParams: {
            ...baseStore.confirmTransaction.txData.txParams,
            to: mockMaliciousToAddress,
          },
          securityAlertResponse: {
            reason: BlockaidReason.maliciousDomain,
            result_type: BlockaidResultType.Malicious,
            features: [],
          },
        },
      },
    };

    const { getByTestId } = await render({ state });

    const securityProviderBanner = getByTestId(
      'security-provider-banner-alert',
    );
    expect(securityProviderBanner).toBeInTheDocument();
  });

  it('should estimated fee details for optimism', async () => {
    const state = {
      metamask: {
        ...baseStore.metamask,
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
      },

      confirmTransaction: {
        ...baseStore.confirmTransaction,
        txData: {
          ...baseStore.confirmTransaction.txData,
          chainId: CHAIN_IDS.OPTIMISM,
          layer1GasFee: '0x1',
        },
      },
    };

    const { queryByText } = await render({ state });

    expect(queryByText('Estimated fee')).not.toBeInTheDocument();
  });

  it('should render NoteToTrader when isNoteToTraderSupported is true', async () => {
    const state = {
      metamask: {
        ...baseStore.metamask,
        custodyAccountDetails: {
          [mockTxParamsFromAddress]: {
            address: mockTxParamsFromAddress,
            details: 'details',
            custodyType: 'testCustody - Saturn',
            custodianName: 'saturn-dev',
          },
        },
        mmiConfiguration: {
          custodians: [
            {
              envName: 'saturn-dev',
              displayName: 'Saturn Custody',
              isNoteToTraderSupported: true,
            },
          ],
        },
      },
    };

    const { getByTestId } = await render({ state });

    expect(getByTestId('note-tab')).toBeInTheDocument();
  });

  it('handleMMISubmit calls sendTransaction correctly when isNoteToTraderSupported is false', async () => {
    const state = {
      appState: {
        ...baseStore.appState,
        gasLoadingAnimationIsShowing: false,
      },
      confirmTransaction: {
        ...baseStore.confirmTransaction,
        txData: {
          ...baseStore.confirmTransaction.txData,
          custodyStatus: true,
        },
      },
      metamask: {
        ...baseStore.metamask,
        accounts: {
          [mockTxParamsFromAddress]: {
            balance: '0x1000000000000000000',
            address: mockTxParamsFromAddress,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        ...mockNetworkState({
          chainId: CHAIN_IDS.GOERLI,
          metadata: { EIPS: { 1559: true } },
        }),
        customGas: {
          gasLimit: '0x5208',
          gasPrice: '0x59682f00',
        },
        noGasPrice: false,
        keyrings: [
          {
            type: 'Custody',
            accounts: ['0x123456789'],
          },
        ],
        custodyAccountDetails: {
          [mockTxParamsFromAddress]: {
            address: mockTxParamsFromAddress,
            details: 'details',
            custodyType: 'testCustody - Saturn',
            custodianName: 'saturn-dev',
          },
        },
        mmiConfiguration: {
          custodians: [
            {
              envName: 'saturn-dev',
              displayName: 'Saturn Custody',
              isNoteToTraderSupported: false,
            },
          ],
        },
      },
      send: {
        ...baseStore.send,
        gas: {
          ...baseStore.send.gas,
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '0',
            medium: '1',
            high: '2',
          },
        },
        hasSimulationError: false,
        userAcknowledgedGasMissing: false,
        submitting: false,
        hardwareWalletRequiresConnection: false,
        gasIsLoading: false,
        gasFeeIsCustom: true,
      },
    };

    const sendTransaction = jest
      .fn()
      .mockResolvedValue(state.confirmTransaction.txData);
    const updateTransactionValue = jest.fn().mockResolvedValue();
    const showCustodianDeepLink = jest.fn();
    const setWaitForConfirmDeepLinkDialog = jest.fn();

    const props = {
      sendTransaction,
      updateTransactionValue,
      showCustodianDeepLink,
      setWaitForConfirmDeepLinkDialog,
      toAddress: mockPropsToAddress,
      toAccounts: [{ address: mockPropsToAddress }],
      isMainBetaFlask: false,
    };

    const { getByTestId } = await render({ props, state });

    const confirmButton = getByTestId('page-container-footer-next');

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(sendTransaction).toHaveBeenCalled();
  });

  it('handleMMISubmit calls sendTransaction correctly and then showCustodianDeepLink', async () => {
    const state = {
      ...baseStore,
      appState: {
        ...baseStore.appState,
        gasLoadingAnimationIsShowing: false,
      },
      confirmTransaction: {
        ...baseStore.confirmTransaction,
        txData: {
          ...baseStore.confirmTransaction.txData,
          custodyStatus: true,
        },
      },
      metamask: {
        ...baseStore.metamask,
        accounts: {
          [mockTxParamsFromAddress]: {
            balance: '0x1000000000000000000',
            address: mockTxParamsFromAddress,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        ...mockNetworkState({
          chainId: CHAIN_IDS.GOERLI,
          metadata: { EIPS: { 1559: true } },
        }),
        customGas: {
          gasLimit: '0x5208',
          gasPrice: '0x59682f00',
        },
        noGasPrice: false,
        keyrings: [
          {
            type: 'Custody',
            accounts: [mockTxParamsFromAddress],
          },
        ],
        custodyAccountDetails: {
          [mockTxParamsFromAddress]: {
            address: mockTxParamsFromAddress,
            details: 'details',
            custodyType: 'testCustody - Saturn',
            custodianName: 'saturn-dev',
          },
        },
        mmiConfiguration: {
          custodians: [
            {
              envName: 'saturn-dev',
              displayName: 'Saturn Custody',
              isNoteToTraderSupported: false,
            },
          ],
        },
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: mockTxParamsFromAddress,
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Custody Account A',
                keyring: {
                  type: 'Custody',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
        pendingApprovals: {
          '741bad30-45b6-11ef-b6ec-870d18dd6c01': {
            id: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            origin: 'http://127.0.0.1:8080',
            type: 'transaction',
            time: 1721383540624,
            requestData: {
              txId: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            },
            requestState: null,
            expectsResult: true,
          },
        },
      },
      send: {
        ...baseStore.send,
        gas: {
          ...baseStore.send.gas,
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '0',
            medium: '1',
            high: '2',
          },
        },
        hasSimulationError: false,
        userAcknowledgedGasMissing: false,
        submitting: false,
        hardwareWalletRequiresConnection: false,
        gasIsLoading: false,
        gasFeeIsCustom: true,
      },
    };

    const sendTransaction = jest
      .fn()
      .mockResolvedValue(state.confirmTransaction.txData);
    const showCustodianDeepLink = jest.fn();
    const setWaitForConfirmDeepLinkDialog = jest.fn();

    const props = {
      sendTransaction,
      showCustodianDeepLink,
      setWaitForConfirmDeepLinkDialog,
      toAddress: mockPropsToAddress,
      toAccounts: [{ address: mockPropsToAddress }],
      isMainBetaFlask: false,
    };

    const { getByTestId } = await render({ props, state });

    const confirmButton = getByTestId('page-container-footer-next');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    expect(setWaitForConfirmDeepLinkDialog).toHaveBeenCalled();
    await expect(sendTransaction).toHaveBeenCalled();
    expect(showCustodianDeepLink).toHaveBeenCalled();
  });

  it('should append #smartTransaction to txData.origin when smartTransactionsOptInStatus and currentChainSupportsSmartTransactions are true', async () => {
    const state = {
      appState: {
        ...baseStore.appState,
        gasLoadingAnimationIsShowing: false,
      },
      confirmTransaction: {
        ...baseStore.confirmTransaction,
        txData: {
          ...baseStore.confirmTransaction.txData,
          custodyStatus: true,
          origin: 'metamask#smartTransaction',
        },
      },
      metamask: {
        ...baseStore.metamask,
        accounts: {
          [mockTxParamsFromAddress]: {
            balance: '0x1000000000000000000',
            address: mockTxParamsFromAddress,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        ...mockNetworkState({
          chainId: CHAIN_IDS.GOERLI,
          metadata: { EIPS: { 1559: true } },
        }),
        customGas: {
          gasLimit: '0x5208',
          gasPrice: '0x59682f00',
        },
        noGasPrice: false,
        keyrings: [
          {
            type: 'Custody',
            accounts: [mockTxParamsFromAddress],
          },
        ],
        custodyAccountDetails: {
          [mockTxParamsFromAddress]: {
            address: mockTxParamsFromAddress,
            details: 'details',
            custodyType: 'testCustody - Saturn',
            custodianName: 'saturn-dev',
          },
        },
        mmiConfiguration: {
          custodians: [
            {
              envName: 'saturn-dev',
              displayName: 'Saturn Custody',
              isNoteToTraderSupported: false,
            },
          ],
        },
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: mockTxParamsFromAddress,
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Custody Account A',
                keyring: {
                  type: 'Custody',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
        pendingApprovals: {
          '741bad30-45b6-11ef-b6ec-870d18dd6c01': {
            id: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            origin: 'http://127.0.0.1:8080',
            type: 'transaction',
            time: 1721383540624,
            requestData: {
              txId: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            },
            requestState: null,
            expectsResult: true,
          },
        },
      },
      send: {
        ...baseStore.send,
        gas: {
          ...baseStore.send.gas,
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '0',
            medium: '1',
            high: '2',
          },
        },
        hasSimulationError: false,
        userAcknowledgedGasMissing: false,
        submitting: false,
        hardwareWalletRequiresConnection: false,
        gasIsLoading: false,
        gasFeeIsCustom: true,
      },
    };

    const sendTransaction = jest
      .fn()
      .mockResolvedValue(state.confirmTransaction.txData);
    const showCustodianDeepLink = jest.fn();
    const setWaitForConfirmDeepLinkDialog = jest.fn();

    const props = {
      sendTransaction,
      showCustodianDeepLink,
      setWaitForConfirmDeepLinkDialog,
      toAddress: mockPropsToAddress,
      toAccounts: [{ address: mockPropsToAddress }],
      isMainBetaFlask: false,
    };

    const { getByTestId } = await render({ props, state });

    const confirmButton = getByTestId('page-container-footer-next');
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'metamask#smartTransaction',
      }),
    );
  });

  describe('when rendering the recipient value', () => {
    describe(`when the transaction is a ${TransactionType.simpleSend} type`, () => {
      it(`should use txParams.to address`, async () => {
        const { container } = await render();

        const recipientElem = container.querySelector(sendToRecipientSelector);
        expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
      });

      it(`should use txParams.to address even if there is no amount sent`, async () => {
        const state = mockedStoreWithConfirmTxParams(baseStore, {
          ...mockTxParams,
          value: '0x0',
        });
        const { container } = await render({ state });

        const recipientElem = container.querySelector(sendToRecipientSelector);
        expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
      });
    });
    describe(`when the transaction is NOT a ${TransactionType.simpleSend} type`, () => {
      beforeEach(() => {
        baseStore.confirmTransaction.txData.type =
          TransactionType.contractInteraction;
      });

      describe('when there is an amount being sent (it should be treated as a general contract interaction rather than custom one)', () => {
        it('should use txParams.to address (contract address)', async () => {
          const state = mockedStoreWithConfirmTxParams(baseStore, {
            ...mockTxParams,
            value: '0x45666',
          });
          state.confirmTransaction.txData = {
            ...state.confirmTransaction.txData,
            type: TransactionType.contractInteraction,
          };

          const { container } = await render({ state });

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
        });
      });

      describe('when determines the recipient from transaction data args', () => {
        const testCases = [
          {
            type: TransactionType.tokenMethodTransfer,
            data: `0xa9059cbb000000000000000000000000${mockParsedTxDataToAddressWithout0x}0000000000000000000000000000000000000000000000000000000000000001`,
            description: 'tokenMethodTransfer',
          },
          {
            type: TransactionType.tokenMethodSafeTransferFrom,
            data: `0x42842e0e000000000000000000000000806627172af48bd5b0765d3449a7def80d6576ff000000000000000000000000${mockParsedTxDataToAddressWithout0x}000000000000000000000000000000000000000000000000000000000009a7cc`,
            description: 'tokenMethodSafeTransferFrom',
          },
          {
            type: TransactionType.tokenMethodTransferFrom,
            data: `0x23b872dd000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725000000000000000000000000${mockParsedTxDataToAddressWithout0x}000000000000000000000000000000000000000000000000000000000009a7b8`,
            description: 'tokenMethodTransferFrom',
          },
        ];

        it.each(testCases)(
          'identifies correctly the recipient for $description transactions',
          async ({ type, data }) => {
            const state = mockedStoreWithConfirmTxParams(baseStore, {
              ...mockTxParams,
              data,
            });
            state.confirmTransaction.txData = {
              ...state.confirmTransaction.txData,
              type,
            };

            const { container } = await render({ state });

            const recipientElem = container.querySelector(
              sendToRecipientSelector,
            );
            expect(recipientElem).toHaveTextContent(mockParsedTxDataToAddress);
          },
        );
      });

      describe('when a non-transfer function matching the ABIs', () => {
        it('does not determine the recipient from transaction data args', async () => {
          const state = mockedStoreWithConfirmTxParams(baseStore, {
            ...mockTxParams,
            data: `0xa22cb465000000000000000000000000${mockParsedTxDataToAddressWithout0x}0000000000000000000000000000000000000000000000000000000000000001`,
          });
          state.confirmTransaction.txData = {
            ...state.confirmTransaction.txData,
            type: TransactionType.contractInteraction,
          };

          const { container } = await render({ state });

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
        });
      });

      describe(`when there is no amount being sent`, () => {
        it('should use propToAddress (toAddress passed as prop)', async () => {
          const state = mockedStoreWithConfirmTxParams(baseStore, {
            ...mockTxParams,
            value: '0x0',
          });
          state.confirmTransaction.txData = {
            ...state.confirmTransaction.txData,
            type: TransactionType.contractInteraction,
          };

          const props = {
            // we want to test toAddress provided by ownProps in mapStateToProps, but this
            // currently overrides toAddress this should pan out fine when we refactor the
            // component into a functional component and remove the container.js file
            toAddress: mockPropsToAddress,
          };

          const { container } = await render({ props, state });

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockPropsToAddressConcat);
        });

        it('should use txParams.to if neither propToAddress is not provided nor the transaction data to address were provided', async () => {
          const state = mockedStoreWithConfirmTxParams(baseStore, {
            ...mockTxParams,
            data: '0x',
            value: '0x0',
          });
          state.confirmTransaction.txData = {
            ...state.confirmTransaction.txData,
            type: TransactionType.contractInteraction,
          };

          const props = {};

          const { container } = await render({ props, state });

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
        });
      });
    });
  });
  describe('user op contract deploy attempt', () => {
    it('should show error and disable Confirm button', async () => {
      const txParams = {
        ...mockTxParams,
        to: undefined,
        data: '0xa22cb46500000000000000',
      };
      const state = {
        ...baseStore,
        metamask: {
          ...baseStore.metamask,
          transactions: [
            {
              id: baseStore.confirmTransaction.txData.id,
              chainId: '0x5',
              status: 'unapproved',
              txParams,
            },
          ],
        },
        confirmTransaction: {
          ...baseStore.confirmTransaction,
          txData: {
            ...baseStore.confirmTransaction.txData,
            type: TransactionType.deployContract,
            value: '0x0',
            isUserOperation: true,
            txParams,
          },
        },
      };

      const { getByTestId } = await render({ state });

      const banner = getByTestId(
        'confirm-page-container-content-error-banner-2',
      );
      expect(banner).toHaveTextContent(
        /Contract deployment from a smart contract account is not supported/u,
      );

      const confirmButton = getByTestId('page-container-footer-next');
      expect(confirmButton).toBeDisabled();
    });
  });
});
