import { ApprovalType } from '@metamask/controller-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import nock from 'nock';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation } from '../../helpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const getMetaMaskStateWithUnapprovedPermitSign = (accountAddress: string) => {
  const pendingPermitId = 'eae47d40-42a3-11ef-9253-b105fa7dfc9c';
  const pendingPermitTime = new Date().getTime();
  const messageParams = {
    from: accountAddress,
    version: 'v4',
    data: `{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"MyToken","version":"1","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","chainId":1},"message":{"owner":"${accountAddress}","spender":"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","value":3000,"nonce":0,"deadline":50000000000}}`,
    origin: 'https://metamask.github.io',
    signatureMethod: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
  };
  return {
    ...mockMetaMaskState,
    preferences: {
      ...mockMetaMaskState.preferences,
      redesignedConfirmationsEnabled: true,
    },
    unapprovedTypedMessages: {
      [pendingPermitId]: {
        id: pendingPermitId,
        chainId: CHAIN_IDS.SEPOLIA,
        status: 'unapproved',
        time: pendingPermitTime,
        type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
        securityProviderResponse: null,
        msgParams: messageParams,
      },
    },
    unapprovedTypedMessagesCount: 1,
    pendingApprovals: {
      [pendingPermitId]: {
        id: pendingPermitId,
        origin: 'origin',
        time: pendingPermitTime,
        type: ApprovalType.EthSignTypedData,
        requestData: {
          ...messageParams,
          metamaskId: pendingPermitId,
        },
        requestState: null,
        expectsResult: false,
      },
    },
    pendingApprovalCount: 1,
  };
};

describe('Permit Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      createMockImplementation({
        getTokenStandardAndDetails: { decimals: '2', standard: 'ERC20' },
      }),
    );
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('displays the header account modal with correct data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;
    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(await screen.findByTestId('header-account-name')).toHaveTextContent(
      accountName,
    );
    expect(
      await screen.findByTestId('header-network-display-name'),
    ).toHaveTextContent('Sepolia');

    fireEvent.click(
      await screen.findByTestId('header-info__account-details-button'),
    );

    expect(
      await screen.findByTestId(
        'confirmation-account-details-modal__account-name',
      ),
    ).toHaveTextContent(accountName);
    expect(
      await screen.findByTestId('address-copy-button-text'),
    ).toHaveTextContent('0x0DCD5...3E7bc');
    expect(
      await screen.findByTestId(
        'confirmation-account-details-modal__account-balance',
      ),
    ).toHaveTextContent('1.582717SepoliaETH');

    let confirmAccountDetailsModalMetricsEvent;

    await waitFor(() => {
      confirmAccountDetailsModalMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'trackMetaMetricsEvent' &&
            (call[1] as unknown as Record<string, unknown>[])[0]?.event ===
              MetaMetricsEventName.AccountDetailsOpened,
        );
      expect(confirmAccountDetailsModalMetricsEvent?.[0]).toBe(
        'trackMetaMetricsEvent',
      );
    });

    expect(confirmAccountDetailsModalMetricsEvent?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: MetaMetricsEventCategory.Confirmations,
          event: MetaMetricsEventName.AccountDetailsOpened,
          properties: {
            action: 'Confirm Screen',
            location: MetaMetricsEventLocation.SignatureConfirmation,
            signature_type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          },
        }),
      ]),
    );

    fireEvent.click(
      await screen.findByTestId(
        'confirmation-account-details-modal__close-button',
      ),
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId(
          'confirmation-account-details-modal__account-name',
        ),
      ).not.toBeInTheDocument();
    });
  });

  it('displays the expected title data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Spending cap request')).toBeInTheDocument();
      expect(
        screen.getByText('This site wants permission to spend your tokens.'),
      ).toBeInTheDocument();
    });
  });

  it('displays the simulation section', async () => {
    const scope = nock('https://price.api.cx.metamask.io')
      .persist()
      .get('/v2/chains/1/spot-prices')
      .query({
        tokenAddresses:
          '0x0000000000000000000000000000000000000000,0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        vsCurrency: 'ETH',
        includeMarketData: 'true',
      })
      .reply(200, {
        '0xcccccccccccccccccccccccccccccccccccccccc': {
          allTimeHigh: 12,
          allTimeLow: 1,
          circulatingSupply: 50000,
          dilutedMarketCap: 50000,
          high1d: 11,
          low1d: 9.9,
          marketCap: 10000,
          marketCapPercentChange1d: 1,
          price: 10,
          priceChange1d: 0.5,
          pricePercentChange1d: 1,
          pricePercentChange1h: 0,
          pricePercentChange1y: 80,
          pricePercentChange7d: 2,
          pricePercentChange14d: 5,
          pricePercentChange30d: 10,
          pricePercentChange200d: 50,
          totalVolume: 100,
        },
      });

    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          selectedNetworkClientId: 'testNetworkConfigurationId',
          providerConfig: {
            type: 'rpc',
            nickname: 'test mainnet',
            chainId: '0x1',
            ticker: 'ETH',
            id: 'chain1',
          },
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const simulationSection = await screen.findByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();
    expect(simulationSection).toHaveTextContent('Estimated changes');
    expect(simulationSection).toHaveTextContent(
      "You're giving the spender permission to spend this many tokens from your account.",
    );
    expect(simulationSection).toHaveTextContent('Spending cap');
    expect(simulationSection).toHaveTextContent('0xCcCCc...ccccC');
    expect(
      await screen.findByTestId('simulation-token-value'),
    ).toHaveTextContent('30');

    const individualFiatDisplay = await screen.findByTestId(
      'individual-fiat-display',
    );
    expect(individualFiatDisplay).toHaveTextContent('$166,836.00');

    scope.done();
    expect(scope.isDone()).toBe(true);
  });

  it('displays the MMI header warning when account signing is not the same as the account selected', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        '07c2cfec-36c9-46c4-8115-3836d3ac9047'
      ];
    const selectedAccount =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const mismatchAccountText = `Your selected account (${shortenAddress(
      selectedAccount.address,
    )}) is different than the account trying to sign (${shortenAddress(
      account.address,
    )})`;

    expect(await screen.findByText(mismatchAccountText)).toBeInTheDocument();
  });
});
