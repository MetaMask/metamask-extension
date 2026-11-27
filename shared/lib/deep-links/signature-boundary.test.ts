/**
 * @jest-environment node
 */
// Signs with a real P-256 key so that only `getKeyData` is replaced, and asserts
// what a valid signature covers and what reaches the handler on every status.
import { webcrypto } from 'node:crypto';

let mockRawPublicKey: Uint8Array;
jest.mock('./helpers', () => {
  const actual = jest.requireActual('./helpers');
  return { ...actual, getKeyData: () => mockRawPublicKey };
});

// eslint-disable-next-line import-x/first
import { parse } from './parse';
// eslint-disable-next-line import-x/first
import { canonicalize } from './canonicalize';
// eslint-disable-next-line import-x/first
import { createEvent } from './metrics';
// eslint-disable-next-line import-x/first
import { withReferralCode } from './referral';

const ORIGIN = 'https://link.metamask.io';

let privateKey: webcrypto.CryptoKey;

async function signString(value: string): Promise<string> {
  const signature = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(value),
  );
  return Buffer.from(signature).toString('base64url');
}

async function signedUrl(base: string, unsigned = ''): Promise<URL> {
  const sig = await signString(canonicalize(new URL(base)));
  const separator = base.includes('?') ? '&' : '?';
  return new URL(`${base}${separator}sig=${sig}${unsigned}`);
}

// The card route copies every parameter its handler receives into its
// redirect, so the redirect's query is exactly what the handler received.
function handlerReceived(parsed: Awaited<ReturnType<typeof parse>>): string {
  if (!parsed || !('redirectTo' in parsed.destination)) {
    throw new Error('expected the card route to parse to a redirect');
  }
  return parsed.destination.redirectTo.searchParams.toString();
}

function eventProperty(url: URL, signature: string, key: string): unknown {
  const event = createEvent({ url, signature } as Parameters<
    typeof createEvent
  >[0]);
  return (event.properties as Record<string, unknown>)[key];
}

