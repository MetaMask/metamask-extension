import { toChecksumHexAddress } from '../../../shared/lib/hexstring-utils';
import {
  checksumErc20AssetId,
  shapeV6AccountsApiBalances,
  v6AccountsApiBalancesJson,
} from './accounts-api-v6-balances';

const ACCOUNT_ID = 'eip155:1:0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const OTHER_CHAIN_ACCOUNT_ID =
  'eip155:137:0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const LOWERCASE_ERC20 =
  'eip155:1/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947';
const HIDDEN_ERC20 =
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f';
const PINNED_ERC20 =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

describe('accounts-api-v6-balances', () => {
  it('checksums ERC-20 asset ids and leaves native ids unchanged', () => {
    expect(checksumErc20AssetId(LOWERCASE_ERC20)).toBe(
      `eip155:1/erc20:${toChecksumHexAddress('0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947')}`,
    );
    expect(checksumErc20AssetId('eip155:1/slip44:60')).toBe(
      'eip155:1/slip44:60',
    );
  });

  it('honors include and exclude params and fills missing pins with zero', () => {
    const requestUrl = [
      'https://accounts.api.cx.metamask.io/v6/multiaccount/balances',
      `?accountIds=${ACCOUNT_ID},${OTHER_CHAIN_ACCOUNT_ID}`,
      `&includeAssetIds=${PINNED_ERC20},eip155:1/slip44:60`,
      `&excludeAssetIds=${HIDDEN_ERC20.toUpperCase()}`,
    ].join('');

    const balances = shapeV6AccountsApiBalances(requestUrl, [
      {
        accountId: ACCOUNT_ID,
        assetId: 'eip155:1/slip44:60',
        balance: '25',
      },
      {
        accountId: ACCOUNT_ID,
        assetId: LOWERCASE_ERC20,
        balance: '10',
      },
      {
        accountId: ACCOUNT_ID,
        assetId: HIDDEN_ERC20,
        balance: '3',
      },
      {
        accountId: ACCOUNT_ID,
        assetId: 'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7',
        balance: '1',
        object: 'defi',
      },
    ]);

    expect(balances).toEqual([
      {
        accountId: ACCOUNT_ID,
        assetId: 'eip155:1/slip44:60',
        balance: '25',
        object: 'token',
      },
      {
        accountId: ACCOUNT_ID,
        assetId: checksumErc20AssetId(LOWERCASE_ERC20),
        balance: '10',
        object: 'token',
      },
      {
        accountId: ACCOUNT_ID,
        assetId: checksumErc20AssetId(
          'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7',
        ),
        balance: '1',
        object: 'defi',
      },
      {
        accountId: ACCOUNT_ID,
        assetId: checksumErc20AssetId(PINNED_ERC20),
        balance: '0',
        object: 'token',
      },
    ]);
  });

  it('returns an empty unprocessedIncludeAssetIds list', () => {
    const body = v6AccountsApiBalancesJson(
      `https://accounts.api.cx.metamask.io/v6/multiaccount/balances?accountIds=${ACCOUNT_ID}`,
      [
        {
          accountId: ACCOUNT_ID,
          assetId: 'eip155:1/slip44:60',
          balance: '25',
        },
      ],
    );

    expect(body.unprocessedIncludeAssetIds).toEqual([]);
    expect(body.unprocessedNetworks).toEqual([]);
    expect(body.count).toBe(1);
    expect(body.balances[0].object).toBe('token');
  });
});
