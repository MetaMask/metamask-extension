import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../../../test/lib/mock-ui-messenger';
import type { UIMessenger } from '../../../../messengers/ui-messenger';
import type { RouteMessenger } from '../../../../messengers/route-messenger';
import { createMockRouteMessenger } from '../../../../../test/lib/mock-route-messenger';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { useUpdate } from './useUpdate';

type RenderHookOptions = {
  state?: Record<string, unknown>;
  uiMessenger?: UIMessenger;
  routeMessenger?: RouteMessenger | false;
};

function renderHook({
  state = {},
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => useUpdate(),
    state,
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

describe('useUpdate', () => {
  it('returns an update function and approval ID', () => {
    const { result } = renderHook({
      state: {
        metamask: {
          pendingApprovals: {},
        },
      },
    });

    const [update, approvalId] = result.current;

    expect(typeof update).toBe('function');
    expect(approvalId).toBeNull();
  });

  it('calls the messenger to update a Snap and sets updating state', async () => {
    const callMock = jest.fn().mockResolvedValue(undefined);
    const messenger = createMockRouteMessenger({
      'SnapController:installSnaps': callMock,
    });

    const { result, waitForNextUpdate } = renderHook({
      state: {
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          pendingApprovals: {
            'approval-id-123': {
              id: 'approval-id-123',
              origin: 'https://example.com',
              type: 'wallet_updateSnap',
              requestData: {
                metadata: {
                  id: 'approval-id-123',
                },
              },
            },
          },
        },
      },
      routeMessenger: messenger,
    });

    const [update] = result.current;

    act(() => update({}));
    expect(callMock).toHaveBeenCalledWith('MetaMask', {});

    await waitForNextUpdate();

    const [, approvalId] = result.current;
    expect(approvalId).toBe('approval-id-123');
  });
});
