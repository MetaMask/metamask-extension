import { renderHook, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { resetCoalesceCacheForTests } from '../../../../hooks/perps/coalesceBackgroundRequest';
import { getSelectedEvmInternalAccount } from '../../../../selectors';
import { getInternalAccounts } from '../../../../selectors/accounts';
import { getAllAccountGroups } from '../../../../selectors/multichain-accounts/account-tree';
import { selectPerpsCachedUserData } from '../../../../selectors/perps-controller';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';
import { usePerpsSubAccounts } from './usePerpsSubAccounts';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('./useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequest: jest.fn(() => undefined),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../../selectors/accounts', () => ({
  getInternalAccounts: jest.fn(),
}));

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getAllAccountGroups: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const EVM_ACCOUNT_1 = {
  id: 'acc-1',
  type: 'eip155:eoa',
  address: '0xabc',
};

const EVM_ACCOUNT_2 = {
  id: 'acc-2',
  type: 'eip155:eoa',
  address: '0xdef',
};

const NON_EVM_ACCOUNT = {
  id: 'acc-3',
  type: 'solana:data-account',
  address: 'SolAddr',
};

const GROUP_MAP = [
  { accounts: ['acc-1'], metadata: { name: 'Account 1' } },
  { accounts: ['acc-2'], metadata: { name: 'Account 2' } },
];

const ACCOUNT_STATE_DEFAULT = {
  spendableBalance: '100',
  withdrawableBalance: '50',
  totalBalance: '150',
};

function setupSelectorMock(
  accounts: unknown[] = [EVM_ACCOUNT_1, EVM_ACCOUNT_2, NON_EVM_ACCOUNT],
  groups: unknown[] = GROUP_MAP,
  {
    selectedEvmAccount,
    cachedUserData,
  }: {
    selectedEvmAccount?: unknown;
    cachedUserData?: unknown;
  } = {},
) {
  mockUseSelector.mockImplementation((selector) => {
    if (selector === getInternalAccounts) {
      return accounts;
    }
    if (selector === getAllAccountGroups) {
      return groups;
    }
    if (selector === getSelectedEvmInternalAccount) {
      return selectedEvmAccount;
    }
    if (selector === selectPerpsCachedUserData) {
      return cachedUserData ?? null;
    }
    return undefined;
  });
}

describe('usePerpsSubAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCoalesceCacheForTests();
    setupSelectorMock();
    mockSubmitRequestToBackground.mockResolvedValue(ACCOUNT_STATE_DEFAULT);
  });

  it('filters to EVM accounts only', async () => {
    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts).toHaveLength(2);
    });

    expect(result.current.subAccounts.map((account) => account.id)).toEqual([
      '0xabc',
      '0xdef',
    ]);
  });

  it('builds sub-account names from group metadata', async () => {
    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].name).toBe('Account 1 (Perps)');
    });

    expect(result.current.subAccounts[1].name).toBe('Account 2 (Perps)');
  });

  it('falls back to address when group metadata is missing', async () => {
    setupSelectorMock([EVM_ACCOUNT_1], []);

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].name).toBe('0xabc (Perps)');
    });
  });

  it('fetches balances from PerpsController', async () => {
    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts).toHaveLength(2);
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetAccountState',
      [{ standalone: true, userAddress: '0xabc' }],
    );
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetAccountState',
      [{ standalone: true, userAddress: '0xdef' }],
    );
  });

  it('does not select an account when fromAddress is not set', async () => {
    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts).toHaveLength(2);
    });

    expect(result.current.selectedSubAccount).toBeNull();
  });

  it('does not select an account when fromAddress is unmatched', async () => {
    jest.mocked(useTransactionMetadataRequest).mockReturnValue({
      txParams: { from: '0xdead' },
    } as never);

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts).toHaveLength(2);
    });

    expect(result.current.selectedSubAccount).toBeNull();
  });

  it('returns empty array when no EVM accounts exist', async () => {
    setupSelectorMock([NON_EVM_ACCOUNT], []);

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts).toHaveLength(0);
    });

    expect(result.current.selectedSubAccount).toBeNull();
  });

  it('shows empty balances until fetches resolve (not $0)', async () => {
    mockSubmitRequestToBackground.mockImplementation(
      () => new Promise(() => undefined),
    );

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalled();
    });

    expect(result.current.subAccounts[0].totalBalance).toBe('');
    expect(result.current.subAccounts[1].totalBalance).toBe('');
  });

  it('keeps balances unknown on fetch errors instead of faking $0', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalled();
    });

    // Retries once per account; still unresolved → empty (skeleton), not $0.
    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('');
      expect(result.current.subAccounts[1].totalBalance).toBe('');
    });
  });

  it('retries when HyperLiquid returns a non-numeric sentinel total', async () => {
    mockSubmitRequestToBackground
      .mockResolvedValueOnce({
        spendableBalance: '--',
        withdrawableBalance: '--',
        totalBalance: '--',
      })
      .mockResolvedValueOnce(ACCOUNT_STATE_DEFAULT)
      .mockResolvedValue(ACCOUNT_STATE_DEFAULT);

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('150');
    });
  });

  it('updates balances progressively as each account resolves', async () => {
    const resolvers: Record<string, (value: unknown) => void> = {};
    mockSubmitRequestToBackground.mockImplementation((_method, params) => {
      const userAddress = (params?.[0] as { userAddress?: string } | undefined)
        ?.userAddress;
      if (!userAddress) {
        return Promise.resolve(null);
      }
      return new Promise((resolve) => {
        resolvers[userAddress] = resolve;
      });
    });

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(resolvers['0xabc']).toBeDefined();
      expect(resolvers['0xdef']).toBeDefined();
    });

    expect(result.current.subAccounts[0].totalBalance).toBe('');
    expect(result.current.subAccounts[1].totalBalance).toBe('');

    resolvers['0xabc'](ACCOUNT_STATE_DEFAULT);

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('150');
    });
    expect(result.current.subAccounts[1].totalBalance).toBe('');

    resolvers['0xdef']({
      spendableBalance: '10',
      withdrawableBalance: '10',
      totalBalance: '10',
    });

    await waitFor(() => {
      expect(result.current.subAccounts[1].totalBalance).toBe('10');
    });
  });

  it('does not fetch balances when no EVM accounts', async () => {
    setupSelectorMock([], []);

    renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  it('selects account matching transactionMeta.txParams.from', async () => {
    jest.mocked(useTransactionMetadataRequest).mockReturnValue({
      txParams: { from: '0xdef' },
    } as never);

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts).toHaveLength(2);
    });

    expect(result.current.selectedSubAccount?.id).toBe('0xdef');
  });

  it('queries HyperLiquid with a lowercase user address', async () => {
    const mixedCaseAccount = {
      ...EVM_ACCOUNT_1,
      address: '0xAbC',
    };
    setupSelectorMock([mixedCaseAccount], GROUP_MAP);

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts).toHaveLength(1);
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetAccountState',
      [{ standalone: true, userAddress: '0xabc' }],
    );
  });

  it('uses connected account state when standalone returns zero for the selected account', async () => {
    setupSelectorMock([EVM_ACCOUNT_1, EVM_ACCOUNT_2], GROUP_MAP, {
      selectedEvmAccount: EVM_ACCOUNT_1,
    });
    mockSubmitRequestToBackground.mockImplementation((_method, params) => {
      if (!params?.[0]) {
        return Promise.resolve({
          spendableBalance: '999',
          withdrawableBalance: '999',
          totalBalance: '999',
        });
      }

      return Promise.resolve({
        spendableBalance: '0',
        withdrawableBalance: '0',
        totalBalance: '0',
      });
    });

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('999');
      expect(result.current.subAccounts[1].totalBalance).toBe('0');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetAccountState',
      [],
    );
  });

  it('fetches connected state again after the selected account changes', async () => {
    setupSelectorMock([EVM_ACCOUNT_1, EVM_ACCOUNT_2], GROUP_MAP, {
      selectedEvmAccount: EVM_ACCOUNT_1,
    });

    const { rerender } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(
        mockSubmitRequestToBackground.mock.calls.filter(
          ([, params]) => params?.length === 0,
        ),
      ).toHaveLength(1);
    });

    setupSelectorMock([EVM_ACCOUNT_1, EVM_ACCOUNT_2], GROUP_MAP, {
      selectedEvmAccount: EVM_ACCOUNT_2,
    });
    rerender();

    await waitFor(() => {
      expect(
        mockSubmitRequestToBackground.mock.calls.filter(
          ([, params]) => params?.length === 0,
        ),
      ).toHaveLength(2);
    });
  });

  it('overlays cached perps account state on the selected EVM account', async () => {
    setupSelectorMock([EVM_ACCOUNT_1, EVM_ACCOUNT_2], GROUP_MAP, {
      selectedEvmAccount: EVM_ACCOUNT_1,
      cachedUserData: {
        address: EVM_ACCOUNT_1.address,
        accountState: {
          spendableBalance: '42',
          withdrawableBalance: '42',
          totalBalance: '42',
        },
      },
    });
    mockSubmitRequestToBackground.mockImplementation((_method, params) => {
      if (!params?.[0]) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        spendableBalance: '0',
        withdrawableBalance: '0',
        totalBalance: '0',
      });
    });

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('42');
      expect(result.current.subAccounts[1].totalBalance).toBe('0');
    });
  });

  it('does not overlay cached state belonging to a different account', async () => {
    setupSelectorMock([EVM_ACCOUNT_1, EVM_ACCOUNT_2], GROUP_MAP, {
      selectedEvmAccount: EVM_ACCOUNT_1,
      cachedUserData: {
        address: EVM_ACCOUNT_2.address,
        accountState: {
          spendableBalance: '42',
          withdrawableBalance: '42',
          totalBalance: '42',
        },
      },
    });
    mockSubmitRequestToBackground.mockImplementation((_method, params) => {
      if (!params?.[0]) {
        return Promise.resolve({
          spendableBalance: '999',
          withdrawableBalance: '999',
          totalBalance: '999',
        });
      }

      return Promise.resolve({
        spendableBalance: '7',
        withdrawableBalance: '7',
        totalBalance: '7',
      });
    });

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('7');
      expect(result.current.subAccounts[1].totalBalance).toBe('7');
    });
  });

  it('lets a later standalone read replace an earlier higher total', async () => {
    setupSelectorMock([EVM_ACCOUNT_1], GROUP_MAP);
    mockSubmitRequestToBackground.mockResolvedValue({
      spendableBalance: '150',
      withdrawableBalance: '150',
      totalBalance: '150',
    });

    const { result, rerender } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('150');
    });

    resetCoalesceCacheForTests();
    mockSubmitRequestToBackground.mockResolvedValue({
      spendableBalance: '10',
      withdrawableBalance: '10',
      totalBalance: '10',
    });
    setupSelectorMock([{ ...EVM_ACCOUNT_1 }], GROUP_MAP);
    rerender();

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('10');
    });
  });

  it('prefers a lower connected total over a higher standalone total', async () => {
    setupSelectorMock([EVM_ACCOUNT_1], GROUP_MAP, {
      selectedEvmAccount: EVM_ACCOUNT_1,
    });
    mockSubmitRequestToBackground.mockImplementation((_method, params) => {
      if (!params?.[0]) {
        return Promise.resolve({
          spendableBalance: '40',
          withdrawableBalance: '40',
          totalBalance: '40',
        });
      }

      return Promise.resolve({
        spendableBalance: '90',
        withdrawableBalance: '90',
        totalBalance: '90',
      });
    });

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('40');
    });
  });

  it('preserves empty spendable and withdrawable when those fields are missing', async () => {
    mockSubmitRequestToBackground.mockResolvedValue({
      totalBalance: '150',
    });

    const { result } = renderHook(() => usePerpsSubAccounts());

    await waitFor(() => {
      expect(result.current.subAccounts[0].totalBalance).toBe('150');
    });

    expect(result.current.subAccounts[0].spendableBalance).toBe('');
    expect(result.current.subAccounts[0].withdrawableBalance).toBe('');
  });
});
