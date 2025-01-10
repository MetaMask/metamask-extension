import { act, fireEvent, screen } from '@testing-library/react';
import nock from 'nock';
import { useAssetDetails } from '../../../../ui/pages/confirmations/hooks/useAssetDetails';
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

jest.mock('../../../../ui/pages/confirmations/hooks/useAssetDetails', () => ({
  ...jest.requireActual(
    '../../../../ui/pages/confirmations/hooks/useAssetDetails',
  ),
  useAssetDetails: jest.fn().mockResolvedValue({
    decimals: '4',
  }),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};
const mockedAssetDetails = jest.mocked(useAssetDetails);

const renderSingleBatchSignature = async () => {
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
};

describe('Permit Single Signature Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      createMockImplementation({
        getTokenStandardAndDetails: { decimals: '2' },
      }),
    );
    mockedAssetDetails.mockImplementation(() => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('renders permit single signature with correct titles', async () => {
    await renderSingleBatchSignature();

    expect(
      await screen.findByText(tEn('confirmTitlePermitTokens') as string),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(tEn('confirmTitleDescPermitSignature') as string),
    ).toBeInTheDocument();
  });

  it('displays correct details in simulation section', async () => {
    await renderSingleBatchSignature();

    const simulationSection = await screen.findByTestId(
      'confirmation__simulation_section',
    );
    const simulationDetails = [
      'Estimated changes',
      "You're giving the spender permission to spend this many tokens from your account.",
      'Spending cap',
      '0xA0b86...6eB48',
      'Unlimited',
    ];

    expect(simulationSection).toBeInTheDocument();
    verifyDetails(simulationSection, simulationDetails);
  });

  it('displays correct details in request section', async () => {
    await renderSingleBatchSignature();

    const requestDetailsSection = await screen.findByTestId(
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
  });

  it('displays correct details in message section', async () => {
    await renderSingleBatchSignature();
    act(async () => {
      fireEvent.click(await screen.findByTestId('sectionCollapseButton'));
    });

    const messageDetailsSection = await screen.findByTestId(
      'confirmation_message-section',
    );
    const messageDetails = ['Message', 'Primary type:', 'PermitSingle'];

    expect(messageDetailsSection).toBeInTheDocument();
    verifyDetails(messageDetailsSection, messageDetails);

    const messageData0 = await screen.findByTestId(
      'confirmation_data-details-index-0',
    );
    const messageData0Details = [
      'Token',
      'USDC',
      'Amount',
      '1,461,501,637,3...',
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
});
