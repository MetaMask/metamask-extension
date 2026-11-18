import { describe } from '@jest/globals';
import { act, screen, waitFor } from '@testing-library/react';
import nock from 'nock';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { tEn } from '../../../lib/i18n-helpers';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation } from '../../helpers';
import {
  getMetaMaskStateWithUnapprovedPermitSign,
  verifyDetails,
} from './signature-helpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const renderTransferAuthorizationSignature = async (
  primaryType: 'TransferWithAuthorization' | 'ReceiveWithAuthorization',
) => {
  const account =
    mockMetaMaskState.internalAccounts.accounts[
      mockMetaMaskState.internalAccounts
        .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
    ];

  const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPermitSign(
    account.address,
    primaryType,
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
};

describe.each([
  'TransferWithAuthorization',
  'ReceiveWithAuthorization',
] as const)('%s Signature Tests', (primaryType) => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      createMockImplementation({
        'LegacyBackgroundApiService:getTokenStandardAndDetailsByChain': {
          decimals: '6',
          standard: 'ERC20',
        },
      }),
    );
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('renders as a signature request rather than a spending cap', async () => {
    await renderTransferAuthorizationSignature(primaryType);

    expect(
      await screen.findByText(tEn('confirmTitleSignature') as string),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(tEn('confirmTitlePermitTokens') as string),
    ).not.toBeInTheDocument();
  });

  it('displays correct details in request section', async () => {
    await renderTransferAuthorizationSignature(primaryType);

    const requestDetailsSection = await screen.findByTestId(
      'confirmation_request-section',
    );

    verifyDetails(requestDetailsSection, [
      'Request from',
      'metamask.github.io',
      'Interacting with',
    ]);
    expect(requestDetailsSection).not.toHaveTextContent('Spender');
  });

  it('displays correct details in message section', async () => {
    await renderTransferAuthorizationSignature(primaryType);

    const messageDetailsSection = await screen.findByTestId(
      'confirmation_message-section',
    );
    verifyDetails(messageDetailsSection, ['Primary type:', primaryType]);

    await waitFor(() => {
      expect(
        screen.getByTestId('confirmation_data-value-index-2'),
      ).toHaveTextContent(/^Value:1,000$/u);
    });
    expect(
      screen.getByTestId('confirmation_data-validAfter-index-3'),
    ).toHaveTextContent('ValidAfter:14 November 2023, 22:13');
    expect(
      screen.getByTestId('confirmation_data-validBefore-index-4'),
    ).toHaveTextContent('ValidBefore:15 January 2027, 08:00');
  });
});
