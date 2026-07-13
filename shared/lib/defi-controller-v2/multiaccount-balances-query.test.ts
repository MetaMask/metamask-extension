import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import {
  buildMultiAccountBalancesQuery,
  buildMultiAccountBalancesUrl,
  getMultiAccountBalancesV6ApiParams,
  DEFI_SUPPORTED_NETWORKS,
  getEnabledSupportedDefiNetworks,
} from './multiaccount-balances-query';

const EVM_ACCOUNT = {
  id: 'evm-account-id',
  address: '0x3e8734ec146c981e3ed1f6b582d447dde701d90c',
  type: EthAccountType.Eoa,
  scopes: ['eip155:0'],
  metadata: { name: 'Account 1', importTime: 0, keyring: { type: 'HD Key Tree' } },
} as InternalAccount;

const SOLANA_ACCOUNT = {
  id: 'solana-account-id',
  address: '7EqQdEULxWcraVX3aF9HUgeiYctozHa1m1VvDWd2yVy',
  type: SolAccountType.DataAccount,
  scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  metadata: { name: 'Solana Account', importTime: 0, keyring: { type: 'Snap Keyring' } },
} as InternalAccount;

describe('multiaccount-balances-query', () => {
  describe('getEnabledSupportedDefiNetworks', () => {
    it('returns only networks that are both enabled and supported', () => {
      const enabledNetworks: CaipChainId[] = [
        'eip155:1',
        'eip155:137',
        'eip155:99999',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      ];

      expect(getEnabledSupportedDefiNetworks(enabledNetworks)).toStrictEqual([
        'eip155:1',
        'eip155:137',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      ]);
    });
  });

  describe('buildMultiAccountBalancesQuery', () => {
    it('builds EVM and Solana account entries for a multichain group', () => {
      const enabledNetworks: CaipChainId[] = [
        'eip155:1',
        'eip155:59144',
        'eip155:8453',
        'eip155:42161',
        'eip155:56',
        'eip155:10',
        'eip155:137',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      ];

      const result = buildMultiAccountBalancesQuery(
        [EVM_ACCOUNT, SOLANA_ACCOUNT],
        enabledNetworks,
      );

      expect(result.accounts).toStrictEqual([
        {
          caipAccountId:
            'eip155:0:0x3e8734ec146c981e3ed1f6b582d447dde701d90c',
          internalAccountId: 'evm-account-id',
          networks: [
            'eip155:1',
            'eip155:137',
            'eip155:56',
            'eip155:59144',
            'eip155:8453',
            'eip155:10',
            'eip155:42161',
          ],
        },
        {
          caipAccountId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7EqQdEULxWcraVX3aF9HUgeiYctozHa1m1VvDWd2yVy',
          internalAccountId: 'solana-account-id',
          networks: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        },
      ]);
      expect(result.accountIds).toStrictEqual([
        'eip155:0:0x3e8734ec146c981e3ed1f6b582d447dde701d90c',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7EqQdEULxWcraVX3aF9HUgeiYctozHa1m1VvDWd2yVy',
      ]);
      expect(result.networks).toStrictEqual([
        'eip155:1',
        'eip155:137',
        'eip155:56',
        'eip155:59144',
        'eip155:8453',
        'eip155:10',
        'eip155:42161',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      ]);
    });

    it('omits Solana when Solana is not enabled', () => {
      const enabledNetworks: CaipChainId[] = ['eip155:1'];

      const result = buildMultiAccountBalancesQuery(
        [EVM_ACCOUNT, SOLANA_ACCOUNT],
        enabledNetworks,
      );

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].caipAccountId).toBe(
        'eip155:0:0x3e8734ec146c981e3ed1f6b582d447dde701d90c',
      );
    });

    it('respects the supported network allowlist', () => {
      const enabledNetworks = DEFI_SUPPORTED_NETWORKS as unknown as CaipChainId[];

      const result = buildMultiAccountBalancesQuery(
        [EVM_ACCOUNT],
        enabledNetworks,
      );

      expect(result.networks).toStrictEqual(
        DEFI_SUPPORTED_NETWORKS.filter((network) =>
          network.startsWith('eip155:'),
        ),
      );
    });
  });

  describe('getMultiAccountBalancesV6ApiParams', () => {
    it('maps balances query params to v6 API request params', () => {
      const balancesQuery = buildMultiAccountBalancesQuery(
        [EVM_ACCOUNT],
        ['eip155:1', 'eip155:137'],
      );

      expect(getMultiAccountBalancesV6ApiParams(balancesQuery)).toStrictEqual({
        accountIds: ['eip155:0:0x3e8734ec146c981e3ed1f6b582d447dde701d90c'],
        networks: ['eip155:1', 'eip155:137'],
        includeDeFiBalances: true,
        forceFetchDeFiPositions: true,
        includePrices: true,
        vsCurrency: 'usd',
      });
    });

    it('uses the provided currency for v6 API request params', () => {
      const balancesQuery = buildMultiAccountBalancesQuery(
        [EVM_ACCOUNT],
        ['eip155:1'],
      );

      expect(
        getMultiAccountBalancesV6ApiParams(balancesQuery, 'EUR'),
      ).toMatchObject({
        vsCurrency: 'eur',
      });
    });
  });

  describe('buildMultiAccountBalancesUrl', () => {
    it('builds the v6 balances URL with DeFi query params', () => {
      const query = buildMultiAccountBalancesQuery(
        [EVM_ACCOUNT],
        ['eip155:1', 'eip155:59144', 'eip155:8453'],
      );

      const url = buildMultiAccountBalancesUrl(query);

      expect(url).toBe(
        'https://accounts.api.cx.metamask.io/v6/multiaccount/balances?includeDeFiBalances=true&forceFetchDeFiPositions=true&includePrices=true&vsCurrency=usd&accountIds=eip155%3A0%3A0x3e8734ec146c981e3ed1f6b582d447dde701d90c&networks=eip155%3A1%2Ceip155%3A59144%2Ceip155%3A8453',
      );
    });
  });
});
