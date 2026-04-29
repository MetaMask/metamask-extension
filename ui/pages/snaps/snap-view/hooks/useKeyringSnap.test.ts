import { waitFor } from '@testing-library/react';
import { KeyringType } from '@metamask/keyring-api';
import type { SnapId } from '@metamask/snaps-sdk';
import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers-navigate';
import { createMockRouteMessenger } from '../../../../../test/lib/mock-route-messenger';
import type { UIMessengerActions } from '../../../../messengers/ui-messenger';
import { useKeyringSnap } from './useKeyringSnap';

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

type GetKeyringsByTypeAction = Extract<
  UIMessengerActions,
  { type: 'KeyringController:getKeyringsByType' }
>;

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
  getKeyringsByType?: GetKeyringsByTypeAction['handler'];
};

function renderHook({
  state = buildState(),
  snapId = MOCK_SNAP_ID,
  isKeyringSnap = true,
  getKeyringsByType = jest.fn().mockResolvedValue([]),
}: RenderHookOptions = {}) {
  const messenger = createMockRouteMessenger<GetKeyringsByTypeAction>({
    'KeyringController:getKeyringsByType': getKeyringsByType,
  });

  return renderHookWithProviderTyped(
    () => useKeyringSnap(snapId, isKeyringSnap),
    state,
    '/',
    undefined,
    jest.fn(),
    undefined,
    messenger,
  );
}

describe('useKeyringSnap', () => {
  it('returns an empty array initially', () => {
    const { result } = renderHook();

    expect(result.current).toStrictEqual([]);
  });

  it('does not call the messenger when `isKeyringSnap` is false', () => {
    const getKeyringsByType = jest.fn().mockResolvedValue([]);

    renderHook({ isKeyringSnap: false, getKeyringsByType });

    expect(getKeyringsByType).not.toHaveBeenCalled();
  });

  it('returns an empty array when no Snap keyring is found', async () => {
    const { result } = renderHook({
      getKeyringsByType: jest.fn().mockResolvedValue([]),
      state: buildState({ 'account-1': MOCK_ACCOUNT_1 }),
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual([]);
    });
  });

  it('returns the accounts associated with the Snap', async () => {
    const mockKeyring = {
      getAccountsBySnapId: jest.fn().mockResolvedValue([MOCK_ADDRESS_1]),
    };

    const { result } = renderHook({
      getKeyringsByType: jest.fn().mockResolvedValue([mockKeyring]),
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
    const mockKeyring = {
      getAccountsBySnapId: jest
        .fn()
        .mockResolvedValue([MOCK_ADDRESS_1, MOCK_ADDRESS_2]),
    };

    const { result } = renderHook({
      getKeyringsByType: jest.fn().mockResolvedValue([mockKeyring]),
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
