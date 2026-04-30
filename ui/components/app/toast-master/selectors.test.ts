import { EthAccountType } from '@metamask/keyring-api';
import { SolAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { selectShowConnectAccountToast } from './selectors';

// Mock the dependencies
jest.mock('../../../ducks/metamask/metamask', () => ({
  getAlertEnabledness: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getAllPermittedAccountsForCurrentTab: jest.fn(),
}));

jest.mock('../../../../shared/lib/multichain/chain-agnostic-permission-utils/caip-accounts', () => ({
  isInternalAccountInPermittedAccountIds: jest.fn(),
}));

import { getAlertEnabledness } from '../../../ducks/metamask/metamask';
import { getAllPermittedAccountsForCurrentTab } from '../../../selectors';
import { isInternalAccountInPermittedAccountIds } from '../../../../shared/lib/multichain/chain-agnostic-permission-utils/caip-accounts';

const mockGetAlertEnabledness = getAlertEnabledness as jest.MockedFunction<
  typeof getAlertEnabledness
>;
const mockGetAllPermittedAccountsForCurrentTab = getAllPermittedAccountsForCurrentTab as jest.MockedFunction<
  typeof getAllPermittedAccountsForCurrentTab
>;
const mockIsInternalAccountInPermittedAccountIds = isInternalAccountInPermittedAccountIds as jest.MockedFunction<
  typeof isInternalAccountInPermittedAccountIds
>;

describe('selectShowConnectAccountToast', () => {
  const mockState = {
    activeTab: { origin: 'https://example.com' },
  } as any;

  const mockEthAccount: InternalAccount = {
    id: 'eth-account-id',
    address: '0x1234567890abcdef',
    type: EthAccountType.Eoa,
    metadata: { name: 'Test ETH Account' },
    scopes: ['eip155:1'],
  } as InternalAccount;

  const mockSolanaAccount: InternalAccount = {
    id: 'solana-account-id', 
    address: 'SolanaAddress123',
    type: SolAccountType.DataAccount,
    metadata: { name: 'Test Solana Account' },
    scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  } as InternalAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows toast for disconnected Ethereum account when other accounts are connected', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true } as any);
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue(['eip155:1:0xother']);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const result = selectShowConnectAccountToast(mockState, mockEthAccount);

    expect(result).toBe(true);
    expect(mockGetAllPermittedAccountsForCurrentTab).toHaveBeenCalledWith(mockState);
    expect(mockIsInternalAccountInPermittedAccountIds).toHaveBeenCalledWith(
      mockEthAccount,
      ['eip155:1:0xother']
    );
  });

  it('shows toast for disconnected Solana account when other accounts are connected', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true } as any);
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue(['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:OtherSolanaAddress']);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const result = selectShowConnectAccountToast(mockState, mockSolanaAccount);

    expect(result).toBe(true);
    expect(mockGetAllPermittedAccountsForCurrentTab).toHaveBeenCalledWith(mockState);
    expect(mockIsInternalAccountInPermittedAccountIds).toHaveBeenCalledWith(
      mockSolanaAccount,
      ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:OtherSolanaAddress']
    );
  });

  it('does not show toast when account is already connected', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true } as any);
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue(['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:SolanaAddress123']);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(true);

    const result = selectShowConnectAccountToast(mockState, mockSolanaAccount);

    expect(result).toBe(false);
  });

  it('does not show toast when no accounts are connected', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true } as any);
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([]);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const result = selectShowConnectAccountToast(mockState, mockSolanaAccount);

    expect(result).toBe(false);
  });

  it('does not show toast when alert setting is disabled', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: false } as any);
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue(['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:OtherSolanaAddress']);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const result = selectShowConnectAccountToast(mockState, mockSolanaAccount);

    expect(result).toBe(false);
  });
});
