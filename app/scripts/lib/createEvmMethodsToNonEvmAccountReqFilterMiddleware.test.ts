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

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    // evm requests
    {
      method: 'eth_accounts',
      calledNext: false,
      calledEnd: true,
    },
    {
      method: 'eth_sendRawTransaction',
      calledNext: false,
      calledEnd: true,
    },
    {
      method: 'eth_sendTransaction',
      calledNext: false,
      calledEnd: true,
    },
    { method: 'eth_sign', calledNext: false, calledEnd: true },
    { method: 'eth_signTypedData', calledNext: false, calledEnd: true },
    {
      method: 'eth_signTypedData_v1',
      calledNext: false,
      calledEnd: true,
    },
    {
      method: 'eth_signTypedData_v3',
      calledNext: false,
      calledEnd: true,
    },
    {
      method: 'eth_signTypedData_v4',

      calledNext: false,
      calledEnd: true,
    },

    // evm requests not associated with an account
    { method: 'eth_blockNumber', calledNext: true, calledEnd: false },
    { method: 'eth_chainId', calledNext: true, calledEnd: false },

    // other requests
    { method: 'wallet_getSnaps', calledNext: true, calledEnd: false },
    { method: 'wallet_invokeSnap', calledNext: true, calledEnd: false },
    {
      method: 'wallet_requestSnaps',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'snap_getClientStatus',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_addEthereumChain',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_getPermissions',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_requestPermissions',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_revokePermissions',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_switchEthereumChain',
      calledNext: true,
      calledEnd: false,
    },
  ])(
    `method $method with non-EVM account is passed to next called $calledNext times`,
    ({
      method,
      params,
      calledNext,
      calledEnd,
    }: {
      method: string;
      params: any;
      calledNext: number;
      calledEnd: number;
    }) => {
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

      expect(nextMock).toHaveBeenCalledTimes(calledNext ? 1 : 0);
      expect(endMock).toHaveBeenCalledTimes(calledEnd ? 1 : 0);
    },
  );

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    // evm requests
    {
      method: 'eth_accounts',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'eth_sendRawTransaction',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'eth_sendTransaction',
      calledNext: true,
      calledEnd: false,
    },
    { method: 'eth_sign', calledNext: true, calledEnd: false },
    { method: 'eth_signTypedData', calledNext: true, calledEnd: false },
    {
      method: 'eth_signTypedData_v1',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'eth_signTypedData_v3',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'eth_signTypedData_v4',
      calledNext: true,
      calledEnd: false,
    },

    // evm requests not associated with an account
    { method: 'eth_blockNumber', calledNext: true, calledEnd: false },
    { method: 'eth_chainId', calledNext: true, calledEnd: false },

    // other requests
    { method: 'wallet_getSnaps', calledNext: true, calledEnd: false },
    { method: 'wallet_invokeSnap', calledNext: true, calledEnd: false },
    {
      method: 'wallet_requestSnaps',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'snap_getClientStatus',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_addEthereumChain',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_getPermissions',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_requestPermissions',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_revokePermissions',
      calledNext: true,
      calledEnd: false,
    },
    {
      method: 'wallet_switchEthereumChain',
      calledNext: true,
      calledEnd: false,
    },
  ])(
    `method $method with EVM account is passed to next called $calledNext times`,
    ({
      method,
      params,
      calledNext,
      calledEnd,
    }: {
      method: string;
      params: any;
      calledNext: number;
      calledEnd: number;
    }) => {
      const filterFn = createEvmMethodsToNonEvmAccountReqFilterMiddleware({
        messenger: {
          call: jest.fn().mockReturnValue({ type: EthAccountType.Eoa }),
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

      expect(nextMock).toHaveBeenCalledTimes(calledNext ? 1 : 0);
      expect(endMock).toHaveBeenCalledTimes(calledEnd ? 1 : 0);
    },
  );
});
