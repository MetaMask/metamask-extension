/**
 * BNS client-side security helpers for MetaMask.
 *
 * Mirrors bnes-brave-core/bnes/bns_security.cc and bns/src/utils/bnsSecurity.ts
 * so wallet, web app, and BnesBrowser share one fail-closed boundary.
 */

const BNES_SUFFIX = '.bnes';
const MIN_CID_LENGTH = 4;
const MAX_CID_LENGTH = 256;

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_ALPHABET_SET = new Set(BASE58_ALPHABET.split(''));

function isBase58Character(character: string): boolean {
  return BASE58_ALPHABET_SET.has(character);
}

function isBase32LowerCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return (code >= 97 && code <= 122) || (code >= 50 && code <= 55);
}

function isValidDnsLabel(label: string): boolean {
  if (
    !label ||
    label.length > 63 ||
    label.startsWith('-') ||
    label.endsWith('-')
  ) {
    return false;
  }
  for (const character of label) {
    if (!/[a-z0-9-]/.test(character)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates every DNS label of a host, rejecting empty labels and
 * leading/trailing hyphens (for example `bear..bnes`, `-bear.bnes`).
 *
 * @param host - Hostname without scheme.
 * @returns Whether every label is a valid DNS label.
 */
export function hasOnlyValidDnsLabels(host: string): boolean {
  if (!host) {
    return false;
  }
  const labels = host.split('.');
  return labels.every((label) => isValidDnsLabel(label));
}

/**
 * Accepts only unambiguous navigation hosts of the form `<labels>.bnes`.
 * The apex `bnes` itself is not a resolvable user name.
 *
 * @param host - Hostname or bare BNS name.
 * @returns Whether the host may be resolved.
 */
export function isAllowedBnesHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  if (normalized.length <= BNES_SUFFIX.length) {
    return false;
  }
  if (!normalized.endsWith(BNES_SUFFIX)) {
    return false;
  }
  return hasOnlyValidDnsLabels(normalized);
}

/**
 * Normalizes user input (`bnes://bear.bnes/path`, `bear.bnes`, `BEAR.BNES`)
 * into a lower-case host suitable for namehash / security checks.
 *
 * @param input - URL, host, or bare name.
 * @returns Normalized host, or null if structurally invalid.
 */
export function normalizeBnesName(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let host = trimmed;
  if (trimmed.includes('://')) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'bnes:' && url.protocol !== 'https:') {
        return null;
      }
      if (url.username || url.password || url.port) {
        return null;
      }
      host = url.hostname;
    } catch {
      return null;
    }
  } else if (trimmed.includes('/')) {
    host = trimmed.split('/')[0] ?? '';
  }

  const normalized = host.toLowerCase();
  return isAllowedBnesHost(normalized) ? normalized : null;
}

/**
 * CID text forms accepted by path-style gateways:
 * - CIDv0: exactly 46 base58btc characters beginning with `Qm`
 * - CIDv1: canonical lowercase base32 beginning with `b`
 *
 * @param cid - Candidate CID text.
 * @returns Whether the CID is structurally acceptable.
 */
export function isValidCid(cid: string): boolean {
  if (cid.length < MIN_CID_LENGTH || cid.length > MAX_CID_LENGTH) {
    return false;
  }

  if (cid.startsWith('Qm')) {
    if (cid.length !== 46) {
      return false;
    }
    for (const character of cid) {
      if (!isBase58Character(character)) {
        return false;
      }
    }
    return true;
  }

  if (!cid.startsWith('b')) {
    return false;
  }
  for (const character of cid) {
    if (!isBase32LowerCharacter(character)) {
      return false;
    }
  }
  return true;
}

/**
 * Builds a path-style IPFS gateway URL only for a trusted host and a validated
 * CID. The CID is never treated as an arbitrary URL fragment.
 *
 * @param trustedGatewayHost - Bare hostname (no scheme/path).
 * @param cid - Structurally validated CID.
 * @param path - Optional resource path under the CID.
 * @returns Canonical HTTPS path-gateway URL.
 */
export function buildTrustedIpfsGatewayUrl(
  trustedGatewayHost: string,
  cid: string,
  path = '',
): string {
  const host = trustedGatewayHost.trim().toLowerCase();
  if (!host || host.includes('/') || host.includes(':') || host.includes('@')) {
    throw new Error('Trusted gateway host must be a bare hostname');
  }
  if (!isValidCid(cid)) {
    throw new Error('CID failed structural validation');
  }

  const normalizedPath = path
    ? path.startsWith('/')
      ? path
      : `/${path}`
    : '';
  return `https://${host}/ipfs/${cid}${normalizedPath}`;
}

/**
 * Same origin pin used by the C++ helper: HTTPS, no credentials/port/query/hash,
 * exact trusted host match, and no IP-literal authority.
 *
 * @param urlValue - Candidate absolute URL.
 * @param trustedGatewayHost - Bare trusted hostname.
 * @returns Whether the URL is pinned to the trusted origin.
 */
export function isAllowedGatewayUrl(
  urlValue: string,
  trustedGatewayHost: string,
): boolean {
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') {
    return false;
  }
  if (url.username || url.password || url.port || url.search || url.hash) {
    return false;
  }
  if (
    /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname) ||
    url.hostname.includes(':')
  ) {
    return false;
  }
  return (
    url.hostname.toLowerCase() === trustedGatewayHost.trim().toLowerCase()
  );
}
