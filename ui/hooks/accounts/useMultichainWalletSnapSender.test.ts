import { renderHook } from '@testing-library/react-hooks';
import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import type { JsonRpcRequest } from '@metamask/utils';
import { handleSnapRequest } from '../../store/actions';
import {
  MultichainWalletSnapSender,
  useMultichainWalletSnapSender,
} from './useMultichainWalletSnapSender';

jest.mock('../../store/actions', () => ({
  handleSnapRequest: jest.fn(),
}));

const mockHandleSnapRequest = handleSnapRequest as jest.MockedFunction<
  typeof handleSnapRequest
>;

describe('MultichainWalletSnapSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('sends keyring requests to the configured Snap', async () => {
      const snapId = 'npm:@metamask/example-snap' as SnapId;
      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'keyring_submitRequest',
        params: { account: 'solana-account-id' },
      } as JsonRpcRequest;
      const response = { result: 'ok' };
      mockHandleSnapRequest.mockResolvedValue(response);

      const sender = new MultichainWalletSnapSender(snapId);

      await expect(sender.send(request)).resolves.toStrictEqual(response);
      expect(mockHandleSnapRequest).toHaveBeenCalledTimes(1);
      expect(mockHandleSnapRequest).toHaveBeenCalledWith({
        origin: 'metamask',
        snapId,
        handler: HandlerType.OnKeyringRequest,
        request,
      });
    });
  });
});

describe('useMultichainWalletSnapSender', () => {
  it('memoizes the sender until the Snap ID changes', () => {
    const snapId = 'npm:@metamask/example-snap' as SnapId;
    const nextSnapId = 'npm:@metamask/next-example-snap' as SnapId;
    const { result, rerender } = renderHook(
      ({ currentSnapId }: { currentSnapId: SnapId }) =>
        useMultichainWalletSnapSender(currentSnapId),
      {
        initialProps: { currentSnapId: snapId },
      },
    );
    const initialSender = result.current;

    expect(initialSender).toBeInstanceOf(MultichainWalletSnapSender);

    rerender({ currentSnapId: snapId });

    expect(result.current).toBe(initialSender);

    rerender({ currentSnapId: nextSnapId });

    expect(result.current).toBeInstanceOf(MultichainWalletSnapSender);
    expect(result.current).not.toBe(initialSender);
  });
});