describe('deep-link signature boundary', () => {
  beforeAll(async () => {
    const pair = await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    );
    privateKey = pair.privateKey;
    mockRawPublicKey = new Uint8Array(
      await webcrypto.subtle.exportKey('raw', pair.publicKey),
    );
  });

  describe('the handler receives the canonical parameters on every status', () => {
    it('on an unsigned link, receives the parameters its author listed in sig_params', async () => {
      const parsed = await parse(
        new URL(`${ORIGIN}/card-onboarding?sig_params=a&a=1&b=2`),
      );

      expect(parsed && parsed.signature).toBe('missing');
      expect(handlerReceived(parsed)).toBe('a=1');
    });

    it('on an unsigned link without sig_params, receives the whole query', async () => {
      const parsed = await parse(new URL(`${ORIGIN}/card-onboarding?a=1&b=2`));

      expect(parsed && parsed.signature).toBe('missing');
      expect(handlerReceived(parsed)).toBe('a=1&b=2');
    });

    it('on a link whose sig_params was rewritten, is invalid and still receives the rewritten list', async () => {
      const good = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=a&a=1`,
      );
      const sig = good.searchParams.get('sig');
      const parsed = await parse(
        new URL(`${ORIGIN}/card-onboarding?sig_params=a,b&a=1&b=2&sig=${sig}`),
      );

      expect(parsed && parsed.signature).toBe('invalid');
      expect(handlerReceived(parsed)).toBe('a=1&b=2');
    });
  });

  describe('where a valid signature covers less than it appears to', () => {
    it('with an empty sig_params, verifies, gives the handler nothing, and the event records what follows', async () => {
      const url = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=`,
        '&utm_source=unsigned-source&x=1',
      );
      const parsed = await parse(url);

      expect(parsed && parsed.signature).toBe('valid');
      expect(handlerReceived(parsed)).toBe('');
      expect(eventProperty(url, 'valid', 'utm_source')).toBe('unsigned-source');
    });

    it('with a repeated named parameter, carries every value into the canonical string and the handler', async () => {
      const url = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=a&a=1&a=2`,
      );
      const parsed = await parse(url);

      expect(parsed && parsed.signature).toBe('valid');
      expect(handlerReceived(parsed)).toBe('a=1&a=2');
    });

    it('with a repeated key outside the signature, the event records the last value', async () => {
      const url = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=a&a=1`,
        '&utm_source=first-value&utm_source=last-value',
      );
      const parsed = await parse(url);

      expect(parsed && parsed.signature).toBe('valid');
      expect(eventProperty(url, 'valid', 'utm_source')).toBe('last-value');
    });

    it('with a repeated sig_params, canonicalize reads the first and the handler never sees the second', async () => {
      const url = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=a&a=1`,
        '&sig_params=a,b&b=2',
      );
      const parsed = await parse(url);

      expect(parsed && parsed.signature).toBe('valid');
      expect(handlerReceived(parsed)).toBe('a=1');
    });

    it('with a ref added after signing, verifies, keeps it from the handler, and carries it to the destination and the event', async () => {
      const url = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=a&a=1`,
        '&ref=ADDEDCODE',
      );
      const parsed = await parse(url);
      const destination = new URL(
        withReferralCode('chrome-extension://id/home.html', url.searchParams),
      );

      expect(parsed && parsed.signature).toBe('valid');
      expect(handlerReceived(parsed)).toBe('a=1');
      expect(destination.searchParams.get('ref')).toBe('ADDEDCODE');
      expect(eventProperty(url, 'valid', 'referral_code')).toBe('ADDEDCODE');
    });

    it('with a repeated ref, neither the destination nor the event accepts it', async () => {
      const url = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=a&a=1`,
        '&ref=FIRSTCODE&ref=SECONDCODE',
      );
      const destination = new URL(
        withReferralCode('chrome-extension://id/home.html', url.searchParams),
      );

      expect(destination.searchParams.has('ref')).toBe(false);
      expect(eventProperty(url, 'valid', 'referral_code')).toBeUndefined();
    });

    it('with a signed ref and a second ref added after signing, the signature fails and neither is accepted', async () => {
      const url = await signedUrl(
        `${ORIGIN}/card-onboarding?sig_params=ref&ref=SIGNEDCODE`,
        '&ref=ADDEDCODE',
      );
      const parsed = await parse(url);
      const destination = new URL(
        withReferralCode('chrome-extension://id/home.html', url.searchParams),
      );

      expect(parsed && parsed.signature).toBe('invalid');
      expect(destination.searchParams.has('ref')).toBe(false);
      expect(eventProperty(url, 'invalid', 'referral_code')).toBeUndefined();
    });

    it('the route lookup lowercases the path and the signature does not', async () => {
      const url = await signedUrl(`${ORIGIN}/card-onboarding?sig_params=a&a=1`);
      const parsed = await parse(
        new URL(url.href.replace('/card-onboarding', '/Card-Onboarding')),
      );

      expect(parsed && parsed.signature).toBe('invalid');
      expect(handlerReceived(parsed)).toBe('a=1');
    });
  });

  describe('verify retries the other configured hosts', () => {
    const signedAsCom =
      'https://link.metamask.com/card-onboarding?a=1&sig_params=a';

    it('accepts a link signed under an alternate host over HTTPS', async () => {
      const sig = await signString(signedAsCom);
      const parsed = await parse(new URL(`${signedAsCom}&sig=${sig}`));

      expect(parsed && parsed.signature).toBe('valid');
    });

    it('does not retry over HTTP', async () => {
      const sig = await signString(signedAsCom);
      const parsed = await parse(
        new URL(`${signedAsCom.replace('https:', 'http:')}&sig=${sig}`),
      );

      expect(parsed && parsed.signature).toBe('invalid');
    });
  });
});
