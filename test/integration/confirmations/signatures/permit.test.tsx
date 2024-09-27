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
import { tEn } from '../../../lib/i18n-helpers';

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

const SEAPORT_DATA = `{"types":{"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Seaport","version":"1.1","chainId":1,"verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"OrderComponents","message":{"offerer":"0x5a6f5477bdeb7801ba137a9f0dc39c0599bac994","zone":"0x004c00500000ad104d7dbd00e3ae0a5c00560c00","offer":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1"}],"consideration":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"}],"orderType":"2","startTime":"1681810415","endTime":"1681983215","zoneHash":"0x0000000000000000000000000000000000000000000000000000000000000000","salt":"1550213294656772168494388599483486699884316127427085531712538817979596","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","counter":"0"}}`;

const TRADE_ORDER_DATA = `{"types":{"ERC721Order":[{"type":"uint8","name":"direction"},{"type":"address","name":"maker"},{"type":"address","name":"taker"},{"type":"uint256","name":"expiry"},{"type":"uint256","name":"nonce"},{"type":"address","name":"erc20Token"},{"type":"uint256","name":"erc20TokenAmount"},{"type":"Fee[]","name":"fees"},{"type":"address","name":"erc721Token"},{"type":"uint256","name":"erc721TokenId"},{"type":"Property[]","name":"erc721TokenProperties"}],"Fee":[{"type":"address","name":"recipient"},{"type":"uint256","name":"amount"},{"type":"bytes","name":"feeData"}],"Property":[{"type":"address","name":"propertyValidator"},{"type":"bytes","name":"propertyData"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"ZeroEx","version":"1.0.0","chainId":"0x1","verifyingContract":"0xdef1c0ded9bec7f1a1670819833240f027b25eff"},"primaryType":"ERC721Order","message":{"direction":"0","maker":"0x8eeee1781fd885ff5ddef7789486676961873d12","taker":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","expiry":"2524604400","nonce":"100131415900000000000000000000000000000083840314483690155566137712510085002484","erc20Token":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","erc20TokenAmount":"42000000000000","fees":[],"erc721Token":"0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e","erc721TokenId":"2516","erc721TokenProperties":[]}}`;

