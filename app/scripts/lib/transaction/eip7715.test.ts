import { Hex, JsonRpcRequest } from '@metamask/utils';
import { HandlerType } from '@metamask/snaps-utils';
import { processRequestExecutionPermissions } from './eip7715';

describe('EIP-7715', () => {
  const NETWORK_CLIENT_ID_MOCK = 'test-client';
  const ORIGIN_MOCK = 'test.com';
  const SNAP_ID_MOCK = 'local:permissions-kernel';
  const ID_MOCK = '0x1234' as Hex;

  const REQUEST_MOCK = {
    id: 1,
    jsonrpc: '2.0',
    method: 'wallet_requestExecutionPermissions',
    networkClientId: NETWORK_CLIENT_ID_MOCK,
    origin: ORIGIN_MOCK,
  } as JsonRpcRequest & { networkClientId: string; origin?: string };

  const INVOKE_RESULT_MOCK = { result: { granted: true } } as Record<
    string,
    unknown
  >;

  const handleRequestMock = jest.fn();

  let originalSnapIdEnv: string | undefined;

  beforeEach(() => {
    jest.resetAllMocks();
    originalSnapIdEnv = process.env.PERMISSIONS_KERNEL_SNAP_ID;
    process.env.PERMISSIONS_KERNEL_SNAP_ID = SNAP_ID_MOCK;
    handleRequestMock.mockResolvedValue(INVOKE_RESULT_MOCK);
  });

  afterEach(() => {
    if (originalSnapIdEnv === undefined) {
      delete process.env.PERMISSIONS_KERNEL_SNAP_ID;
    } else {
      process.env.PERMISSIONS_KERNEL_SNAP_ID = originalSnapIdEnv;
    }
  });

  describe('processRequestExecutionPermissions', () => {
    it('throws if no origin is found on the request', async () => {
      await expect(
        processRequestExecutionPermissions(
          { handleRequest: handleRequestMock },
          { id: ID_MOCK },
          { ...REQUEST_MOCK, origin: undefined },
        ),
      ).rejects.toThrow('No origin found');
    });

    it('throws if PERMISSIONS_KERNEL_SNAP_ID is not configured', async () => {
      delete process.env.PERMISSIONS_KERNEL_SNAP_ID;

      await expect(
        processRequestExecutionPermissions(
          { handleRequest: handleRequestMock },
          { id: ID_MOCK },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow('No snapId configured for the Permissions Kernel snap');
    });

    it('invokes the Permissions Kernel snap with correct arguments and the original origin of the request', async () => {
      const result = await processRequestExecutionPermissions(
        { handleRequest: handleRequestMock },
        { id: ID_MOCK },
        REQUEST_MOCK,
      );

      expect(handleRequestMock).toHaveBeenCalledWith({
        snapId: SNAP_ID_MOCK,
        origin: ORIGIN_MOCK,
        handler: HandlerType.OnRpcRequest,
        request: {
          jsonrpc: '2.0',
          method: 'wallet_requestExecutionPermissions',
          params: { id: ID_MOCK },
        },
      });

      expect(result).toBe(INVOKE_RESULT_MOCK);
    });
  });
});
