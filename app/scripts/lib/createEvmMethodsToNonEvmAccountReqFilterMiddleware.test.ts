import { jsonrpc2 } from '@metamask/utils';
import { BtcAccountType, EthAccountType } from '@metamask/keyring-api';
import { Json } from 'json-rpc-engine';
import createEvmMethodsToNonEvmAccountReqFilterMiddleware, {
  EvmMethodsToNonEvmAccountFilterMessenger,
} from './createEvmMethodsToNonEvmAccountReqFilterMiddleware';

describe('createEvmMethodsToNonEvmAccountReqFilterMiddleware', () => {
  const getMockRequest = (method: string, params?: Json) => ({
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
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_sendRawTransaction',
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_sendTransaction',
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData',
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData_v1',
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData_v3',
      calledNext: false,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_signTypedData_v4',
      calledNext: false,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_accounts',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_sendRawTransaction',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_sendTransaction',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData_v1',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData_v3',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_signTypedData_v4',
      calledNext: true,
    },

    // EVM requests not associated with an account
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_blockNumber',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'eth_chainId',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_blockNumber',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'eth_chainId',
      calledNext: true,
    },

    // other requests
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_getSnaps',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_invokeSnap',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_requestSnaps',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'snap_getClientStatus',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_addEthereumChain',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_getPermissions',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_requestPermissions',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_revokePermissions',
      calledNext: true,
    },
    {
      accountType: BtcAccountType.P2wpkh,
      method: 'wallet_switchEthereumChain',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_getSnaps',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_invokeSnap',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_requestSnaps',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'snap_getClientStatus',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_addEthereumChain',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_getPermissions',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_requestPermissions',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_revokePermissions',
      calledNext: true,
    },
    {
      accountType: EthAccountType.Eoa,
      method: 'wallet_switchEthereumChain',
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
      params?: Json;
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
        getMockRequest(method, params),
        getMockResponse(),
        mockNext,
        mockEnd,
      );

      expect(mockNext).toHaveBeenCalledTimes(calledNext ? 1 : 0);
      expect(mockEnd).toHaveBeenCalledTimes(calledNext ? 0 : 1);
    },
  );
});
