import { act, fireEvent, waitFor, screen } from '@testing-library/react';
import nock from 'nock';
import { ApprovalType } from '@metamask/controller-utils';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { integrationTestRender } from '../../../lib/render-helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventLocation,
} from '../../../../shared/constants/metametrics';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { createMockImplementation } from '../../helpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const PERMIT_DATA = `{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"MyToken","version":"1","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","chainId":1},"message":{"owner":"{ownerAddress}","spender":"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","value":3000,"nonce":0,"deadline":50000000000}}`;

const PERMIT_BATCH_DATA = `{"types":{"PermitBatch":[{"name":"details","type":"PermitDetails[]"},{"name":"spender","type":"address"},{"name":"sigDeadline","type":"uint256"}],"PermitDetails":[{"name":"token","type":"address"},{"name":"amount","type":"uint160"},{"name":"expiration","type":"uint48"},{"name":"nonce","type":"uint48"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Permit2","chainId":"1","verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"PermitBatch","message":{"details":[{"token":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"1461501637330902918203684832716283019655932542975","expiration":"1722887542","nonce":"5"},{"token":"0xb0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"2461501637330902918203684832716283019655932542975","expiration":"1722887642","nonce":"6"}],"spender":"0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad","sigDeadline":"1720297342"}}`;

const PERMIT_SINGLE_DATA = `{"types":{"PermitSingle":[{"name":"details","type":"PermitDetails"},{"name":"spender","type":"address"},{"name":"sigDeadline","type":"uint256"}],"PermitDetails":[{"name":"token","type":"address"},{"name":"amount","type":"uint160"},{"name":"expiration","type":"uint48"},{"name":"nonce","type":"uint48"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Permit2","chainId":"1","verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"PermitSingle","message":{"details":{"token":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"1461501637330902918203684832716283019655932542975","expiration":"1722887542","nonce":"5"},"spender":"0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad","sigDeadline":"1720297342"}}`;

const PERMIT_SEAPORT_DATA = `{"types":{"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Seaport","version":"1.1","chainId":1,"verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"OrderComponents","message":{"offerer":"0x5a6f5477bdeb7801ba137a9f0dc39c0599bac994","zone":"0x004c00500000ad104d7dbd00e3ae0a5c00560c00","offer":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1"}],"consideration":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"}],"orderType":"2","startTime":"1681810415","endTime":"1681983215","zoneHash":"0x0000000000000000000000000000000000000000000000000000000000000000","salt":"1550213294656772168494388599483486699884316127427085531712538817979596","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","counter":"0"}}`;

