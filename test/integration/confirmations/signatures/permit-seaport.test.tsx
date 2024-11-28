import { act, screen } from '@testing-library/react';
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

const renderSeaportSignature = async () => {
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
};

describe('Permit Seaport Tests', () => {
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

  it('renders seaport signature', async () => {
    await renderSeaportSignature();

    expect(
      await screen.findByText(tEn('confirmTitleSignature') as string),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(tEn('confirmTitleDescSign') as string),
    ).toBeInTheDocument();
  });

  it('renders request details section', async () => {
    await renderSeaportSignature();

    const requestDetailsSection = await screen.findByTestId(
      'confirmation_request-section',
    );

    expect(requestDetailsSection).toBeInTheDocument();
    expect(requestDetailsSection).toHaveTextContent('Request from');
    expect(requestDetailsSection).toHaveTextContent('metamask.github.io');
    expect(requestDetailsSection).toHaveTextContent('Interacting with');
    expect(requestDetailsSection).toHaveTextContent('0x00000...78BA3');
  });

  it('renders message details section', async () => {
    await renderSeaportSignature();

    const messageDetailsSection = await screen.findByTestId(
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
  });

  it('renders offer and consideration details', async () => {
    await renderSeaportSignature();

    const offers = await screen.findByTestId('confirmation_data-offer-index-2');
    const offerDetails0 = offers.querySelector(
      '[data-testid="confirmation_data-0-index-0"]',
    );
    const offerDetails1 = offers.querySelector(
      '[data-testid="confirmation_data-1-index-1"]',
    );
    const considerations = await screen.findByTestId(
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
          '1',
          'EndAmount',
          '1',
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
          '1',
          'EndAmount',
          '1',
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
          '1',
          'EndAmount',
          '1',
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
});
