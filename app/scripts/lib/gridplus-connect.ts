import { KnownOrigins } from '../../../shared/constants/offscreen-communication';

export const DEFAULT_GRIDPLUS_CONNECT_PAGE_URL = `${KnownOrigins.lattice}/connect`;
export const DEFAULT_GRIDPLUS_CONNECT_API_URL = 'https://api.gridplus.io';

export type GridPlusDeviceType = 'lattice' | 'cadix';

export type GridPlusConnectResult = {
  deviceId: string;
  sessionKey: string;
  deviceType?: GridPlusDeviceType;
};

export type GridPlusConnectResponse =
  | { result: GridPlusConnectResult; error?: never }
  | { result?: never; error: string };

export const EXPECTED_SESSION_KEY = 'metamask';
export const RESULT_MESSAGE_TYPE = 'gridplus:external-connect:result';
export const RESULT_MESSAGE_VERSION = 1;

type ParsedConnectUrl = {
  url: URL;
  expectedOrigin: string;
  expectedClient: string;
  expectedRequestId: string;
};

type ConnectMessageValidation =
  | { status: 'ignore' }
  | { status: 'error'; error: string }
  | { status: 'success'; result: GridPlusConnectResult };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function getConfiguredGridPlusConnectPageUrl(): string | undefined {
  const value = process.env.GRIDPLUS_CONNECT_PAGE_URL?.trim();
  return value || undefined;
}

function getConfiguredGridPlusConnectApiUrl(): string | undefined {
  const value = process.env.GRIDPLUS_CONNECT_API_URL?.trim();
  return value || undefined;
}

function normalizeConnectPageUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  if (url.pathname === '' || url.pathname === '/') {
    url.pathname = '/connect';
  }

  return url.toString();
}

export function getGridPlusConnectPageUrl(): string {
  return normalizeConnectPageUrl(
    getConfiguredGridPlusConnectPageUrl() ?? DEFAULT_GRIDPLUS_CONNECT_PAGE_URL,
  );
}

export function getGridPlusConnectOrigin(): string {
  return new URL(getGridPlusConnectPageUrl()).origin;
}

export function getGridPlusConnectApiBaseUrl(): string {
  const rawUrl =
    getConfiguredGridPlusConnectApiUrl() ?? DEFAULT_GRIDPLUS_CONNECT_API_URL;

  return rawUrl.replace(/\/+$/u, '');
}

export function parseGridPlusConnectUrl(
  rawUrl: string,
  expectedAllowedOrigin = getGridPlusConnectOrigin(),
): ParsedConnectUrl {
  const url = new URL(rawUrl);
  const expectedOrigin = url.origin;
  const expectedClient = url.searchParams.get('client');
  const expectedRequestId = url.searchParams.get('requestId');

  if (expectedOrigin !== expectedAllowedOrigin) {
    throw new Error(`Unexpected connect origin: ${expectedOrigin}`);
  }

  if (expectedClient !== EXPECTED_SESSION_KEY) {
    throw new Error(
      `Unexpected connect client: ${expectedClient ?? '(missing)'}`,
    );
  }

  if (!expectedRequestId) {
    throw new Error('Missing requestId in connect URL.');
  }

  return { url, expectedOrigin, expectedClient, expectedRequestId };
}

export function prepareGridPlusConnectUrl(
  rawUrl: string,
  targetOrigin: string,
  expectedAllowedOrigin = getGridPlusConnectOrigin(),
): ParsedConnectUrl {
  const url = new URL(rawUrl);

  if (!url.searchParams.get('requestId')) {
    url.searchParams.set('requestId', crypto.randomUUID());
  }

  url.searchParams.set('v', String(RESULT_MESSAGE_VERSION));
  url.searchParams.set('targetOrigin', targetOrigin);
  url.searchParams.set('forceLogin', 'true');
  url.searchParams.set('return', 'close');

  return parseGridPlusConnectUrl(url.toString(), expectedAllowedOrigin);
}

export function validateGridPlusConnectMessage(
  data: unknown,
  {
    expectedClient,
    expectedRequestId,
  }: Pick<ParsedConnectUrl, 'expectedClient' | 'expectedRequestId'>,
): ConnectMessageValidation {
  if (!isRecord(data)) {
    return { status: 'ignore' };
  }

  if (
    data.type !== RESULT_MESSAGE_TYPE ||
    data.v !== RESULT_MESSAGE_VERSION
  ) {
    return { status: 'ignore' };
  }

  const requestId =
    typeof data.requestId === 'string' ? data.requestId : null;
  const client = typeof data.client === 'string' ? data.client : null;
  const ok = typeof data.ok === 'boolean' ? data.ok : null;
  const sessionKey =
    typeof data.sessionKey === 'string' ? data.sessionKey : null;
  const deviceId =
    typeof data.deviceId === 'string' ? data.deviceId : null;
  const deviceType =
    data.deviceType === 'lattice' || data.deviceType === 'cadix'
      ? data.deviceType
      : undefined;
  const reason = typeof data.reason === 'string' ? data.reason : null;

  if (!requestId || requestId !== expectedRequestId) {
    return { status: 'ignore' };
  }

  if (!client || client !== expectedClient) {
    return { status: 'error', error: 'Invalid client returned from Connect.' };
  }

  if (!sessionKey || sessionKey !== EXPECTED_SESSION_KEY) {
    return {
      status: 'error',
      error: 'Invalid sessionKey returned from Connect.',
    };
  }

  if (ok !== true) {
    return { status: 'error', error: reason || 'Connection failed.' };
  }

  if (!deviceId) {
    return {
      status: 'error',
      error: 'Invalid credentials returned from Connect.',
    };
  }

  return {
    status: 'success',
    result: {
      deviceId,
      sessionKey,
      deviceType,
    },
  };
}
