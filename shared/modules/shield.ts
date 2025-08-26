import { getIsShieldGatewayEnabled } from './environment';

export async function getShieldGatewayConfig(
  getToken: () => Promise<string>,
  url: string,
): Promise<{ newUrl: string; authorization: string | undefined }> {
  const isShieldGatewayEnabled = getIsShieldGatewayEnabled();
  if (!isShieldGatewayEnabled) {
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
    const token = await getToken();
    return {
      newUrl: `${host}/proxy?url=${encodeURIComponent(url)}`,
      authorization: token,
    };
  } catch (error) {
    console.error('Failed to get bearer token', error);
    return {
      newUrl: url,
      authorization: undefined,
    };
  }
}
