import { SecurityAlertResponse } from './types';

const ENDPOINT_VALIDATE = 'validate';

export type SecurityAlertsAPIRequest = {
  method: string;
  params: unknown[];
};

export function isSecurityAlertsAPIEnabled() {
  const isEnabled = process.env.SECURITY_ALERTS_API_ENABLED;
  return isEnabled?.toString() === 'true';
}

export async function validateWithSecurityAlertsAPI(
  chainId: string,
  request: SecurityAlertsAPIRequest,
): Promise<SecurityAlertResponse> {
  const endpoint = `${ENDPOINT_VALIDATE}/${chainId}`;
  return postRequest(endpoint, request);
}

async function postRequest(endpoint: string, body: unknown) {
  const url = getUrl(endpoint);

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

  return response.json();
}

function getUrl(endpoint: string) {
  const host = process.env.SECURITY_ALERTS_API_URL;

  if (!host) {
    throw new Error('Security alerts API URL is not set');
  }

  return `${host}/${endpoint}`;
}
