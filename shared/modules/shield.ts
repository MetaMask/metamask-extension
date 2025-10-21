import { Subscription } from '@metamask/subscription-controller';
import { getIsShieldSubscriptionActive } from '../lib/shield';

export async function getShieldGatewayConfig(
  getToken: () => Promise<string>,
  getShieldSubscription: () => Subscription | undefined,
  url: string,
  opts?: {
    origin?: string;
  },
): Promise<{ newUrl: string; authorization: string | undefined }> {
  const shieldSubscription = getShieldSubscription();
  const isShieldSubscriptionActive = shieldSubscription
    ? getIsShieldSubscriptionActive(shieldSubscription)
    : false;

  if (!isShieldSubscriptionActive) {
    return {
      newUrl: url,
      authorization: undefined,
    };
  }

  const host = process.env.SHIELD_GATEWAY_URL;
  if (!host) {
    throw new Error('Shield gateway URL is not set');
  }

  try {
    let newUrl = `${host}/proxy?url=${encodeURIComponent(url)}`;
    const origin = opts?.origin;
    if (origin) {
      newUrl += `&origin=${encodeURIComponent(origin)}`;
    }

    let authorization = await getToken();
    if (authorization && !authorization.startsWith(`Bearer`)) {
      authorization = `Bearer ${authorization}`;
    }

    return {
      newUrl,
      authorization,
    };
  } catch (error) {
    console.error('Failed to get bearer token', error);
    return {
      newUrl: url,
      authorization: undefined,
    };
  }
}
