import { AssetType } from '@metamask/bridge-controller';
import { Delegation } from './delegation';

export enum TokenSymbol {
  SEPOLIA_ETH = 'SepoliaETH',
  ETH = 'ETH',
  USDC = 'USDC',
  WETH = 'WETH',
  WBTC = 'WBTC',
  BNB = 'BNB',
  EURC = 'EURC',
}

export type TokenInfo = {
  symbol: TokenSymbol;
  name: string;
  image: string;
  address: string;
  type: AssetType;
  decimals: number;
};

export enum REMOTE_MODES {
  SWAP = 'swap',
  DAILY_ALLOWANCE = 'daily-allowance',
}

export type DailyAllowance = TokenInfo & {
  amount: number;
};

export type DailyAllowanceMetadata = {
  allowances: DailyAllowance[];
};

export type SwapAllowanceMetadata = {
  allowances: SwapAllowance[];
};

export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

export const TOKEN_DETAILS: Record<TokenSymbol, TokenInfo> = {
  [TokenSymbol.SEPOLIA_ETH]: {
    symbol: TokenSymbol.SEPOLIA_ETH,
    name: 'SepoliaETH',
    image: './images/eth_logo.png',
    address: '',
    type: AssetType.native,
    decimals: 18,
  },
  [TokenSymbol.ETH]: {
    symbol: TokenSymbol.ETH,
    name: 'ETH',
    image: './images/eth_logo.png',
    address: '',
    type: AssetType.native,
    decimals: 18,
  },
  [TokenSymbol.USDC]: {
    symbol: TokenSymbol.USDC,
    name: 'USDC',
    image: './images/icon-usdc.png',
    address: '',
    type: AssetType.token,
    decimals: 6,
  },
  [TokenSymbol.WETH]: {
    symbol: TokenSymbol.WETH,
    name: 'WETH',
    image: './images/eth_logo.png',
    address: '',
    type: AssetType.token,
    decimals: 18,
  },
  [TokenSymbol.WBTC]: {
    symbol: TokenSymbol.WBTC,
    name: 'WBTC',
    image: './images/icon-btc.png',
    address: '',
    type: AssetType.token,
    decimals: 8,
  },
  [TokenSymbol.BNB]: {
    symbol: TokenSymbol.BNB,
    name: 'BNB',
    image: './images/icon-bnb.png',
    address: '',
    type: AssetType.token,
    decimals: 18,
  },
  // note: added for testing (finalized list tbd)
  [TokenSymbol.EURC]: {
    symbol: TokenSymbol.EURC,
    name: 'EURC',
    image: './images/eth_logo.png',
    address: '',
    type: AssetType.token,
    decimals: 18,
  },
};

export enum BaseToTokenOption {
  AllowedOutcome = 'Select allowed outcome token',
  Any = 'Any token on Ethereum Mainnet',
}

export type ToTokenOption = BaseToTokenOption | TokenSymbol;

export type SwapAllowance = {
  from: TokenSymbol;
  to: ToTokenOption;
  amount: number;
};

export type RemoteModeConfig = {
  swapAllowance:
    | {
        allowances: SwapAllowance[];
        delegation: Delegation;
      }
    | null
    | undefined;
  dailyAllowance:
    | {
        allowances: DailyAllowance[];
        delegation: Delegation;
      }
    | null
    | undefined;
};

export const ABI_SWAP_BY_DELEGATION = [
  {
    type: 'function',
    name: 'swapByDelegation',
    inputs: [
      {
        name: '_signatureData',
        type: 'tuple',
        internalType: 'struct DelegationMetaSwapAdapter.SignatureData',
        components: [
          {
            name: 'apiData',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'expiration',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'signature',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
      {
        name: '_delegations',
        type: 'tuple[]',
        internalType: 'struct Delegation[]',
        components: [
          {
            name: 'delegate',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'delegator',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'authority',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'caveats',
            type: 'tuple[]',
            internalType: 'struct Caveat[]',
            components: [
              {
                name: 'enforcer',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'terms',
                type: 'bytes',
                internalType: 'bytes',
              },
              {
                name: 'args',
                type: 'bytes',
                internalType: 'bytes',
              },
            ],
          },
          {
            name: 'salt',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'signature',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
      {
        name: '_useTokenWhitelist',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];
