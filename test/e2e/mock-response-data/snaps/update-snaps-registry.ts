import fs from 'fs';
import { verify } from '@metamask/snaps-registry';
import {
  SNAPS_REGISTRY_URL,
  SNAPS_SIGNATURE_URL,
  SNAPS_REGISTRY_BODY_PATH,
  SNAPS_REGISTRY_HEADERS_PATH,
  SNAPS_REGISTRY_MOCK_DIR,
  SNAPS_SIGNATURE_BODY_PATH,
  SNAPS_SIGNATURE_HEADERS_PATH,
} from './snap-registry-mocks';

/**
 * Same idea as `update-snap-binary.ts`, but for the Snaps execution allowlist:
 * downloads the signed registry + signature from ACL, verifies the pair, then
 * writes bodies and response header snapshots (paths from `snap-registry-mocks.ts`).
 *
 * Registry bytes use `*.txt` so `yarn lint:prettier:fix` does not touch them.
 */

/** Public key from SnapRegistryController / extension snaps registry init. */
const REGISTRY_PUBLIC_KEY =
  '0x025b65308f0f0fb8bc7f7ff87bfc296e0330eee5d3c1d1ee4a048b2fd6a86fa0a6';

/**
 * Persists a subset of response headers (aligned with `update-snap-binary.ts`
 * `relevantHeaders`) plus a Content-Length that matches the saved body.
 *
 * @param filePath - Path to write the JSON header snapshot.
 * @param response - Fetch `Response` whose headers are copied (subset).
 * @param bodyUtf8 - UTF-8 body string; used to set `Content-Length`.
 */
function saveHeadersFile(
  filePath: string,
  response: Response,
  bodyUtf8: string,
) {
  const headerGet = (name: string) => response.headers.get(name);
  const contentTypeRaw = headerGet('content-type') ?? 'application/json';
  const contentType =
    contentTypeRaw.split(';')[0]?.trim() ?? 'application/json';

  const relevantHeaders: Record<string, string> = {
    'Accept-Ranges': headerGet('accept-ranges') ?? 'bytes',
    'Content-Length': String(Buffer.byteLength(bodyUtf8, 'utf8')),
    'Content-Type': contentType,
  };

  const etag = headerGet('etag');
  if (etag) {
    relevantHeaders.Etag = etag;
  }

  const cacheControl = headerGet('cache-control');
  if (cacheControl) {
    relevantHeaders['Cache-Control'] = cacheControl;
  }

  const lastModified = headerGet('last-modified');
  if (lastModified) {
    relevantHeaders['Last-Modified'] = lastModified;
  }

  fs.writeFileSync(filePath, `${JSON.stringify(relevantHeaders, null, 2)}\n`);
}

async function main() {
  const [registryRes, signatureRes] = await Promise.all([
    fetch(SNAPS_REGISTRY_URL),
    fetch(SNAPS_SIGNATURE_URL),
  ]);

  if (!registryRes.ok) {
    throw new Error(
      `registry fetch failed: ${registryRes.status} ${registryRes.statusText}`,
    );
  }
  if (!signatureRes.ok) {
    throw new Error(
      `signature fetch failed: ${signatureRes.status} ${signatureRes.statusText}`,
    );
  }

  const registryText = await registryRes.text();
  const signatureText = await signatureRes.text();
  const signature = JSON.parse(signatureText);

  const valid = await verify({
    registry: registryText,
    signature,
    publicKey: REGISTRY_PUBLIC_KEY,
  });

  if (!valid) {
    throw new Error(
      'Downloaded registry.json + signature.json is not valid; not writing fixtures.',
    );
  }

  fs.mkdirSync(SNAPS_REGISTRY_MOCK_DIR, { recursive: true });
  fs.writeFileSync(SNAPS_REGISTRY_BODY_PATH, registryText);
  fs.writeFileSync(SNAPS_SIGNATURE_BODY_PATH, signatureText);
  saveHeadersFile(SNAPS_REGISTRY_HEADERS_PATH, registryRes, registryText);
  saveHeadersFile(SNAPS_SIGNATURE_HEADERS_PATH, signatureRes, signatureText);

  console.log(
    `Wrote ${SNAPS_REGISTRY_BODY_PATH} (${registryText.length} bytes)`,
  );
  console.log(`Wrote ${SNAPS_REGISTRY_HEADERS_PATH}`);
  console.log(
    `Wrote ${SNAPS_SIGNATURE_BODY_PATH} (${signatureText.length} bytes)`,
  );
  console.log(`Wrote ${SNAPS_SIGNATURE_HEADERS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
