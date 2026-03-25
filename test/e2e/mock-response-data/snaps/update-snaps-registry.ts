import fs from 'fs';
import path from 'path';
import { create } from '@metamask/superstruct';
import { SignatureStruct, verify } from '@metamask/snaps-registry';

/**
 * Same idea as `update-snap-binary.ts`, but for the Snaps execution allowlist:
 * downloads the signed registry + signature from ACL, verifies the pair, then
 * writes bodies and response header snapshots under `acl-registry-and-headers/`.
 *
 * Registry bytes live in `acl-registry.txt` (like snap tarball payloads stored as
 * `*.txt`) so `yarn lint:prettier:fix` does not touch them; only `*.{json,md,mdx,yml}` run.
 */
const REGISTRY_URL = 'https://acl.execution.metamask.io/latest/registry.json';
const SIGNATURE_URL = 'https://acl.execution.metamask.io/latest/signature.json';

const OUT_DIR = path.join(__dirname, 'acl-registry-and-headers');
const REGISTRY_PATH = path.join(OUT_DIR, 'acl-registry.txt');
const SIGNATURE_PATH = path.join(OUT_DIR, 'acl-signature.json');
const REGISTRY_HEADERS_PATH = path.join(OUT_DIR, 'acl-registry-headers.json');
const SIGNATURE_HEADERS_PATH = path.join(OUT_DIR, 'acl-signature-headers.json');

/** Public key from JsonSnapsRegistry / extension snaps registry init. */
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
function saveAclHeadersFile(
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
    fetch(REGISTRY_URL),
    fetch(SIGNATURE_URL),
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
  const signature = create(JSON.parse(signatureText), SignatureStruct);

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

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, registryText);
  fs.writeFileSync(SIGNATURE_PATH, signatureText);
  saveAclHeadersFile(REGISTRY_HEADERS_PATH, registryRes, registryText);
  saveAclHeadersFile(SIGNATURE_HEADERS_PATH, signatureRes, signatureText);

  console.log(`Wrote ${REGISTRY_PATH} (${registryText.length} bytes)`);
  console.log(`Wrote ${REGISTRY_HEADERS_PATH}`);
  console.log(`Wrote ${SIGNATURE_PATH} (${signatureText.length} bytes)`);
  console.log(`Wrote ${SIGNATURE_HEADERS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
