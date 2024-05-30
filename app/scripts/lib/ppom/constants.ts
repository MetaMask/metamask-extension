import { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';

export const PPOM_SUPPORTED_CHAIN_IDS: Hex[] = [
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.BASE,
  CHAIN_IDS.BSC,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.OPBNB,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.SEPOLIA,
];

export const PPOM_EXCLUDED_TRANSACTION_TYPES = [
  TransactionType.swap,
  TransactionType.swapApproval,
  TransactionType.swapAndSend,
];
