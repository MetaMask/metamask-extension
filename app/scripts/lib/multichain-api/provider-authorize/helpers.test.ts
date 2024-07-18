import * as EthereumChainUtils from '../../rpc-method-middleware/handlers/ethereum-chain-utils';
import { ScopesObject } from '../scope';
import { assignAccountsToScopes, validateAndUpsertEip3085 } from './helpers';

jest.mock('../../rpc-method-middleware/handlers/ethereum-chain-utils', () => ({
  validateAddEthereumChainParams: jest.fn(),
}));
const MockEthereumChainUtils = jest.mocked(EthereumChainUtils);

describe('provider_authorize helpers', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('assignAccountsToScopes', () => {
    it('overwrites the accounts property of each scope object with a CAIP-10 account id built from the scopeString and passed in accounts', () => {
      const scopes: ScopesObject = {
        'eip155:1': {
          methods: [],
          notifications: [],
          accounts: ['will:be:overwitten'],
        },
        'eip155:5': {
          methods: [],
          notifications: [],
          accounts: ['will:be:overwitten'],
        },
      };

      assignAccountsToScopes(scopes, ['0x1', '0x2', '0x3']);

      expect(scopes).toStrictEqual({
        'eip155:1': {
          methods: [],
          notifications: [],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2', 'eip155:1:0x3'],
        },
        'eip155:5': {
          methods: [],
          notifications: [],
          accounts: ['eip155:5:0x1', 'eip155:5:0x2', 'eip155:5:0x3'],
        },
      });
    });

    it('does not assign accounts for the wallet scope', () => {
      const scopes: ScopesObject = {
        wallet: {
          methods: [],
          notifications: [],
        },
      };

      assignAccountsToScopes(scopes, ['0x1', '0x2', '0x3']);

      expect(scopes).toStrictEqual({
        wallet: {
          methods: [],
          notifications: [],
        },
      });
    });
  });

  describe('validateAndUpsertEip3085', () => {
    const upsertNetworkConfiguration = jest.fn();
    const findNetworkClientIdByChainId = jest.fn();

    beforeEach(() => {
      findNetworkClientIdByChainId.mockImplementation(() => {
        throw new Error('cannot find network client for chainId');
      });

      MockEthereumChainUtils.validateAddEthereumChainParams.mockReturnValue({
        chainId: '0x5',
        chainName: 'test',
        firstValidBlockExplorerUrl: 'http://explorer.test.com',
        firstValidRPCUrl: 'http://rpc.test.com',
        ticker: 'TST',
      });
    });

    it('validates the eip3085 params', async () => {
      try {
        await validateAndUpsertEip3085({
          eip3085Params: { foo: 'bar' },
          origin: 'http://test.com',
          upsertNetworkConfiguration,
          findNetworkClientIdByChainId,
        });
      } catch (err) {
        // noop
      }
      expect(
        MockEthereumChainUtils.validateAddEthereumChainParams,
      ).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('checks if the chainId can already be served', async () => {
      try {
        await validateAndUpsertEip3085({
          eip3085Params: { foo: 'bar' },
          origin: 'http://test.com',
          upsertNetworkConfiguration,
          findNetworkClientIdByChainId,
        });
      } catch (err) {
        // noop
      }
      expect(findNetworkClientIdByChainId).toHaveBeenCalledWith('0x5');
    });

    it('does not upsert the valdiated network configuration and returns undefined if a network client does already exist for the chainId', async () => {
      findNetworkClientIdByChainId.mockReturnValue('existingNetworkClientId');
      const result = await validateAndUpsertEip3085({
        eip3085Params: {},
        origin: 'http://test.com',
        upsertNetworkConfiguration,
        findNetworkClientIdByChainId,
      });

      expect(upsertNetworkConfiguration).not.toHaveBeenCalled();
      expect(result).toStrictEqual(undefined);
    });

    it('upserts the validated network configuration and returns the networkClientId if a network client does not already exist for the chainId', async () => {
      upsertNetworkConfiguration.mockResolvedValue('newNetworkClientId');
      const result = await validateAndUpsertEip3085({
        eip3085Params: {},
        origin: 'http://test.com',
        upsertNetworkConfiguration,
        findNetworkClientIdByChainId,
      });

      expect(upsertNetworkConfiguration).toHaveBeenCalledWith(
        {
          chainId: '0x5',
          rpcPrefs: { blockExplorerUrl: 'http://explorer.test.com' },
          nickname: 'test',
          rpcUrl: 'http://rpc.test.com',
          ticker: 'TST',
        },
        { source: 'dapp', referrer: 'http://test.com' },
      );
      expect(result).toStrictEqual('newNetworkClientId');
    });
  });
});
