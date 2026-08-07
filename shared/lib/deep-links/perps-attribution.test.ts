import { webcrypto } from 'node:crypto';
import { DeferredDeepLinkRouteType } from './types';
import { canonicalize } from './canonicalize';
import { SIG_PARAM, SIG_PARAMS_PARAM } from './constants';
import { parse } from './parse';
import { getDeferredDeepLinkRoute } from './utils';
import { INVALID, MISSING, VALID } from './verify';

let mockPublicKeyData: Uint8Array;

const subtle = webcrypto.subtle as unknown as SubtleCrypto;
Object.defineProperty(globalThis.crypto, 'subtle', { value: subtle });

jest.mock('./helpers', () => ({
  ...jest.requireActual<typeof import('./helpers')>('./helpers'),
  getKeyData: () => mockPublicKeyData,
}));

async function signDeepLink(
  privateKey: CryptoKey,
  url: URL,
  signedParams?: string[],
): Promise<URL> {
  if (signedParams) {
    url.searchParams.set(SIG_PARAMS_PARAM, signedParams.join(','));
  }

  const signature = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(canonicalize(url)),
  );

  url.searchParams.set(SIG_PARAM, Buffer.from(signature).toString('base64url'));
  return url;
}

async function parseNavigateQuery(url: URL) {
  const result = await parse(url);
  expect(result).not.toBe(false);
  if (!result || !('path' in result.destination)) {
    throw new Error('Expected a parsed path destination');
  }

  return {
    query: result.destination.query,
    signature: result.signature,
  };
}

async function resolveDeepLink(url: URL) {
  return await getDeferredDeepLinkRoute({
    createdAt: Date.now(),
    referringLink: url.toString(),
  });
}

function getNavigateQuery(
  result: Awaited<ReturnType<typeof getDeferredDeepLinkRoute>>,
): URLSearchParams {
  expect(result?.type).toBe(DeferredDeepLinkRouteType.Navigate);
  if (!result || result.type !== DeferredDeepLinkRouteType.Navigate) {
    throw new Error('Expected a navigate result');
  }

  return new URL(result.route, 'https://metamask.local').searchParams;
}

describe('Perps signed deeplink attribution', () => {
  let privateKey: CryptoKey;

  beforeAll(async () => {
    const keyPair = await subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    );
    privateKey = keyPair.privateKey;
    mockPublicKeyData = new Uint8Array(
      await subtle.exportKey('raw', keyPair.publicKey),
    );
  });

  it('forwards allowlisted attribution covered by a valid signature', async () => {
    const url = await signDeepLink(
      privateKey,
      new URL(
        'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
          '&utm_source=partner-1&utm_medium=push&utm_campaign=q3_launch',
      ),
      ['screen', 'symbol', 'utm_source', 'utm_medium', 'utm_campaign'],
    );

    const result = await resolveDeepLink(url);
    const query = getNavigateQuery(result);

    expect(result?.signature).toBe(VALID);
    expect(query.get('source')).toBe('deeplink');
    expect(query.get('utm_source')).toBe('partner-1');
    expect(query.get('utm_medium')).toBe('push');
    expect(query.get('utm_campaign')).toBe('q3_launch');
  });

  it('drops attribution added outside the signed parameter set', async () => {
    const url = await signDeepLink(
      privateKey,
      new URL('https://link.metamask.io/perps?screen=asset&symbol=ETH'),
      ['screen', 'symbol'],
    );
    url.searchParams.set('utm_source', 'unsigned');

    const result = await resolveDeepLink(url);
    const query = getNavigateQuery(result);

    expect(result?.signature).toBe(VALID);
    expect(query.get('utm_source')).toBeNull();
  });

  it('drops attribution from a valid legacy signature without sig_params', async () => {
    const url = await signDeepLink(
      privateKey,
      new URL(
        'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
          '&utm_source=legacy-signed',
      ),
    );

    const result = await resolveDeepLink(url);
    const query = getNavigateQuery(result);

    expect(result?.signature).toBe(VALID);
    expect(query.get('utm_source')).toBeNull();
  });

  it('keeps attribution out of the destination when the signature is missing', async () => {
    const url = new URL(
      'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
        '&utm_source=partner-1' +
        '&sig_params=screen,symbol,utm_source',
    );

    const parsed = await parseNavigateQuery(url);
    const result = await resolveDeepLink(url);

    expect(parsed.signature).toBe(MISSING);
    expect(parsed.query.get('utm_source')).toBeNull();
    expect(result?.type).toBe(DeferredDeepLinkRouteType.Interstitial);
    expect(result?.signature).toBe(MISSING);
  });

  it('rejects navigation when signed attribution is tampered with', async () => {
    const url = await signDeepLink(
      privateKey,
      new URL(
        'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
          '&utm_campaign=launch',
      ),
      ['screen', 'symbol', 'utm_campaign'],
    );
    url.searchParams.set('utm_campaign', 'tampered');

    const parsed = await parseNavigateQuery(url);
    const result = await resolveDeepLink(url);

    expect(parsed.signature).toBe(INVALID);
    expect(parsed.query.get('utm_campaign')).toBeNull();
    expect(result?.type).toBe(DeferredDeepLinkRouteType.Interstitial);
    expect(result?.signature).toBe(INVALID);
  });

  it('drops malformed attribution even when its signature is valid', async () => {
    const url = await signDeepLink(
      privateKey,
      new URL(
        'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
          '&utm_source=partner%2Fvalue&utm_medium=push%20notification' +
          `&utm_campaign=${'a'.repeat(129)}`,
      ),
      ['screen', 'symbol', 'utm_source', 'utm_medium', 'utm_campaign'],
    );

    const result = await resolveDeepLink(url);
    const query = getNavigateQuery(result);

    expect(result?.signature).toBe(VALID);
    expect(query.get('utm_source')).toBeNull();
    expect(query.get('utm_medium')).toBeNull();
    expect(query.get('utm_campaign')).toBeNull();
  });

  it('rejects navigation when the signature is invalid', async () => {
    const url = await signDeepLink(
      privateKey,
      new URL(
        'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
          '&utm_source=partner-1',
      ),
      ['screen', 'symbol', 'utm_source'],
    );
    url.searchParams.set(SIG_PARAM, 'A'.repeat(86));

    const parsed = await parseNavigateQuery(url);
    const result = await resolveDeepLink(url);

    expect(parsed.signature).toBe(INVALID);
    expect(parsed.query.get('utm_source')).toBeNull();
    expect(result?.type).toBe(DeferredDeepLinkRouteType.Interstitial);
    expect(result?.signature).toBe(INVALID);
  });
});
