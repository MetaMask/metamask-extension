import {
  buildPermissiveTrc20Bytecode,
  createTronGridAccountResponse,
  encodeTrc20TransferParameter,
  getTronAssetMetadata,
} from '../seeder/tron/assets';
import { createTronPortfolioNodeOptions } from '../seeder/tron/profiles';

describe('Tron local asset helpers', () => {
  const accountAddress = 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3';
  const recipientAddress = 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq';

  it('creates the portfolio node options used by Tron balance tests', () => {
    const options = createTronPortfolioNodeOptions(accountAddress);

    expect(options).toStrictEqual({
      initialBalances: {
        [accountAddress]: 6072392,
      },
      trc10Balances: {
        [accountAddress]: {
          GAS_FREE: '33333333',
        },
      },
      trc20Balances: {
        [accountAddress]: {
          HTX: '3156454956836360132407885',
          SEED: '89851311',
          USDD: '289757448699320931',
          USDT: '2804595',
        },
      },
    });
  });

  it('builds a TRC20 transfer parameter using the 20-byte Tron account payload', () => {
    expect(encodeTrc20TransferParameter(recipientAddress, '123')).toBe(
      '000000000000000000000000639f09ebb2021f11ab768b639859ea6f66a9ea50000000000000000000000000000000000000000000000000000000000000007b',
    );
  });

  it('builds local TRC20 bytecode with transfer and balance selectors', () => {
    const bytecode = buildPermissiveTrc20Bytecode(6);

    expect(bytecode).toContain('a9059cbb');
    expect(bytecode).toContain('70a08231');
    expect(bytecode).toContain('313ce567');
  });

  it('creates a TronGrid account envelope from local token balances', () => {
    const account = createTronGridAccountResponse({
      address: accountAddress,
      nativeAccount: {
        address: accountAddress,
        balance: 6072392,
      },
      trc10Balances: {
        GAS_FREE: '33333333',
      },
      trc10Tokens: {
        GAS_FREE: {
          ...getTronAssetMetadata('GAS_FREE'),
          tokenId: '1005074',
        },
      },
      trc20Balances: {
        USDT: '2804595',
      },
      trc20Tokens: {
        USDT: {
          ...getTronAssetMetadata('USDT'),
          address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          hexAddress: '41a614f803b6fd780986a42c78ec9c7f77e6ded13c',
        },
      },
    });

    expect(account.data[0]).toMatchObject({
      balance: 6072392,
      assetV2: [{ key: '1005074', value: 33333333 }],
      trc20: [{ TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: '2804595' }],
    });
  });
});
