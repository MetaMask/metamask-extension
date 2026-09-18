import { waitFor } from '@testing-library/react';
import type { SnapId } from '@metamask/snaps-sdk';
import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers-navigate';
import { getSnapAccountsById } from '../../../../store/actions';
import { useKeyringSnap } from './useKeyringSnap';

jest.mock('../../../../store/actions', () => ({
  getSnapAccountsById: jest.fn(),
}));

const MOCK_SNAP_ID = 'npm:@metamask/test-snap' as SnapId;
const MOCK_ADDRESS_1 = '0xabc123';
const MOCK_ADDRESS_2 = '0xdef456';

const MOCK_ACCOUNT_1 = {
  id: 'account-1',
  address: MOCK_ADDRESS_1,
};

const MOCK_ACCOUNT_2 = {
  id: 'account-2',
  address: MOCK_ADDRESS_2,
};

function buildState(
  accounts: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    metamask: {
      internalAccounts: { accounts },
    },
  };
}

type RenderHookOptions = {
  state?: Record<string, unknown>;
  snapId?: SnapId;
  isKeyringSnap?: boolean;
};

function renderHook({
  state = buildState(),
  snapId = MOCK_SNAP_ID,
  isKeyringSnap = true,
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => useKeyringSnap(snapId, isKeyringSnap),
    state,
  );
}

describe('useKeyringSnap', () => {
  beforeEach(() => {
    jest.mocked(getSnapAccountsById).mockClear();
    jest.mocked(getSnapAccountsById).mockResolvedValue([]);
  });

  it('returns an empty array initially', async () => {
    const { result } = renderHook();

    await waitFor(() => {
      expect(result.current).toStrictEqual([]);
    });
  });

  it('does not fetch accounts when `isKeyringSnap` is false', () => {
    renderHook({ isKeyringSnap: false });

    expect(getSnapAccountsById).not.toHaveBeenCalled();
  });

  it('returns an empty array when the Snap has no accounts', async () => {
    const { result } = renderHook({
      state: buildState({ 'account-1': MOCK_ACCOUNT_1 }),
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual([]);
    });
  });

  it('returns the accounts associated with the Snap', async () => {
    jest.mocked(getSnapAccountsById).mockResolvedValue([MOCK_ADDRESS_1]);

    const { result } = renderHook({
      state: buildState({
        'account-1': MOCK_ACCOUNT_1,
        'account-2': MOCK_ACCOUNT_2,
      }),
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual([MOCK_ACCOUNT_1]);
    });
  });

  it('returns multiple accounts when the Snap has multiple accounts', async () => {
    jest
      .mocked(getSnapAccountsById)
      .mockResolvedValue([MOCK_ADDRESS_1, MOCK_ADDRESS_2]);

    const { result } = renderHook({
      state: buildState({
        'account-1': MOCK_ACCOUNT_1,
        'account-2': MOCK_ACCOUNT_2,
      }),
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual([MOCK_ACCOUNT_1, MOCK_ACCOUNT_2]);
    });
  });
});
