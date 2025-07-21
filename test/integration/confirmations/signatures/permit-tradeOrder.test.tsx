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

const renderTradeOrderSignature = async () => {
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
};

describe('Permit Trade Order Tests', () => {
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

  it('renders trade order signature with correct titles', async () => {
    await renderTradeOrderSignature();

    expect(
      await screen.findByText(tEn('confirmTitleSignature') as string),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(tEn('confirmTitleDescSign') as string),
    ).toBeInTheDocument();
  });

  it('displays correct details in request section', async () => {
    await renderTradeOrderSignature();

    const requestDetailsSection = await screen.findByTestId(
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
  });

  it('displays correct details in message section', async () => {
    await renderTradeOrderSignature();
    const messageDetailsSection = await screen.findByTestId(
      'confirmation_message-section',
    );
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

    expect(messageDetailsSection).toBeInTheDocument();
    verifyDetails(messageDetailsSection, messageDetails);
  });
});
