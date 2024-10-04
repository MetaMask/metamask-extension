import { CHAIN_IDS } from './network';

// TODO read from feature flags
export const ALLOWED_BRIDGE_CHAIN_IDS = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.BSC,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.ZKSYNC_ERA,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.BASE,
];

export const BRIDGE_DEV_API_BASE_URL = 'https://bridge.dev-api.cx.metamask.io';
export const BRIDGE_PROD_API_BASE_URL = 'https://bridge.api.cx.metamask.io';
export const BRIDGE_API_BASE_URL = process.env.BRIDGE_USE_DEV_APIS
  ? BRIDGE_DEV_API_BASE_URL
  : BRIDGE_PROD_API_BASE_URL;

export const BRIDGE_CLIENT_ID = 'extension';

export const ETH_USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
export const METABRIDGE_ETHEREUM_ADDRESS =
  '0x0439e60F02a8900a951603950d8D4527f400C3f1';

export enum FeeType {
  METABRIDGE = 'metabridge',
  REFUEL = 'refuel',
}
