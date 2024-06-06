import { jsonrpc2 } from '@metamask/utils';
import { BtcAccountType, EthAccountType } from '@metamask/keyring-api';
import createEvmMethodsToNonEvmAccountReqFilterMiddleware, {
  EvmMethodsToNonEvmAccountFilterMessenger,
} from './createEvmMethodsToNonEvmAccountReqFilterMiddleware';
import { Json } from 'json-rpc-engine';

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
    },
    {
      method: 'eth_sendRawTransaction',
      calledNext: false,
    },
    {
      method: 'eth_sendTransaction',
      calledNext: false,
    },
    { method: 'eth_sign', calledNext: false, calledEnd: true },
    { method: 'eth_signTypedData', calledNext: false, calledEnd: true },
    {
      method: 'eth_signTypedData_v1',
      calledNext: false,
    },
    {
      method: 'eth_signTypedData_v3',
      calledNext: false,
    },
    {
      method: 'eth_signTypedData_v4',

      calledNext: false,
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
    },
    {
      method: 'snap_getClientStatus',
      calledNext: true,
    },
    {
      method: 'wallet_addEthereumChain',
      calledNext: true,
    },
    {
      method: 'wallet_getPermissions',
      calledNext: true,
    },
    {
      method: 'wallet_requestPermissions',
      calledNext: true,
    },
    {
      method: 'wallet_revokePermissions',
      calledNext: true,
    },
    {
      method: 'wallet_switchEthereumChain',
      calledNext: true,
    },

    // wallet_requestPermissions request
    {
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
      calledNext: false,
    },

    {
      method: 'wallet_requestPermissions',
      params: [{ snap_getClientStatus: {} }],
      calledNext: true,
    },
  ])(
    `method $method with non-EVM account is passed to next called $calledNext times`,
    ({
      method,
      params,
      calledNext,
    }: {
      method: string;
      params?: Json;
      calledNext: number;
    }) => {
      const filterFn = createEvmMethodsToNonEvmAccountReqFilterMiddleware({
        messenger: {
          call: jest.fn().mockReturnValue({ type: BtcAccountType.P2wpkh }),
        } as unknown as EvmMethodsToNonEvmAccountFilterMessenger,
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
      expect(endMock).toHaveBeenCalledTimes(calledNext ? 0 : 1);
    },
  );

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    // evm requests
    {
      method: 'eth_accounts',
      calledNext: true,
    },
    {
      method: 'eth_sendRawTransaction',
      calledNext: true,
    },
    {
      method: 'eth_sendTransaction',
      calledNext: true,
    },
    { method: 'eth_sign', calledNext: true, calledEnd: false },
    { method: 'eth_signTypedData', calledNext: true, calledEnd: false },
    {
      method: 'eth_signTypedData_v1',
      calledNext: true,
    },
    {
      method: 'eth_signTypedData_v3',
      calledNext: true,
    },
    {
      method: 'eth_signTypedData_v4',
      calledNext: true,
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
    },
    {
      method: 'snap_getClientStatus',
      calledNext: true,
    },
    {
      method: 'wallet_addEthereumChain',
      calledNext: true,
    },
    {
      method: 'wallet_getPermissions',
      calledNext: true,
    },
    {
      method: 'wallet_requestPermissions',
      calledNext: true,
    },
    {
      method: 'wallet_revokePermissions',
      calledNext: true,
    },
    {
      method: 'wallet_switchEthereumChain',
      calledNext: true,
    },

    // wallet_requestPermissions request
    {
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
      calledNext: true,
    },

    {
      method: 'wallet_requestPermissions',
      params: [{ snap_getClientStatus: {} }],
      calledNext: true,
    },
  ])(
    `method $method with EVM account is passed to next called $calledNext times`,
    ({
      method,
      params,
      calledNext,
    }: {
      method: string;
      params?: Json;
      calledNext: number;
    }) => {
      const filterFn = createEvmMethodsToNonEvmAccountReqFilterMiddleware({
        messenger: {
          call: jest.fn().mockReturnValue({ type: EthAccountType.Eoa }),
        } as unknown as EvmMethodsToNonEvmAccountFilterMessenger,
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
      expect(endMock).toHaveBeenCalledTimes(calledNext ? 0 : 1);
    },
  );
});
