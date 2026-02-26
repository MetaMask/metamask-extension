import { JsonRpcRequest } from '@metamask/utils';
import { SecurityAlertResponse, GetSecurityAlertsConfig } from './types';

const ENDPOINT_VALIDATE = 'validate';

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
  getSecurityAlertsConfig?: GetSecurityAlertsConfig,
): Promise<SecurityAlertResponse> {
  const endpoint = `${ENDPOINT_VALIDATE}/${chainId}`;
  let url = getUrl(endpoint);
  const { newUrl, authorization } =
    (await getSecurityAlertsConfig?.(url)) || {};
  if (newUrl) {
    url = newUrl;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add optional authorization header, if provided.
  if (authorization) {
    headers.Authorization = authorization;
  }

  return request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Security alerts API request failed with status: ${response.status}`,
    );
  }

  return await response.json();
}

function getUrl(endpoint: string) {
  const host = process.env.SECURITY_ALERTS_API_URL;

  if (!host) {
    throw new Error('Security alerts API URL is not set');
  }

  return `${host}/${endpoint}`;
}
