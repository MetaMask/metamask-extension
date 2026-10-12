import { rpcErrors } from '@metamask/rpc-errors';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import type { WalletPayRequest, WalletPayResult } from '../../wallet-pay';
import { walletPayHandler } from './wallet-pay';

const REQUEST: WalletPayRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'wallet_pay',
  origin: 'https://perps-terminal.metamask.com',
  params: [{ type: 'perpsDeposit', from: '0x123' }],
};

const RESULT: WalletPayResult = { transactionHash: '0xabc' };

function setup(addWalletPayTransaction: jest.Mock) {
  const response: PendingJsonRpcResponse<WalletPayResult> = {
    jsonrpc: '2.0',
    id: 1,
  };
  const end = jest.fn();

  const run = () =>
    walletPayHandler.implementation(REQUEST, response, jest.fn(), end, {
      addWalletPayTransaction,
    });

  return { response, end, run };
}

describe('walletPayHandler', () => {
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
