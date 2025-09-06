import { CompletedRequest, Mockttp, RulePriority } from 'mockttp';
import sinon from 'sinon';
import { escapeRegExp } from 'lodash';
import { fetch as undiciFetch, ProxyAgent } from 'undici';

const SHIELD_GATEWAY_URL = 'https://shield-gateway.dev-api.cx.metamask.io';

export async function registerShieldGatewayMock(
  server: Mockttp,
  priority: RulePriority = RulePriority.DEFAULT,
) {
  const handleShieldGatewayRequestSpy = sinon.spy(handleShieldGatewayRequest);
  await server
    .forPost(new RegExp(escapeRegExp(SHIELD_GATEWAY_URL), 'u'))
    .asPriority(priority)
    .thenCallback(handleShieldGatewayRequestSpy);
  return handleShieldGatewayRequestSpy;
}

export async function handleShieldGatewayRequest(request: CompletedRequest) {
  if (request.path.startsWith('/proxy')) {
    return handleProxyRequest(request);
  }

  throw new Error('Unknown path');
}

async function handleProxyRequest(request: CompletedRequest) {
  // Extract URL from query param.
  const url = new URL(request.url);
  const actualUrl = url.searchParams.get('url');

  if (!actualUrl) {
    throw new Error('Missing URL');
  }

  // Forward request.
  const dispatcher = new ProxyAgent({
    uri: 'http://localhost:8000', // Mock server.
    requestTls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });
  const response = await undiciFetch(actualUrl, {
    headers: request.rawHeaders,
    method: request.method,
    body: await request.body.getText(),
    dispatcher,
  });

  // Return response.
  const body = await response.text();
  let json;
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    json = JSON.parse(body);
  }

  const headers = Object.fromEntries(response.headers.entries());
  return {
    statusCode: response.status,
    headers,
    body,
    json,
  };
}
