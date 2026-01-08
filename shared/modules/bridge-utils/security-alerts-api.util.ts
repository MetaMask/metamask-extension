import { CHAIN_IDS } from '@metamask/transaction-controller';
import { SolMethod } from '@metamask/keyring-api';
import { base58 } from 'ethers/lib/utils';
import { assert } from '@metamask/superstruct';
import { type CaipChainId } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  ScanTokenRequest,
  TokenFeature,
  TokenFeatureType,
  TokenAlertWithLabelIds,
  type TxAlert,
  MessageScanResponse,
} from '../../types/security-alerts-api';
import { MultichainNetworks } from '../../constants/multichain/networks';

const DOMAIN = 'https://metamask.io';

export function isSecurityAlertsAPIEnabled() {
  const isEnabled = process.env.SECURITY_ALERTS_API_ENABLED;
  return isEnabled?.toString() === 'true';
}

function getUrl(endpoint: string) {
  const host = process.env.SECURITY_ALERTS_API_URL;

  if (!host) {
    throw new Error('Security alerts API URL is not set');
  }

  return `${host}/${endpoint}`;
}

function getSecurityApiScanTokenRequestBody(
  chain: string,
  address: string,
): ScanTokenRequest {
  return {
    chain,
    address,
    metadata: {
      domain: DOMAIN,
    },
  };
}

/**
 * Given a list of TokenFeatures, return the first TokenFeature that is the type Malicious, if not try for Warning, if not return null
 *
 * @param features
 * @returns TokenFeature
 */
function getFirstTokenAlert(features: TokenFeature[]): TokenFeature | null {
  return (
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    features.find((feature) => feature.type === TokenFeatureType.MALICIOUS) ||
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    features.find((feature) => feature.type === TokenFeatureType.WARNING) ||
    null
  );
}

export async function fetchTokenAlert(
  chain: string,
  tokenAddress: string,
): Promise<TokenAlertWithLabelIds | null> {
  if (!isSecurityAlertsAPIEnabled()) {
    return null;
  }

  const url = getUrl('token/scan');
  const body = getSecurityApiScanTokenRequestBody(chain, tokenAddress);

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Security alerts token scan request failed with status: ${response.status}`,
    );
  }

  const respBody = await response.json();

  const tokenAlert = getFirstTokenAlert(respBody.features);

  if (!tokenAlert) {
    return null;
  }

  return getTokenFeatureTitleDescriptionIds(tokenAlert);
}

export function getTokenFeatureTitleDescriptionIds(
  tokenFeature: TokenFeature,
): TokenAlertWithLabelIds {
  let titleId = null;
  let descriptionId = null;

  switch (tokenFeature.feature_id) {
    case 'UNSTABLE_TOKEN_PRICE':
      titleId = 'unstableTokenPriceTitle';
      descriptionId = 'unstableTokenPriceDescription';
      break;
    case 'HONEYPOT':
      titleId = 'honeypotTitle';
      descriptionId = 'honeypotDescription';
      break;
    case 'INSUFFICIENT_LOCKED_LIQUIDITY':
      titleId = 'insufficientLockedLiquidityTitle';
      descriptionId = 'insufficientLockedLiquidityDescription';
      break;
    case 'AIRDROP_PATTERN':
      titleId = 'airDropPatternTitle';
      descriptionId = 'airDropPatternDescription';
      break;
    case 'CONCENTRATED_SUPPLY_DISTRIBUTION':
      titleId = 'concentratedSupplyDistributionTitle';
      descriptionId = 'concentratedSupplyDistributionDescription';
      break;

    default:
      console.warn(
        `Missing token alert translation for ${tokenFeature.feature_id}.`,
        tokenFeature.description,
      );
  }

  return { ...tokenFeature, titleId, descriptionId };
}

const CHAIN_ID_TO_SECURITY_API_NAME: Record<CaipChainId, string | null> = {
  [toEvmCaipChainId(CHAIN_IDS.MAINNET)]: 'ethereum',
  [toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET)]: 'linea',
  [toEvmCaipChainId(CHAIN_IDS.POLYGON)]: 'polygon',
  [toEvmCaipChainId(CHAIN_IDS.AVALANCHE)]: 'avalanche',
  [toEvmCaipChainId(CHAIN_IDS.BSC)]: 'bsc',
  [toEvmCaipChainId(CHAIN_IDS.ARBITRUM)]: 'arbitrum',
  [toEvmCaipChainId(CHAIN_IDS.OPTIMISM)]: 'optimism',
  [toEvmCaipChainId(CHAIN_IDS.ZKSYNC_ERA)]: 'zksync',
  [toEvmCaipChainId(CHAIN_IDS.BASE)]: 'base',
  [toEvmCaipChainId(CHAIN_IDS.SEI)]: 'sei',
  [toEvmCaipChainId(CHAIN_IDS.MONAD)]: 'monad',
  [MultichainNetworks.SOLANA]: 'solana',
  [MultichainNetworks.BITCOIN]: 'bitcoin',
  [MultichainNetworks.BITCOIN_TESTNET]: null, // not supported
  [MultichainNetworks.BITCOIN_SIGNET]: null, // not supported
  [MultichainNetworks.SOLANA_DEVNET]: null, // not supported
  [MultichainNetworks.SOLANA_TESTNET]: null, // not supported
};

export function convertChainIdToBlockAidChainName(
  chainId: CaipChainId,
): string | null {
  const name = CHAIN_ID_TO_SECURITY_API_NAME[chainId];
  return name ?? null;
}

export async function fetchTxAlerts(
  params: {
    signal: AbortSignal;
    chainId: CaipChainId;
    trade: string;
    accountAddress: string;
  } | null,
): Promise<TxAlert | null> {
  if (!isSecurityAlertsAPIEnabled() || !params) {
    return null;
  }

  const { chainId, trade, accountAddress, signal } = params;

  const chain = convertChainIdToBlockAidChainName(chainId);

  if (!chain) {
    return null;
  }

  const url = getUrl(`${chain}/message/scan`);
  const body = {
    method: SolMethod.SignAndSendTransaction,
    encoding: 'base64',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    account_address: Buffer.from(base58.decode(accountAddress)).toString(
      'base64',
    ),
    chain: 'mainnet',
    transactions: [trade],
    options: ['simulation', 'validation'],
    metadata: {
      url: null,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Security alerts message scan request failed with status: ${response.status}`,
    );
  }

  const respBody = await response.json();

  assert<MessageScanResponse, unknown>(respBody, MessageScanResponse);

  if (respBody.status === 'ERROR') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
    const { error_details } = respBody;
    return {
      titleId: 'txAlertTitle',
      // eslint-disable-next-line camelcase
      description: error_details?.message
        ? // eslint-disable-next-line camelcase
          `The ${error_details.message}.`
        : '',
      descriptionId: 'bridgeSelectDifferentQuote',
    };
  }

  return null;
}
