import { Hex, JsonRpcRequest } from '@metamask/utils';
import { SecurityAlertResponse } from './types';

const ENDPOINT_VALIDATE = 'validate';
const ENDPOINT_SUPPORTED_CHAINS = 'supportedChains';

type SecurityAlertsAPIRequestBody = {
  method: string;
  params: unknown[];
};

export type SecurityAlertsAPIRequest = Omit<
  JsonRpcRequest,
  'method' | 'params'
> &
  SecurityAlertsAPIRequestBody;

export function isSecurityAlertsAPIEnabled() {
  const isEnabled = process.env.SECURITY_ALERTS_API_ENABLED;
  return isEnabled?.toString() === 'true';
}

export async function validateWithSecurityAlertsAPI(
  chainId: string,
  body:
    | SecurityAlertsAPIRequestBody
    | Pick<JsonRpcRequest, 'method' | 'params'>,
): Promise<SecurityAlertResponse> {
  const endpoint = `${ENDPOINT_VALIDATE}/${chainId}`;
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function getSecurityAlertsAPISupportedChainIds(): Promise<Hex[]> {
  return request(ENDPOINT_SUPPORTED_CHAINS);
}

async function request(endpoint: string, options?: RequestInit) {
  const url = getUrl(endpoint);

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Security alerts API request failed with status: ${response.status}`,
    );
  }

  return response.json();
}

function getUrl(endpoint: string) {
  const host = process.env.SECURITY_ALERTS_API_URL;

  if (!host) {
    throw new Error('Security alerts API URL is not set');
  }

  return `${host}/${endpoint}`;
}
