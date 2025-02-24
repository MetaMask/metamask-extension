import {
  ScanTokenRequest,
  TokenFeature,
  TokenFeatureType,
  TokenAlertWithLabelIds,
} from '../../types/security-alerts-api';

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
    features.find((feature) => feature.type === TokenFeatureType.MALICIOUS) ||
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
      `Security alerts API request failed with status: ${response.status}`,
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

    default:
      console.warn(
        `Missing token alert translation for ${tokenFeature.feature_id}.`,
        tokenFeature.description,
      );
  }

  return { ...tokenFeature, titleId, descriptionId };
}
