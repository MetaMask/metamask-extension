import { EthereumRpcError } from 'eth-rpc-errors';
import {
  PermissionDoesNotExistError,
  UnrecognizedSubjectError,
} from '@metamask/permission-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import { Caip25EndowmentPermissionName } from './caip25permissions';
import { walletRevokeSessionHandler } from './wallet-revokeSession';

const baseRequest = {
  origin: 'http://test.com',
  params: {},
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const revokePermission = jest.fn();
  const response = {};
  const handler = (request) =>
    walletRevokeSessionHandler(request, response, next, end, {
      revokePermission,
    });

  return {
    next,
    response,
    end,
    revokePermission,
    handler,
  };
};

describe('wallet_revokeSession', () => {
  it('revokes the the CAIP-25 endowment permission', async () => {
    const { handler, revokePermission } = createMockedHandler();

    await handler(baseRequest);
    expect(revokePermission).toHaveBeenCalledWith(
      'http://test.com',
      Caip25EndowmentPermissionName,
    );
  });

  it('throws a 5501 error if the CAIP-25 endowment permission does not exist', async () => {
    const { handler, revokePermission, end } = createMockedHandler();
    revokePermission.mockImplementation(() => {
      throw new PermissionDoesNotExistError();
    });

    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new EthereumRpcError(5501, 'No active sessions'),
    );
  });

  it('throws a 5501 error if the subject does not exist', async () => {
    const { handler, revokePermission, end } = createMockedHandler();
    revokePermission.mockImplementation(() => {
      throw new UnrecognizedSubjectError();
    });

    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new EthereumRpcError(5501, 'No active sessions'),
    );
  });

  it('throws an internal RPC error if something unexpected goes wrong with revoking the permission', async () => {
    const { handler, revokePermission, end } = createMockedHandler();
    revokePermission.mockImplementation(() => {
      throw new Error('revoke failed');
    });

    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(rpcErrors.internal());
  });

  it('returns true if the permission was revoked', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);
    expect(response.result).toStrictEqual(true);
  });
});