const getMetaMaskStateWithUnapprovedPermitSign = (
  accountAddress: string,
  permitType: 'Permit' | 'PermitBatch' | 'PermitSingle' | 'PermitSeaport',
) => {
  const pendingPermitId = '48a75190-45ca-11ef-9001-f3886ec2397c';
  const pendingPermitTime = new Date().getTime();

  // Set the data string based on the permit type
  let data;
  if (permitType === 'Permit') {
    data = PERMIT_DATA.replace('{ownerAddress}', accountAddress);
  } else if (permitType === 'PermitBatch') {
    data = PERMIT_BATCH_DATA;
  } else if (permitType === 'PermitSingle') {
    data = PERMIT_SINGLE_DATA;
  } else if (permitType === 'PermitSeaport') {
    data = PERMIT_SEAPORT_DATA;
  }

  const messageParams = {
    from: accountAddress,
    version: 'v4',
    data,
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
        getTokenStandardAndDetails: { decimals: '2' },
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
      'Permit',
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(screen.getByTestId('header-account-name')).toHaveTextContent(
      accountName,
    );
    expect(screen.getByTestId('header-network-display-name')).toHaveTextContent(
      'Sepolia',
    );

    fireEvent.click(screen.getByTestId('header-info__account-details-button'));

    expect(
      await screen.findByTestId(
        'confirmation-account-details-modal__account-name',
      ),
    ).toHaveTextContent(accountName);
    expect(screen.getByTestId('address-copy-button-text')).toHaveTextContent(
      '0x0DCD5...3E7bc',
    );
    expect(
      screen.getByTestId('confirmation-account-details-modal__account-balance'),
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
      screen.getByTestId('confirmation-account-details-modal__close-button'),
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
      'Permit',
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(screen.getByText('Spending cap request')).toBeInTheDocument();
    expect(
      screen.getByText('This site wants permission to spend your tokens.'),
    ).toBeInTheDocument();
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
      'Permit',
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

    const simulationSection = screen.getByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();
    expect(simulationSection).toHaveTextContent('Estimated changes');
    expect(simulationSection).toHaveTextContent(
      "You're giving the spender permission to spend this many tokens from your account.",
    );
    expect(simulationSection).toHaveTextContent('Spending cap');
    expect(simulationSection).toHaveTextContent('0xCcCCc...ccccC');
    expect(screen.getByTestId('simulation-token-value')).toHaveTextContent(
      '30',
    );

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
      'Permit',
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

    expect(screen.getByText(mismatchAccountText)).toBeInTheDocument();
  });

  it('displays the permit batch signature', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
      'PermitBatch',
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

    expect(screen.getByText('Spending cap request')).toBeInTheDocument();
    expect(
      screen.getByText('This site wants permission to spend your tokens.'),
    ).toBeInTheDocument();

    const simulationSection = screen.getByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();
    expect(simulationSection).toHaveTextContent('Estimated changes');
    expect(simulationSection).toHaveTextContent(
      "You're giving the spender permission to spend this many tokens from your account.",
    );
    expect(simulationSection).toHaveTextContent('Spending cap');
    expect(simulationSection).toHaveTextContent('0xA0b86...6eB48');
    expect(simulationSection).toHaveTextContent('14,615,016,373,...');
    expect(simulationSection).toHaveTextContent('0xb0B86...6EB48');
    expect(simulationSection).toHaveTextContent('24,615,016,373,...');

    const requestDetailsSection = screen.getByTestId(
      'confirmation_request-section',
    );

    expect(requestDetailsSection).toBeInTheDocument();
    expect(requestDetailsSection).toHaveTextContent('Spender');
    expect(requestDetailsSection).toHaveTextContent('0x3fC91...b7FAD');
    expect(requestDetailsSection).toHaveTextContent('Request from');
    expect(requestDetailsSection).toHaveTextContent('metamask.github.io');
    expect(requestDetailsSection).toHaveTextContent('Interacting with');
    expect(requestDetailsSection).toHaveTextContent('0x00000...78BA3');

    const messageDetailsSection = screen.getByTestId(
      'confirmation_message-section',
    );
    expect(messageDetailsSection).toBeInTheDocument();
    expect(messageDetailsSection).toHaveTextContent('Message');
    expect(messageDetailsSection).toHaveTextContent('Primary type:');
    expect(messageDetailsSection).toHaveTextContent('PermitBatch');

    const messageData0 = screen.getByTestId('confirmation_data-0-index-0');
    const messageData1 = screen.getByTestId('confirmation_data-1-index-1');
    expect(messageDetailsSection).toContainElement(messageData0);
    expect(messageDetailsSection).toContainElement(messageData1);

    expect(messageData0).toHaveTextContent('Token');
    expect(messageData0).toHaveTextContent('USDC'); // ToDo: Check this, should be 0xA0b86...6eB48
    expect(messageData0).toHaveTextContent('Amount');
    expect(messageData0).toHaveTextContent('14,615,016,373,...');
    expect(messageData0).toHaveTextContent('Expiration');
    expect(messageData0).toHaveTextContent('05 August 2024, 19:52');
    expect(messageData0).toHaveTextContent('Nonce');
    expect(messageData0).toHaveTextContent('5');

    expect(messageData1).toHaveTextContent('Token');
    expect(messageData1).toHaveTextContent('0xb0B86...6EB48');
    expect(messageData1).toHaveTextContent('Amount');
    expect(messageData1).toHaveTextContent('24,615,016,373,...');
    expect(messageData1).toHaveTextContent('Expiration');
    expect(messageData1).toHaveTextContent('05 August 2024, 19:54');
    expect(messageData1).toHaveTextContent('Nonce');
    expect(messageData1).toHaveTextContent('6');

    expect(messageDetailsSection).toHaveTextContent('Spender');
    expect(messageDetailsSection).toHaveTextContent('0x3fC91...b7FAD');
    expect(messageDetailsSection).toHaveTextContent('SigDeadline');
    expect(messageDetailsSection).toHaveTextContent('06 July 2024, 20:22');
  });

  it('displays the permit single signature', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
      'PermitSingle',
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

    expect(screen.getByText('Spending cap request')).toBeInTheDocument();
    expect(
      screen.getByText('This site wants permission to spend your tokens.'),
    ).toBeInTheDocument();

    const simulationSection = screen.getByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();
    expect(simulationSection).toHaveTextContent('Estimated changes');
    expect(simulationSection).toHaveTextContent(
      "You're giving the spender permission to spend this many tokens from your account.",
    );
    expect(simulationSection).toHaveTextContent('Spending cap');
    expect(simulationSection).toHaveTextContent('0xA0b86...6eB48');
    expect(simulationSection).toHaveTextContent('14,615,016,373,...');

    const requestDetailsSection = screen.getByTestId(
      'confirmation_request-section',
    );

    expect(requestDetailsSection).toBeInTheDocument();
    expect(requestDetailsSection).toHaveTextContent('Spender');
    expect(requestDetailsSection).toHaveTextContent('0x3fC91...b7FAD');
    expect(requestDetailsSection).toHaveTextContent('Request from');
    expect(requestDetailsSection).toHaveTextContent('metamask.github.io');
    expect(requestDetailsSection).toHaveTextContent('Interacting with');
    expect(requestDetailsSection).toHaveTextContent('0x00000...78BA3');

    const messageDetailsSection = screen.getByTestId(
      'confirmation_message-section',
    );
    expect(messageDetailsSection).toBeInTheDocument();
    expect(messageDetailsSection).toHaveTextContent('Message');
    expect(messageDetailsSection).toHaveTextContent('Primary type:');
    expect(messageDetailsSection).toHaveTextContent('PermitSingle');

    const messageData0 = screen.getByTestId(
      'confirmation_data-details-index-0',
    );

    expect(messageDetailsSection).toContainElement(messageData0);

    expect(messageData0).toHaveTextContent('Token');
    expect(messageData0).toHaveTextContent('USDC'); // Check this
    expect(messageData0).toHaveTextContent('Amount');
    expect(messageData0).toHaveTextContent('14,615,016,373,...');
    expect(messageData0).toHaveTextContent('Expiration');
    expect(messageData0).toHaveTextContent('05 August 2024, 19:52');
    expect(messageData0).toHaveTextContent('Nonce');
    expect(messageData0).toHaveTextContent('5');

    expect(messageDetailsSection).toHaveTextContent('Spender');
    expect(messageDetailsSection).toHaveTextContent('0x3fC91...b7FAD');
    expect(messageDetailsSection).toHaveTextContent('SigDeadline');
    expect(messageDetailsSection).toHaveTextContent('06 July 2024, 20:22');
  });

  it.only('displays the permit seaport signature', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
      'PermitSeaport',
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

    expect(screen.getByText('Signature request')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();

    const requestDetailsSection = screen.getByTestId(
      'confirmation_request-section',
    );

    expect(requestDetailsSection).toBeInTheDocument();
    expect(requestDetailsSection).toHaveTextContent('Request from');
    expect(requestDetailsSection).toHaveTextContent('metamask.github.io');
    expect(requestDetailsSection).toHaveTextContent('Interacting with');
    expect(requestDetailsSection).toHaveTextContent('0x00000...78BA3');

    const messageDetailsSection = screen.getByTestId(
      'confirmation_message-section',
    );
    expect(messageDetailsSection).toBeInTheDocument();
    expect(messageDetailsSection).toHaveTextContent('Message');
    expect(messageDetailsSection).toHaveTextContent('Primary type:');
    expect(messageDetailsSection).toHaveTextContent('OrderComponents');
    expect(messageDetailsSection).toHaveTextContent('Offerer');
    expect(messageDetailsSection).toHaveTextContent('0x5a6f5...Ac994');
    expect(messageDetailsSection).toHaveTextContent('Zone');
    expect(messageDetailsSection).toHaveTextContent('0x004C0...60C00');
    expect(messageDetailsSection).toHaveTextContent('Offer');

    const offers = screen.findByTestId('confirmation_data-offer-index-2');

    const offerDetails0 = (await offers).querySelector(
      '[data-testid="confirmation_data-0-index-0"]',
    );

    const offerDetails1 = (await offers).querySelector(
      '[data-testid="confirmation_data-1-index-1"]',
    );

    const considerations = screen.findByTestId(
      'confirmation_data-consideration-index-3',
    );

    const considerationDetails0 = (await considerations).querySelector(
      '[data-testid="confirmation_data-0-index-0"]',
    );
    expect(offerDetails0).toHaveTextContent('ItemType');
    expect(offerDetails0).toHaveTextContent('2');
    expect(offerDetails0).toHaveTextContent('Token');
    expect(offerDetails0).toHaveTextContent('MutantApeYachtClub');
    expect(offerDetails0).toHaveTextContent('IdentifierOrCriteria');
    expect(offerDetails0).toHaveTextContent('26464');
    expect(offerDetails0).toHaveTextContent('StartAmount');
    expect(offerDetails0).toHaveTextContent('0.01');
    expect(offerDetails0).toHaveTextContent('EndAmount');
    expect(offerDetails0).toHaveTextContent('0.01');

    expect(offerDetails1).toHaveTextContent('ItemType');
    expect(offerDetails1).toHaveTextContent('2');
    expect(offerDetails1).toHaveTextContent('Token');
    expect(offerDetails1).toHaveTextContent('MutantApeYachtClub');
    expect(offerDetails1).toHaveTextContent('IdentifierOrCriteria');
    expect(offerDetails1).toHaveTextContent('7779');
    expect(offerDetails1).toHaveTextContent('StartAmount');
    expect(offerDetails1).toHaveTextContent('0.01');
    expect(offerDetails1).toHaveTextContent('EndAmount');
    expect(offerDetails1).toHaveTextContent('0.01');

    expect(considerationDetails0).toHaveTextContent('ItemType');
    expect(considerationDetails0).toHaveTextContent('2');
    expect(considerationDetails0).toHaveTextContent('Token');
    expect(considerationDetails0).toHaveTextContent('MutantApeYachtClub');
    expect(considerationDetails0).toHaveTextContent('IdentifierOrCriteria');
    expect(considerationDetails0).toHaveTextContent('26464');
    expect(considerationDetails0).toHaveTextContent('StartAmount');
    expect(considerationDetails0).toHaveTextContent('0.01');
    expect(considerationDetails0).toHaveTextContent('EndAmount');
    expect(considerationDetails0).toHaveTextContent('0.01');
    expect(considerationDetails0).toHaveTextContent('Recipient');
    expect(considerationDetails0).toHaveTextContent('0xDFdc0...25Cc1');
  });
});
