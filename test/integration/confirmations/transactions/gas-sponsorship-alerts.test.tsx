import { ApprovalType } from '@metamask/controller-utils';
import { fireEvent, screen } from '@testing-library/react';
import nock from 'nock';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { tEn } from '../../../lib/i18n-helpers';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedContractInteractionTransaction } from './transactionDataHelpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const pendingTransactionId = '48a75190-45ca-11ef-9001-f3886ec2397c';
const pendingTransactionTime = new Date().getTime();

const MONAD_NETWORK_CLIENT_ID = 'monad-mainnet';

const MONAD_NETWORK_CONFIGURATION = {
  chainId: CHAIN_IDS.MONAD,
  rpcEndpoints: [
    {
      networkClientId: MONAD_NETWORK_CLIENT_ID,
      url: 'https://monad-mainnet.infura.io/v3/{infuraProjectId}',
      type: 'infura',
    },
  ],
  defaultRpcEndpointIndex: 0,
  blockExplorerUrls: ['https://monadscan.com'],
  defaultBlockExplorerUrlIndex: 0,
  name: 'Monad',
  nativeCurrency: 'MON',
};

// Increased timeout: React 18's act() waits for ALL pending async work
// (including Rive WASM loading) which can exceed the default 15s limit.
jest.setTimeout(30_000);

function getMonadSponsoredTransaction({
  accountAddress,
  isGasFeeSponsored,
}: {
  accountAddress: string;
  isGasFeeSponsored: boolean;
}) {
  const transaction = getUnapprovedContractInteractionTransaction(
    accountAddress,
    pendingTransactionId,
    pendingTransactionTime,
  );

  return {
    ...transaction,
    chainId: CHAIN_IDS.MONAD,
    networkClientId: MONAD_NETWORK_CLIENT_ID,
    isGasFeeSponsored,
    simulationData: {
      ...transaction.simulationData,
      callTraceErrors: ['reserve balance violation'],
    },
  };
}

function getMetaMaskStateWithMonadSponsorshipTransaction({
  accountAddress,
  isGasFeeSponsored,
}: {
  accountAddress: string;
  isGasFeeSponsored: boolean;
}) {
  const sepoliaAccounts = mockMetaMaskState.accountsByChainId['0xaa36a7'];

  return {
    ...mockMetaMaskState,
    selectedNetworkClientId: MONAD_NETWORK_CLIENT_ID,
    enabledNetworkMap: {
      ...mockMetaMaskState.enabledNetworkMap,
      eip155: {
        ...mockMetaMaskState.enabledNetworkMap.eip155,
        [CHAIN_IDS.MONAD]: true,
      },
    },
    networkConfigurationsByChainId: {
      ...mockMetaMaskState.networkConfigurationsByChainId,
      [CHAIN_IDS.MONAD]: MONAD_NETWORK_CONFIGURATION,
    },
    accountsByChainId: {
      ...mockMetaMaskState.accountsByChainId,
      [CHAIN_IDS.MONAD]: sepoliaAccounts,
    },
    networksMetadata: {
      ...mockMetaMaskState.networksMetadata,
      [MONAD_NETWORK_CLIENT_ID]: {
        EIPS: {
          1559: true,
        },
        status: 'available',
      },
    },
    pendingApprovals: {
      [pendingTransactionId]: {
        id: pendingTransactionId,
        origin: 'origin',
        time: pendingTransactionTime,
        type: ApprovalType.Transaction,
        requestData: {
          txId: pendingTransactionId,
        },
        requestState: null,
        expectsResult: false,
      },
    },
    pendingApprovalCount: 1,
    transactions: [
      getMonadSponsoredTransaction({
        accountAddress,
        isGasFeeSponsored,
      }),
    ],
  };
}

function setupSubmitRequestToBackgroundMocks() {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      isRelaySupported: true,
      isSendBundleSupported: false,
      getTokenStandardAndDetailsByChain: {
        decimals: '4',
      },
    }),
  );
}

describe('Gas sponsorship confirmation alerts', () => {
  beforeAll(() => {
    global.ethereumProvider = {
      request: jest.fn(),
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    mock4byte('0x3b4b1381');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).ethereumProvider;
  });

  it('displays the reserve-balance warning when sponsorship simulation fails', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    await integrationTestRender({
      preloadedState: getMetaMaskStateWithMonadSponsorshipTransaction({
        accountAddress: account.address,
        isGasFeeSponsored: false,
      }),
      backgroundConnection: backgroundConnectionMocked,
    });

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();
    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      tEn('gasSponsorshipReserveBalanceWarning', ['10', 'MON']),
    );
    expect(
      await screen.findByText(tEn('alertMinimumReserve')),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('alert-modal-action-buy'),
    ).toHaveTextContent(tEn('alertActionBuyWithNativeCurrency', ['MON']));
    expect(await screen.findByTestId('confirm-footer-button')).toBeDisabled();
  });

  it('does not display the reserve-balance warning when the transaction is sponsored', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    await integrationTestRender({
      preloadedState: getMetaMaskStateWithMonadSponsorshipTransaction({
        accountAddress: account.address,
        isGasFeeSponsored: true,
      }),
      backgroundConnection: backgroundConnectionMocked,
    });

    expect(
      await screen.findByTestId('confirm-footer-button'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('inline-alert')).not.toBeInTheDocument();
  });
});
