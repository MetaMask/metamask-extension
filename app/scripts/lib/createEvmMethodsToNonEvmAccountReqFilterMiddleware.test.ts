import { jsonrpc2, Json } from '@metamask/utils';
import { BtcAccountType, EthAccountType } from '@metamask/keyring-api';
import type { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import createEvmMethodsToNonEvmAccountReqFilterMiddleware, {
  EvmMethodsToNonEvmAccountFilterMessenger,
} from './createEvmMethodsToNonEvmAccountReqFilterMiddleware';

describe('createEvmMethodsToNonEvmAccountReqFilterMiddleware', () => {
  const getMockRequest = (method: string, params: Json) => ({
    jsonrpc: jsonrpc2,
    id: 1,
    method,
    params,
  });
  const getMockResponse = () => ({ jsonrpc: jsonrpc2, id: 'foo' });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    // EVM requests
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_accounts',
      params: undefined,
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_sendRawTransaction',
      params: undefined,
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_sendTransaction',
      params: undefined,
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData',
      params: undefined,
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData_v1',
      params: undefined,
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData_v3',
      params: undefined,
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData_v4',
      params: undefined,
      calledNext: false,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_accounts',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_sendRawTransaction',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_sendTransaction',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData_v1',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData_v3',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData_v4',
      params: undefined,
      calledNext: true,
    },

    // EVM requests not associated with an account
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_blockNumber',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_chainId',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_blockNumber',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_chainId',
      params: undefined,
      calledNext: true,
    },

    // other requests
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_getSnaps',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_invokeSnap',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_requestSnaps',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'snap_getClientStatus',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_addEthereumChain',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_getPermissions',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_requestPermissions',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_revokePermissions',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_switchEthereumChain',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_getSnaps',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_invokeSnap',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_requestSnaps',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'snap_getClientStatus',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_addEthereumChain',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_getPermissions',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_requestPermissions',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_revokePermissions',
      params: undefined,
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_switchEthereumChain',
      params: undefined,
      calledNext: true,
    },

    // wallet_requestPermissions request
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_requestPermissions',
      params: [{ snap_getClientStatus: {} }],
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {}, snap_getClientStatus: {} }],
      calledNext: false,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
      calledNext: true,
    },

    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_requestPermissions',
      params: [{ snap_getClientStatus: {} }],
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {}, snap_getClientStatus: {} }],
      calledNext: true,
    },
  ])(
    `accountType $accountType method $method with non-EVM account is passed to next called $calledNext times`,
    ({
      accountType,
      method,
      params,
      calledNext,
    }: {
      accountType: EthAccountType | BtcAccountType;
      method: string;
      params: Json;
      calledNext: number;
    }) => {
      const filterFn = createEvmMethodsToNonEvmAccountReqFilterMiddleware({
        messenger: {
          call: jest.fn().mockReturnValue({ type: accountType }),
        } as unknown as EvmMethodsToNonEvmAccountFilterMessenger,
      });
      const mockNext = jest.fn();
      const mockEnd = jest.fn();

      filterFn(
        getMockRequest(method, params) as JsonRpcRequest<JsonRpcParams>,
        getMockResponse(),
        mockNext,
        mockEnd,
      );

      expect(mockNext).toHaveBeenCalledTimes(calledNext ? 1 : 0);
      expect(mockEnd).toHaveBeenCalledTimes(calledNext ? 0 : 1);
    },
  );
});
