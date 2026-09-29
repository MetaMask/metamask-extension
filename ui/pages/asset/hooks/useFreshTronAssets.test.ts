import React from 'react';
import { renderHook, cleanup, waitFor } from '@testing-library/react';
import type { Transaction } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../../../store/background-connection';
import * as assetsUnifyStateSelectors from '../../../selectors/assets-unify-state';
import { useFreshTronAssets } from './useFreshTronAssets';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
  subscribeToMessengerEvent: jest.fn(),
}));

jest.mock('../../../selectors/assets-unify-state', () => ({
  ...jest.requireActual('../../../selectors/assets-unify-state'),
  getIsAssetsUnifyStateEnabled: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: <State, Result>(selector: (state: State) => Result): Result =>
    selector({} as State),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockSubscribeToMessengerEvent = jest.mocked(subscribeToMessengerEvent);

describe('useFreshTronAssets', () => {
  const chainId = MultichainNetworks.TRON;

  const mockAccount: InternalAccount = {
    id: 'test-account-id',
    address: 'TTestAddress123',
    type: 'tron:account',
    scopes: [MultichainNetworks.TRON],
    metadata: {
      name: 'Test Account',
      keyring: { type: 'HD Key Tree' },
    },
    methods: [],
  } as unknown as InternalAccount;

  const renderFreshTronAssetsHook = (
    account: InternalAccount | undefined,
    tronChainId: string,
  ) => renderHook(() => useFreshTronAssets(account, tronChainId));

  const mockSubscribe = () => {
    const unsubscribe = jest.fn().mockResolvedValue(undefined);
    mockSubscribeToMessengerEvent.mockResolvedValue(unsubscribe);
    return unsubscribe;
  };

  const getMessengerCall = () => {
    const call = mockSubmitRequestToBackground.mock.calls.find(
      ([method]) => method === 'messengerCall',
    );
    if (!call) {
      return undefined;
    }
    const [, [actionType, actionParams]] = call as [
      string,
      [string, [unknown, unknown]],
    ];
    return { actionType, actionParams };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    mockSubscribe();
    (
      assetsUnifyStateSelectors.getIsAssetsUnifyStateEnabled as unknown as jest.Mock
    ).mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches uncached assets when the hook mounts', () => {
    renderFreshTronAssetsHook(mockAccount, chainId);

    const messengerCall = getMessengerCall();
    expect(messengerCall).toStrictEqual({
      actionType: 'AssetsController:getAssets',
      actionParams: [
        [mockAccount],
        { chainIds: [chainId], forceUpdate: true, bypassServerCache: true },
      ],
    });
  });

  it('subscribes to confirmed multichain transactions', () => {
    renderFreshTronAssetsHook(mockAccount, chainId);

    expect(mockSubscribeToMessengerEvent).toHaveBeenCalledWith(
      'MultichainTransactionsController:transactionConfirmed',
      expect.any(Function),
    );
  });

  it('fetches uncached assets when a relevant transaction confirms', async () => {
    renderFreshTronAssetsHook(mockAccount, chainId);

    mockSubmitRequestToBackground.mockClear();
    const handler = mockSubscribeToMessengerEvent.mock.calls[0][1] as (
      payload: [Transaction],
    ) => void;

    handler([
      {
        id: 'tx-1',
        chain: chainId,
        account: mockAccount.id,
        status: 'confirmed',
        from: [{ address: mockAccount.address }],
        to: [],
        fees: [],
        events: [],
        type: 'send',
        timestamp: null,
      } as unknown as Transaction,
    ]);
    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalled();
    });

    expect(getMessengerCall()?.actionType).toBe('AssetsController:getAssets');
  });

  it('ignores transactions on other chains', () => {
    const { unmount } = renderFreshTronAssetsHook(mockAccount, chainId);
    mockSubmitRequestToBackground.mockClear();

    const handler = mockSubscribeToMessengerEvent.mock.calls[0][1] as (
      payload: [Transaction],
    ) => void;

    handler([
      {
        chain: 'solana:mainnet',
        account: mockAccount.id,
      } as unknown as Transaction,
    ]);
    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('ignores transactions from other accounts', () => {
    const { unmount } = renderFreshTronAssetsHook(mockAccount, chainId);
    mockSubmitRequestToBackground.mockClear();

    const handler = mockSubscribeToMessengerEvent.mock.calls[0][1] as (
      payload: [Transaction],
    ) => void;

    handler([
      {
        chain: chainId,
        account: 'other-account-id',
      } as unknown as Transaction,
    ]);
    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('does not fetch when the assets unify state flag is disabled', () => {
    (
      assetsUnifyStateSelectors.getIsAssetsUnifyStateEnabled as unknown as jest.Mock
    ).mockReturnValue(false);

    renderFreshTronAssetsHook(mockAccount, chainId);

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    expect(mockSubscribeToMessengerEvent).not.toHaveBeenCalled();
  });

  it('does not fetch for non-Tron chains', () => {
    renderFreshTronAssetsHook(mockAccount, 'eip155:1');

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    expect(mockSubscribeToMessengerEvent).not.toHaveBeenCalled();
  });

  it('does not fetch when there is no account', () => {
    renderFreshTronAssetsHook(undefined, chainId);

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    expect(mockSubscribeToMessengerEvent).not.toHaveBeenCalled();
  });

  it('unsubscribes from transaction confirmations when the hook unmounts', async () => {
    const unsubscribe = mockSubscribe();
    const { unmount } = renderFreshTronAssetsHook(mockAccount, chainId);

    unmount();
    await waitFor(() => {
      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  it('unsubscribes when unmounting before the subscription resolves', async () => {
    const unsubscribe = jest.fn().mockResolvedValue(undefined);

    let resolveSubscribe!: (off: () => Promise<void>) => void;
    mockSubscribeToMessengerEvent.mockReturnValue(
      new Promise((resolve) => {
        resolveSubscribe = resolve;
      }),
    );
    const { unmount } = renderFreshTronAssetsHook(mockAccount, chainId);

    unmount();
    resolveSubscribe(unsubscribe);

    await waitFor(() => {
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
