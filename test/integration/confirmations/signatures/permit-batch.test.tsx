import { act, fireEvent, screen } from '@testing-library/react';
import nock from 'nock';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { integrationTestRender } from '../../../lib/render-helpers';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { createMockImplementation } from '../../helpers';
import { tEn } from '../../../lib/i18n-helpers';
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

const renderPermitBatchSignature = async () => {
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
};

describe('Permit Batch Signature Tests', () => {
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

  it('renders the permit batch signature with correct titles', async () => {
    await renderPermitBatchSignature();

    expect(
      await screen.findByText(tEn('confirmTitlePermitTokens') as string),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(tEn('confirmTitleDescPermitSignature') as string),
    ).toBeInTheDocument();
  });

  it('displays the correct details in the simulation section', async () => {
    await renderPermitBatchSignature();

    const simulationSection = await screen.findByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();

    const simulationDetails = [
      'Estimated changes',
      "You're giving the spender permission to spend this many tokens from your account.",
      'Spending cap',
      '0xA0b86...6eB48',
      '1,461,501,637,3...',
      '0xb0B86...6EB48',
      '2,461,501,637,3...',
    ];

    verifyDetails(simulationSection, simulationDetails);
  });

  it('displays correct request and message details', async () => {
    await renderPermitBatchSignature();

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

    await act(async () => {
      fireEvent.click(await screen.findByTestId('sectionCollapseButton'));
    });

    const messageDetailsSection = await screen.findByTestId(
      'confirmation_message-section',
    );
    expect(messageDetailsSection).toBeInTheDocument();
    expect(messageDetailsSection).toHaveTextContent('Message');
    expect(messageDetailsSection).toHaveTextContent('Primary type:');
    expect(messageDetailsSection).toHaveTextContent('PermitBatch');

    const messageData0 = await screen.findByTestId(
      'confirmation_data-0-index-0',
    );
    const messageData1 = await screen.findByTestId(
      'confirmation_data-1-index-1',
    );
    expect(messageDetailsSection).toContainElement(messageData0);
    expect(messageDetailsSection).toContainElement(messageData1);

    const messageDetails = [
      {
        element: messageData0,
        content: [
          'Token',
          'USDC',
          'Amount',
          '1,461,501,637,3...',
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
          '2,461,501,637,3...',
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
});
