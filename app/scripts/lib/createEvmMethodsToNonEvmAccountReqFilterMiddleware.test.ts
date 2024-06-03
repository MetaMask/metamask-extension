import { jsonrpc2 } from '@metamask/utils';
import createEvmMethodsToNonEvmAccountReqFilterMiddleware from './createEvmMethodsToNonEvmAccountReqFilterMiddleware';
import { BtcAccountType, EthAccountType } from '@metamask/keyring-api';

describe('createEvmMethodsToNonEvmAccountReqFilterMiddleware', () => {
  const getMockRequest = (method: string, params?: any) => ({
    jsonrpc: jsonrpc2,
    id: 1,
    method,
    params,
  });
  const getMockResponse = () => ({ jsonrpc: jsonrpc2, id: 'foo' });

  it.each([
    // evm requests
    {
      method: 'eth_accounts',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },
    {
      method: 'eth_sendRawTransaction',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },
    {
      method: 'eth_sendTransaction',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },
    { method: 'eth_sign', params: null, calledNext: 0, calledEnd: 1 },
    { method: 'eth_signTypedData', params: null, calledNext: 0, calledEnd: 1 },
    {
      method: 'eth_signTypedData_v1',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },
    {
      method: 'eth_signTypedData_v3',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },
    {
      method: 'eth_signTypedData_v4',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },
    {
      method: 'eth_signTypedData_v1',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },
    {
      method: 'eth_signTypedData_v1',
      params: null,
      calledNext: 0,
      calledEnd: 1,
    },

    // evm requests not associated with an account
    { method: 'eth_blockNumber', params: null, calledNext: 1, calledEnd: 0 },
    { method: 'eth_chainId', params: null, calledNext: 1, calledEnd: 0 },
  ])(
    `method $method with non-EVM account is passed to next called $calledNext times`,
    ({ method, params, calledNext, calledEnd }) => {
      const filterFn = createEvmMethodsToNonEvmAccountReqFilterMiddleware({
        messenger: {
          call: jest.fn().mockReturnValue({ type: BtcAccountType.P2wpkh }),
        },
      });
      const nextMock = jest.fn();
      const endMock = jest.fn();

      filterFn(
        getMockRequest(method, params),
        getMockResponse(),
        nextMock,
        endMock,
      );

      expect(nextMock).toHaveBeenCalledTimes(calledNext);
      expect(endMock).toHaveBeenCalledTimes(calledEnd);
    },
  );
});
