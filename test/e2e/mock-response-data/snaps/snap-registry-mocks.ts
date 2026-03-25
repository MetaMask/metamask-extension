import fs from 'fs';
import path from 'path';
import type { Mockttp } from 'mockttp';

/** Directory under this file’s folder holding ACL registry/signature fixtures. */
export const SNAPS_ACL_FIXTURES_DIRECTORY = 'registry-and-headers';

export const SNAPS_ACL_REGISTRY_BODY_FILENAME = 'registry.txt';
export const SNAPS_ACL_SIGNATURE_BODY_FILENAME = 'signature.json';
export const SNAPS_ACL_REGISTRY_HEADERS_FILENAME = 'registry-headers.json';
export const SNAPS_ACL_SIGNATURE_HEADERS_FILENAME = 'signature-headers.json';

const ACL_REGISTRY_URL = 'https://acl.execution.metamask.io/latest/registry.json';
const ACL_SIGNATURE_URL =
  'https://acl.execution.metamask.io/latest/signature.json';

/**
 * Absolute paths to on-disk ACL registry mocks (same layout as
 * `update-snaps-registry` writes).
 */
export function getSnapAclRegistryFixturePaths(): {
  outDir: string;
  registryBody: string;
  signatureBody: string;
  registryHeaders: string;
  signatureHeaders: string;
} {
  const outDir = path.join(__dirname, SNAPS_ACL_FIXTURES_DIRECTORY);
  return {
    outDir,
    registryBody: path.join(outDir, SNAPS_ACL_REGISTRY_BODY_FILENAME),
    signatureBody: path.join(outDir, SNAPS_ACL_SIGNATURE_BODY_FILENAME),
    registryHeaders: path.join(outDir, SNAPS_ACL_REGISTRY_HEADERS_FILENAME),
    signatureHeaders: path.join(outDir, SNAPS_ACL_SIGNATURE_HEADERS_FILENAME),
  };
}

/**
 * Serves signed Snaps execution allowlist (registry + signature) from local fixtures.
 */
export async function setupSnapRegistryMocks(server: Mockttp): Promise<void> {
  const paths = getSnapAclRegistryFixturePaths();
  const aclRegistryBody = fs.readFileSync(paths.registryBody);
  const aclSignatureBody = fs.readFileSync(paths.signatureBody);
  const registryHeaders = JSON.parse(
    fs.readFileSync(paths.registryHeaders, 'utf8'),
  ) as Record<string, string>;
  const signatureHeaders = JSON.parse(
    fs.readFileSync(paths.signatureHeaders, 'utf8'),
  ) as Record<string, string>;

  await server
    .forGet(ACL_REGISTRY_URL)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      rawBody: aclRegistryBody,
      headers: registryHeaders,
    }));

  await server
    .forGet(ACL_SIGNATURE_URL)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      rawBody: aclSignatureBody,
      headers: signatureHeaders,
    }));
}
