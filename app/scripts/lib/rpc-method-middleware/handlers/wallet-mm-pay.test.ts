import { rpcErrors } from '@metamask/rpc-errors';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import type { MmPayRpcRequest, MmPayRpcResult } from '../../mmpay-rpc';
import { walletMmPayHandler } from './wallet-mm-pay';

const REQUEST: MmPayRpcRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'wallet_mmPay',
  origin: 'https://perps-terminal.metamask.com',
  params: [{ type: 'perpsDeposit', from: '0x123' }],
};

const RESULT: MmPayRpcResult = {
  transactionId: 'tx-1',
  source: {},
  destination: { hash: '0xabc' },
};

function setup(mmPayAddRpcTransaction: jest.Mock) {
  const response: PendingJsonRpcResponse<MmPayRpcResult> = {
    jsonrpc: '2.0',
    id: 1,
  };
  const end = jest.fn();

  const run = () =>
    walletMmPayHandler.implementation(REQUEST, response, jest.fn(), end, {
      mmPayAddRpcTransaction,
    });

  return { response, end, run };
}

describe('walletMmPayHandler', () => {
  it('passes the request to the hook and returns its result', async () => {
    const hook = jest.fn().mockResolvedValue(RESULT);
    const { response, end, run } = setup(hook);

    await run();

    expect(hook).toHaveBeenCalledWith(REQUEST);
    expect(response.result).toStrictEqual(RESULT);
    expect(end).toHaveBeenCalledWith();
  });

  it('ends with the error thrown by the hook', async () => {
    const error = rpcErrors.methodNotFound();
    const { response, end, run } = setup(jest.fn().mockRejectedValue(error));

    await run();

    expect(response.result).toBeUndefined();
    expect(end).toHaveBeenCalledWith(error);
  });
});
