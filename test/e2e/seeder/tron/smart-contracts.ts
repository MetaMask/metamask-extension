import { utils as ethersUtils } from 'ethers';
import { TEST_TRC20_ABI, TEST_TRC20_BYTECODE } from './contracts/test-trc20';
import {
  TRON_TEST_ASSETS,
  type TronTrc20Symbol,
  type TronTrc20Token,
} from './assets';

export const TRON_SMART_CONTRACTS = {
  HTX: 'HTX',
  SEED: 'SEED',
  USDD: 'USDD',
  USDT: 'USDT',
} as const satisfies Record<TronTrc20Symbol, TronTrc20Symbol>;

export type TronSmartContract =
  (typeof TRON_SMART_CONTRACTS)[keyof typeof TRON_SMART_CONTRACTS];

export type TronSmartContractConfig = Pick<
  TronTrc20Token,
  'decimals' | 'name' | 'symbol'
> & {
  abi: typeof TEST_TRC20_ABI;
  bytecode: string;
};

export const tronContractConfiguration = Object.fromEntries(
  Object.values(TRON_SMART_CONTRACTS).map((symbol) => {
    const metadata = TRON_TEST_ASSETS[symbol];
    return [
      symbol,
      {
        ...metadata,
        abi: TEST_TRC20_ABI,
        bytecode: TEST_TRC20_BYTECODE,
      },
    ];
  }),
) as Record<TronSmartContract, TronSmartContractConfig>;

export function getTronSmartContractConfig(
  contractName: TronSmartContract,
): TronSmartContractConfig {
  return tronContractConfiguration[contractName];
}

export function encodeTrc20ConstructorParameters(
  contractConfig: TronSmartContractConfig,
  initialSupply: string | number | bigint,
): string {
  return ethersUtils.defaultAbiCoder
    .encode(
      ['string', 'string', 'uint8', 'uint256'],
      [
        contractConfig.name,
        contractConfig.symbol,
        contractConfig.decimals,
        initialSupply.toString(),
      ],
    )
    .replace(/^0x/u, '');
}
