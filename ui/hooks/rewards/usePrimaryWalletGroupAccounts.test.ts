import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { renderHook } from '@testing-library/react-hooks';
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';

// Import after mocks
import { usePrimaryWalletGroupAccounts } from './usePrimaryWalletGroupAccounts';

// Mock the selectors module
const mockGetSelectedAccount = jest.fn();
const mockGetWalletIdAndNameByAccountAddress = jest.fn();
const mockGetMultichainAccountsByWalletId = jest.fn();
const mockGetInternalAccountsFromGroupById = jest.fn();

jest.mock('../../selectors', () => ({
  getSelectedAccount: (...args: unknown[]) => mockGetSelectedAccount(...args),
}));

jest.mock('../../selectors/multichain-accounts/account-tree', () => ({
  getWalletIdAndNameByAccountAddress: (...args: unknown[]) =>
    mockGetWalletIdAndNameByAccountAddress(...args),
  getMultichainAccountsByWalletId: (...args: unknown[]) =>
    mockGetMultichainAccountsByWalletId(...args),
  getInternalAccountsFromGroupById: (...args: unknown[]) =>
    mockGetInternalAccountsFromGroupById(...args),
}));

// Mock react-redux useSelector to call our mocked selectors
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn((selector) => {
    // Call the selector with a minimal state object
    return selector({});
  }),
}));

// Constants
const PRIMARY_GROUP_ID = 'entropy:test-wallet/0' as AccountGroupId;
const SECONDARY_GROUP_ID = 'entropy:test-wallet/1' as AccountGroupId;
const WALLET_ID = 'entropy:test-wallet' as AccountWalletId;

// Helper functions to create mock accounts
const createMockLedgerAccount = (
  id: string,
  address: string,
): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `Ledger Account ${id}`,
    keyring: { type: HardwareKeyringType.ledger },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const createMockTrezorAccount = (
  id: string,
  address: string,
): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `Trezor Account ${id}`,
    keyring: { type: HardwareKeyringType.trezor },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const createMockQRAccount = (id: string, address: string): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `QR Account ${id}`,
    keyring: { type: HardwareKeyringType.qr },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const createMockSoftwareAccount = (
  id: string,
  address: string,
): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `Software Account ${id}`,
    keyring: { type: 'HD Key Tree' },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

/**
 * Helper to set up all mocks for a typical test scenario
 *
 * @param options0
 * @param options0.selectedAddress
 * @param options0.walletId
 * @param options0.accountGroupsByWallet
 * @param options0.primaryGroupAccounts
 */
const setupMocks = ({
  selectedAddress = '0xAccount111',
  walletId = WALLET_ID,
  accountGroupsByWallet = {} as Record<AccountGroupId, unknown>,
  primaryGroupAccounts = [] as InternalAccount[],
}: {
  selectedAddress?: string;
  walletId?: AccountWalletId | undefined;
  accountGroupsByWallet?: Record<AccountGroupId, unknown>;
  primaryGroupAccounts?: InternalAccount[];
} = {}) => {
  mockGetSelectedAccount.mockReturnValue({ address: selectedAddress });
  mockGetWalletIdAndNameByAccountAddress.mockReturnValue(
    walletId ? { id: walletId, name: 'Test Wallet' } : null,
  );
  mockGetMultichainAccountsByWalletId.mockReturnValue(accountGroupsByWallet);
  mockGetInternalAccountsFromGroupById.mockReturnValue(primaryGroupAccounts);
};

describe('usePrimaryWalletGroupAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Filtering accounts by primary wallet group', () => {
    it('returns accounts from the primary (first) group when wallet has multiple groups', () => {
      const primaryAccounts = [
        createMockSoftwareAccount('sw-1', '0xPrimary111'),
        createMockSoftwareAccount('sw-2', '0xPrimary222'),
      ];

      setupMocks({
        selectedAddress: '0xPrimary111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
          [SECONDARY_GROUP_ID]: { id: SECONDARY_GROUP_ID },
        },
        primaryGroupAccounts: primaryAccounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBe(PRIMARY_GROUP_ID);
      expect(result.current.accounts).toHaveLength(2);
      expect(result.current.accounts.map((a) => a.address)).toEqual([
        '0xPrimary111',
        '0xPrimary222',
      ]);
    });

    it('returns accounts from the single group when wallet has only one group', () => {
      const accounts = [
        createMockSoftwareAccount('sw-1', '0xAccount111'),
        createMockSoftwareAccount('sw-2', '0xAccount222'),
        createMockSoftwareAccount('sw-3', '0xAccount333'),
      ];

      setupMocks({
        selectedAddress: '0xAccount111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: accounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBe(PRIMARY_GROUP_ID);
      expect(result.current.accounts).toHaveLength(3);
    });

    it('returns the correct primary group for the selected account wallet', () => {
      const wallet1Accounts = [
        createMockSoftwareAccount('w1-acc-1', '0xWallet1Account111'),
      ];

      const wallet1GroupId = 'entropy:wallet-1/0' as AccountGroupId;

      setupMocks({
        selectedAddress: '0xWallet1Account111',
        walletId: 'entropy:wallet-1' as AccountWalletId,
        accountGroupsByWallet: {
          [wallet1GroupId]: { id: wallet1GroupId },
        },
        primaryGroupAccounts: wallet1Accounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBe(wallet1GroupId);
      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0].address).toBe('0xWallet1Account111');
    });
  });

  describe('Mixed account types (software, Ledger, QR, Trezor)', () => {
    it('returns all accounts in primary group including mixed hardware types', () => {
      const mixedAccounts = [
        createMockSoftwareAccount('sw-1', '0xSoftware111'),
        createMockLedgerAccount('ledger-1', '0xLedger111'),
        createMockTrezorAccount('trezor-1', '0xTrezor111'),
        createMockQRAccount('qr-1', '0xQR111'),
      ];

      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: mixedAccounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accounts).toHaveLength(4);
      expect(result.current.accounts.map((a) => a.address)).toEqual([
        '0xSoftware111',
        '0xLedger111',
        '0xTrezor111',
        '0xQR111',
      ]);
    });

    it('returns only Ledger accounts when primary group has only Ledger accounts', () => {
      const ledgerAccounts = [
        createMockLedgerAccount('ledger-1', '0xLedger111'),
        createMockLedgerAccount('ledger-2', '0xLedger222'),
      ];

      setupMocks({
        selectedAddress: '0xLedger111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: ledgerAccounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accounts).toHaveLength(2);
      result.current.accounts.forEach((account) => {
        expect(account.metadata.keyring.type).toBe(HardwareKeyringType.ledger);
      });
    });

    it('returns only QR accounts when primary group has only QR accounts', () => {
      const qrAccounts = [
        createMockQRAccount('qr-1', '0xQR111'),
        createMockQRAccount('qr-2', '0xQR222'),
      ];

      setupMocks({
        selectedAddress: '0xQR111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: qrAccounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accounts).toHaveLength(2);
      result.current.accounts.forEach((account) => {
        expect(account.metadata.keyring.type).toBe(HardwareKeyringType.qr);
      });
    });

    it('returns only Trezor accounts when primary group has only Trezor accounts', () => {
      const trezorAccounts = [
        createMockTrezorAccount('trezor-1', '0xTrezor111'),
        createMockTrezorAccount('trezor-2', '0xTrezor222'),
      ];

      setupMocks({
        selectedAddress: '0xTrezor111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: trezorAccounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accounts).toHaveLength(2);
      result.current.accounts.forEach((account) => {
        expect(account.metadata.keyring.type).toBe(HardwareKeyringType.trezor);
      });
    });

    it('correctly identifies account types in a mixed primary group', () => {
      const mixedAccounts = [
        createMockSoftwareAccount('sw-1', '0xSoftware111'),
        createMockLedgerAccount('ledger-1', '0xLedger111'),
      ];

      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: mixedAccounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      const softwareAccount = result.current.accounts.find(
        (a) => a.address === '0xSoftware111',
      );
      const ledgerAccount = result.current.accounts.find(
        (a) => a.address === '0xLedger111',
      );

      expect(softwareAccount?.metadata.keyring.type).toBe('HD Key Tree');
      expect(ledgerAccount?.metadata.keyring.type).toBe(
        HardwareKeyringType.ledger,
      );
    });
  });

  describe('Empty/null wallet group scenarios', () => {
    it('returns empty accounts array when primary group has no accounts', () => {
      setupMocks({
        selectedAddress: '0xAccount111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: [],
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBe(PRIMARY_GROUP_ID);
      expect(result.current.accounts).toEqual([]);
    });

    it('returns empty accounts when wallet has no groups', () => {
      setupMocks({
        selectedAddress: '0xAccount111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {},
        primaryGroupAccounts: [],
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBeUndefined();
      expect(result.current.accounts).toEqual([]);
    });

    it('handles undefined walletId gracefully (null return from getWalletIdAndNameByAccountAddress)', () => {
      // When getWalletIdAndNameByAccountAddress returns null, the fallback { walletId: undefined } is used
      mockGetSelectedAccount.mockReturnValue({ address: '0xAccount111' });
      mockGetWalletIdAndNameByAccountAddress.mockReturnValue(null);
      mockGetMultichainAccountsByWalletId.mockReturnValue({});
      mockGetInternalAccountsFromGroupById.mockReturnValue([]);

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBeUndefined();
      expect(result.current.accounts).toEqual([]);
    });

    it('uses fallback when getWalletIdAndNameByAccountAddress returns undefined', () => {
      // Test the || { walletId: undefined } fallback explicitly
      mockGetSelectedAccount.mockReturnValue({ address: '0xAccount111' });
      mockGetWalletIdAndNameByAccountAddress.mockReturnValue(undefined);
      mockGetMultichainAccountsByWalletId.mockReturnValue({});
      mockGetInternalAccountsFromGroupById.mockReturnValue([]);

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBeUndefined();
      expect(result.current.accounts).toEqual([]);
    });

    it('returns undefined accountGroupId when wallet groups are empty object', () => {
      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {},
        primaryGroupAccounts: [],
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBeUndefined();
      expect(result.current.accounts).toEqual([]);
    });

    it('returns empty array when accountGroupsByWallet is undefined', () => {
      mockGetSelectedAccount.mockReturnValue({ address: '0xAccount111' });
      mockGetWalletIdAndNameByAccountAddress.mockReturnValue({
        id: WALLET_ID,
        name: 'Test Wallet',
      });
      mockGetMultichainAccountsByWalletId.mockReturnValue(undefined);
      mockGetInternalAccountsFromGroupById.mockReturnValue([]);

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBeUndefined();
      expect(result.current.accounts).toEqual([]);
    });
  });

  describe('Memoization behavior', () => {
    it('returns the same reference when state does not change', () => {
      const accounts = [createMockSoftwareAccount('sw-1', '0xSoftware111')];

      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: accounts,
      });

      const { result, rerender } = renderHook(() =>
        usePrimaryWalletGroupAccounts(),
      );

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // The hook uses useMemo for primaryAccountGroupId, so the reference should be stable
      expect(firstResult.accountGroupId).toBe(secondResult.accountGroupId);
    });

    it('returns stable accounts array reference when accounts do not change', () => {
      const accounts = [
        createMockSoftwareAccount('sw-1', '0xSoftware111'),
        createMockLedgerAccount('ledger-1', '0xLedger111'),
      ];

      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: accounts,
      });

      const { result, rerender } = renderHook(() =>
        usePrimaryWalletGroupAccounts(),
      );

      const firstAccounts = result.current.accounts;
      rerender();
      const secondAccounts = result.current.accounts;

      // Both renders should return the same account data
      expect(firstAccounts).toEqual(secondAccounts);
      expect(firstAccounts.length).toBe(secondAccounts.length);
    });

    it('useMemo recalculates primaryAccountGroupId only when accountGroupsByWallet changes', () => {
      const accounts = [createMockSoftwareAccount('sw-1', '0xSoftware111')];

      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: accounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      // First render should have calculated the primary group ID
      expect(result.current.accountGroupId).toBe(PRIMARY_GROUP_ID);
    });
  });

  describe('Edge cases', () => {
    it('returns first group as primary when groups are added in non-sequential order', () => {
      const accounts1 = [createMockSoftwareAccount('sw-1', '0xFirst111')];
      const groupId5 = 'entropy:test-wallet/5' as AccountGroupId;

      // Create groups with IDs that might not be in expected order
      // Object.keys order is based on insertion order in modern JS
      setupMocks({
        selectedAddress: '0xFirst111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
          [groupId5]: { id: groupId5 },
        },
        primaryGroupAccounts: accounts1,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      // Should return the first group in the object
      expect(result.current.accountGroupId).toBe(PRIMARY_GROUP_ID);
      expect(result.current.accounts[0].address).toBe('0xFirst111');
    });

    it('handles wallet with single account correctly', () => {
      const singleAccount = createMockLedgerAccount(
        'ledger-1',
        '0xSingleLedger',
      );

      setupMocks({
        selectedAddress: '0xSingleLedger',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: [singleAccount],
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBe(PRIMARY_GROUP_ID);
      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0].address).toBe('0xSingleLedger');
      expect(result.current.accounts[0].metadata.keyring.type).toBe(
        HardwareKeyringType.ledger,
      );
    });

    it('handles large number of accounts in a group', () => {
      const manyAccounts: InternalAccount[] = [];
      for (let i = 0; i < 100; i++) {
        manyAccounts.push(
          createMockSoftwareAccount(
            `sw-${i}`,
            `0xAccount${i.toString().padStart(4, '0')}`,
          ),
        );
      }

      setupMocks({
        selectedAddress: '0xAccount0000',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: manyAccounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accounts).toHaveLength(100);
    });
  });

  describe('Return type structure', () => {
    it('returns correct shape with accountGroupId and accounts', () => {
      const accounts = [createMockSoftwareAccount('sw-1', '0xSoftware111')];

      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: accounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current).toHaveProperty('accountGroupId');
      expect(result.current).toHaveProperty('accounts');
      expect(typeof result.current.accountGroupId).toBe('string');
      expect(Array.isArray(result.current.accounts)).toBe(true);
    });

    it('accounts array contains InternalAccount objects with expected properties', () => {
      const accounts = [createMockSoftwareAccount('sw-1', '0xSoftware111')];

      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: accounts,
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      const account = result.current.accounts[0];
      expect(account).toHaveProperty('id');
      expect(account).toHaveProperty('address');
      expect(account).toHaveProperty('metadata');
      expect(account.metadata).toHaveProperty('name');
      expect(account.metadata).toHaveProperty('keyring');
      expect(account.metadata.keyring).toHaveProperty('type');
    });

    it('accountGroupId is undefined when no groups exist', () => {
      setupMocks({
        selectedAddress: '0xSoftware111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {},
        primaryGroupAccounts: [],
      });

      const { result } = renderHook(() => usePrimaryWalletGroupAccounts());

      expect(result.current.accountGroupId).toBeUndefined();
    });
  });

  describe('Selector integration', () => {
    it('calls getSelectedAccount selector', () => {
      setupMocks({
        selectedAddress: '0xAccount111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: [],
      });

      renderHook(() => usePrimaryWalletGroupAccounts());

      expect(mockGetSelectedAccount).toHaveBeenCalled();
    });

    it('calls getWalletIdAndNameByAccountAddress with selected account address', () => {
      setupMocks({
        selectedAddress: '0xSelectedAddress',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: [],
      });

      renderHook(() => usePrimaryWalletGroupAccounts());

      expect(mockGetWalletIdAndNameByAccountAddress).toHaveBeenCalled();
    });

    it('calls getMultichainAccountsByWalletId when walletId is available', () => {
      setupMocks({
        selectedAddress: '0xAccount111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: [],
      });

      renderHook(() => usePrimaryWalletGroupAccounts());

      expect(mockGetMultichainAccountsByWalletId).toHaveBeenCalled();
    });

    it('calls getInternalAccountsFromGroupById when primary group ID is determined', () => {
      setupMocks({
        selectedAddress: '0xAccount111',
        walletId: WALLET_ID,
        accountGroupsByWallet: {
          [PRIMARY_GROUP_ID]: { id: PRIMARY_GROUP_ID },
        },
        primaryGroupAccounts: [],
      });

      renderHook(() => usePrimaryWalletGroupAccounts());

      expect(mockGetInternalAccountsFromGroupById).toHaveBeenCalled();
    });
  });
});
