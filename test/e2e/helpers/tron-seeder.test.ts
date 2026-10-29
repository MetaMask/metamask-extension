import type { TronTrc20Symbol, TronTrc20Token } from '../seeder/tron/assets';
import {
  TRON_SMART_CONTRACTS,
  encodeTrc20ConstructorParameters,
  getTronSmartContractConfig,
} from '../seeder/tron/smart-contracts';
import { TronSeeder } from '../seeder/tron/tron-seeder';

describe('TronSeeder', () => {
  const accountAddress = 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3';
  const recipientAddress = 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq';

  it('encodes TRC20 constructor parameters for deploycontract', () => {
    const usdt = getTronSmartContractConfig(TRON_SMART_CONTRACTS.USDT);

    const encoded = encodeTrc20ConstructorParameters(usdt, '1000000');

    expect(encoded).toMatch(/^[0-9a-f]+$/u);
    expect(encoded).not.toContain('0x');
    expect(encoded).toContain(`${'0'.repeat(58)}0f4240`);
  });

  it('deploys named Tron smart contracts and stores their addresses', async () => {
    const node = createMockTronNode();
    const seeder = new TronSeeder(node);

    await seeder.deploySmartContract(TRON_SMART_CONTRACTS.USDT, {
      initialSupply: '1000000',
    });

    expect(node.deployTrc20Token).toHaveBeenCalledWith('USDT', '1000000');
    expect(
      seeder
        .getContractRegistry()
        .getContractAddress(TRON_SMART_CONTRACTS.USDT),
    ).toBe(node.tokens.USDT.address);
  });

  it('seeds TRC20 balances by deploying each required contract once', async () => {
    const node = createMockTronNode();
    const seeder = new TronSeeder(node);

    await seeder.seedSmartContractBalances({
      [accountAddress]: {
        USDD: '2500000000000000000',
        USDT: '1000000',
      },
      [recipientAddress]: {
        USDT: '500000',
      },
    });

    expect(node.deployTrc20Token).toHaveBeenCalledWith(
      'USDD',
      '2500000000000000000',
    );
    expect(node.deployTrc20Token).toHaveBeenCalledWith('USDT', '1500000');
    expect(node.deployTrc20Token).toHaveBeenCalledTimes(2);
    expect(node.transferTrc20Token).toHaveBeenCalledWith(
      node.tokens.USDT,
      accountAddress,
      '1000000',
    );
    expect(node.transferTrc20Token).toHaveBeenCalledWith(
      node.tokens.USDT,
      recipientAddress,
      '500000',
    );
    expect(node.recordTrc20Balance).toHaveBeenCalledWith(
      recipientAddress,
      'USDT',
      '500000',
    );
  });
});

function createMockTronNode() {
  const tokens: Record<TronTrc20Symbol, TronTrc20Token> = {
    HTX: {
      address: 'THtxiG3hfeYJq5KfPDfFGt4VZ4NFfHA7fU',
      decimals: 18,
      hexAddress: '4157089f6d88fd8d60199b0b0eb7fb06d9d671a31ef',
      name: 'HTX DAO',
      symbol: 'HTX',
    },
    SEED: {
      address: 'TSeed4q22eEiATz6kfamDeAAQrPdfdGPeq',
      decimals: 6,
      hexAddress: '416f79e3c04f6f447d012c3acfbda5f01a5a4d4355',
      name: 'SEED',
      symbol: 'SEED',
    },
    USDD: {
      address: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
      decimals: 18,
      hexAddress: '41ebf08b7548a8dfc86a0887b91b10ff1753dc263e',
      name: 'USDD',
      symbol: 'USDD',
    },
    USDT: {
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      hexAddress: '41a614f803b6fd780986a42c78ec9c7f77e6ded13c',
      name: 'Tether',
      symbol: 'USDT',
    },
  };

  const trc20Tokens: Partial<typeof tokens> = {};

  return {
    deployTrc20Token: jest.fn(async (symbol: TronTrc20Symbol) => {
      trc20Tokens[symbol] = tokens[symbol];
      return tokens[symbol];
    }),
    recordTrc20Balance: jest.fn(),
    tokens,
    transferTrc20Token: jest.fn(),
    trc20Tokens,
  };
}