const getMetaMaskStateWithUnapprovedPermitSign = (
  accountAddress: string,
  permitType:
    | 'Permit'
    | 'PermitBatch'
    | 'PermitSingle'
    | 'PermitSeaport'
    | 'TradeOrder',
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
    data = SEAPORT_DATA;
  } else if (permitType === 'TradeOrder') {
    data = TRADE_ORDER_DATA;
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

const verifyDetails = (element: Element, expectedValues: string[]) => {
  expectedValues.forEach((value) => {
    expect(element).toHaveTextContent(value);
  });
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

    expect(
      screen.getByText(tEn('confirmTitlePermitTokens') as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('confirmTitleDescPermitSignature') as string),
    ).toBeInTheDocument();

    const simulationSection = screen.getByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();
    const simulationDeatils = [
      'Estimated changes',
      "You're giving the spender permission to spend this many tokens from your account.",
      'Spending cap',
      '0xA0b86...6eB48',
      '14,615,016,373,...',
      '0xb0B86...6EB48',
      '24,615,016,373,...',
    ];

    verifyDetails(simulationSection, simulationDeatils);

    const requestDetailsSection = screen.getByTestId(
      'confirmation_request-section',
    );

    const requestDetails = [
      'Spender',
      '0x3fC91...b7FAD',
      'Request from',
      'metamask.github.io',
      'Interacting with',
      '0x00000...78BA3',
    ];

    expect(requestDetailsSection).toBeInTheDocument();
    verifyDetails(requestDetailsSection, requestDetails);

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

    const messageDetails = [
      {
        element: messageData0,
        content: [
          'Token',
          'USDC',
          'Amount',
          '14,615,016,373,...',
          'Expiration',
          '05 August 2024, 19:52',
          'Nonce',
          '5',
        ],
      },
      {
        element: messageData1,
        content: [
          'Token',
          '0xb0B86...6EB48',
          'Amount',
          '24,615,016,373,...',
          'Expiration',
          '05 August 2024, 19:54',
          'Nonce',
          '6',
        ],
      },
    ];

    messageDetails.forEach(({ element, content }) => {
      verifyDetails(element, content);
    });

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

    expect(
      screen.getByText(tEn('confirmTitlePermitTokens') as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('confirmTitleDescPermitSignature') as string),
    ).toBeInTheDocument();

    const simulationSection = screen.getByTestId(
      'confirmation__simulation_section',
    );
    const simulationDetails = [
      'Estimated changes',
      "You're giving the spender permission to spend this many tokens from your account.",
      'Spending cap',
      '0xA0b86...6eB48',
      '14,615,016,373,...',
    ];

    expect(simulationSection).toBeInTheDocument();
    verifyDetails(simulationSection, simulationDetails);

    const requestDetailsSection = screen.getByTestId(
      'confirmation_request-section',
    );
    const requestDetails = [
      'Spender',
      '0x3fC91...b7FAD',
      'Request from',
      'metamask.github.io',
      'Interacting with',
      '0x00000...78BA3',
    ];

    expect(requestDetailsSection).toBeInTheDocument();
    verifyDetails(requestDetailsSection, requestDetails);

    const messageDetailsSection = screen.getByTestId(
      'confirmation_message-section',
    );
    const messageDetails = ['Message', 'Primary type:', 'PermitSingle'];

    expect(messageDetailsSection).toBeInTheDocument();
    verifyDetails(messageDetailsSection, messageDetails);

    const messageData0 = screen.getByTestId(
      'confirmation_data-details-index-0',
    );
    const messageData0Details = [
      'Token',
      'USDC',
      'Amount',
      '14,615,016,373,...',
      'Expiration',
      '05 August 2024, 19:52',
      'Nonce',
      '5',
    ];

    expect(messageDetailsSection).toContainElement(messageData0);
    verifyDetails(messageData0, messageData0Details);

    expect(messageDetailsSection).toHaveTextContent('Spender');
    expect(messageDetailsSection).toHaveTextContent('0x3fC91...b7FAD');
    expect(messageDetailsSection).toHaveTextContent('SigDeadline');
    expect(messageDetailsSection).toHaveTextContent('06 July 2024, 20:22');
  });

  it('displays the seaport signature', async () => {
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

    expect(
      screen.getByText(tEn('confirmTitleSignature') as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('confirmTitleDescSign') as string),
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
    const messageDetailsContent = [
      'Message',
      'Primary type:',
      'OrderComponents',
      'Offerer',
      '0x5a6f5...Ac994',
      'Zone',
      '0x004C0...60C00',
      'Offer',
    ];
    verifyDetails(messageDetailsSection, messageDetailsContent);

    const offers = screen.getByTestId('confirmation_data-offer-index-2');
    const offerDetails0 = offers.querySelector(
      '[data-testid="confirmation_data-0-index-0"]',
    );
    const offerDetails1 = offers.querySelector(
      '[data-testid="confirmation_data-1-index-1"]',
    );
    const considerations = screen.getByTestId(
      'confirmation_data-consideration-index-3',
    );
    const considerationDetails0 = considerations.querySelector(
      '[data-testid="confirmation_data-0-index-0"]',
    );

    expect(offerDetails0).toBeInTheDocument();
    expect(offerDetails1).toBeInTheDocument();
    expect(considerations).toBeInTheDocument();
    expect(considerationDetails0).toBeInTheDocument();

    const details = [
      {
        element: offerDetails0 as HTMLElement,
        content: [
          'ItemType',
          '2',
          'Token',
          'MutantApeYachtClub',
          'IdentifierOrCriteria',
          '26464',
          'StartAmount',
          '0.01',
          'EndAmount',
          '0.01',
        ],
      },
      {
        element: offerDetails1 as HTMLElement,
        content: [
          'ItemType',
          '2',
          'Token',
          'MutantApeYachtClub',
          'IdentifierOrCriteria',
          '7779',
          'StartAmount',
          '0.01',
          'EndAmount',
          '0.01',
        ],
      },
      {
        element: considerationDetails0 as HTMLElement,
        content: [
          'ItemType',
          '2',
          'Token',
          'MutantApeYachtClub',
          'IdentifierOrCriteria',
          '26464',
          'StartAmount',
          '0.01',
          'EndAmount',
          '0.01',
          'Recipient',
          '0xDFdc0...25Cc1',
        ],
      },
    ];

    details.forEach(({ element, content }) => {
      if (element) {
        verifyDetails(element, content);
      }
    });
  });

  it('displays the trade order signature', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
      account.address,
      'TradeOrder',
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

    expect(
      screen.getByText(tEn('confirmTitleSignature') as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('confirmTitleDescSign') as string),
    ).toBeInTheDocument();

    const requestDetailsSection = screen.getByTestId(
      'confirmation_request-section',
    );

    const requestDetails = [
      'Request from',
      'metamask.github.io',
      'Interacting with',
      '0xDef1C...25EfF',
    ];

    expect(requestDetailsSection).toBeInTheDocument();
    verifyDetails(requestDetailsSection, requestDetails);

    const messageDetailsSection = screen.getByTestId(
      'confirmation_message-section',
    );
    expect(messageDetailsSection).toBeInTheDocument();

    const messageDetails = [
      'Message',
      'Primary type:',
      'ERC721Order',
      'Direction',
      '0',
      'Maker',
      '0x8Eeee...73D12',
      'Taker',
      '0xCD2a3...DD826',
      'Expiry',
      '2524604400',
      'Nonce',
      '100131415900000000000000000000000000000083840314483690155566137712510085002484',
      'Erc20Token',
      'Wrapped Ether',
      'Erc20TokenAmount',
      '42000000000000',
      'Fees',
      'Erc721Token',
      'Doodles',
      'Erc721TokenId',
      '2516',
      'Erc721TokenProperties',
    ];

    verifyDetails(messageDetailsSection, messageDetails);
  });
});
