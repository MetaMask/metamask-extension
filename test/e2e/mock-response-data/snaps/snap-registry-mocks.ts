import fs from 'fs';
import path from 'path';
import type { Mockttp } from 'mockttp';

/** Directory under this file’s folder holding execution-registry/signature mocks. */
export const SNAPS_REGISTRY_MOCKS_DIRECTORY = 'registry-and-headers';

export const SNAPS_REGISTRY_BODY_FILENAME = 'registry.txt';
export const SNAPS_SIGNATURE_BODY_FILENAME = 'signature.json';
export const SNAPS_REGISTRY_HEADERS_FILENAME = 'registry-headers.json';
export const SNAPS_SIGNATURE_HEADERS_FILENAME = 'signature-headers.json';

/** Snaps execution endpoints. */
export const SNAPS_REGISTRY_URL =
  'https://acl.execution.metamask.io/latest/registry.json';
export const SNAPS_SIGNATURE_URL =
  'https://acl.execution.metamask.io/latest/signature.json';

/** Absolute directory for registry mocks (same layout as `update-snaps-registry` writes). */
export const SNAPS_REGISTRY_MOCK_DIR = path.join(
  __dirname,
  SNAPS_REGISTRY_MOCKS_DIRECTORY,
);

export const SNAPS_REGISTRY_BODY_PATH = path.join(
  SNAPS_REGISTRY_MOCK_DIR,
  SNAPS_REGISTRY_BODY_FILENAME,
);
export const SNAPS_SIGNATURE_BODY_PATH = path.join(
  SNAPS_REGISTRY_MOCK_DIR,
  SNAPS_SIGNATURE_BODY_FILENAME,
);
export const SNAPS_REGISTRY_HEADERS_PATH = path.join(
  SNAPS_REGISTRY_MOCK_DIR,
  SNAPS_REGISTRY_HEADERS_FILENAME,
);
export const SNAPS_SIGNATURE_HEADERS_PATH = path.join(
  SNAPS_REGISTRY_MOCK_DIR,
  SNAPS_SIGNATURE_HEADERS_FILENAME,
);

/**
 * Serves signed Snaps execution allowlist (registry + signature) from local fixtures.
 *
 * @param server - Mockttp server
 */
export async function setupSnapRegistryMocks(server: Mockttp): Promise<void> {
  const registryBody = fs.readFileSync(SNAPS_REGISTRY_BODY_PATH);
  const signatureBody = fs.readFileSync(SNAPS_SIGNATURE_BODY_PATH);
  const registryHeaders = JSON.parse(
    fs.readFileSync(SNAPS_REGISTRY_HEADERS_PATH, 'utf8'),
  ) as Record<string, string>;
  const signatureHeaders = JSON.parse(
    fs.readFileSync(SNAPS_SIGNATURE_HEADERS_PATH, 'utf8'),
  ) as Record<string, string>;

  await server
    .forGet(SNAPS_REGISTRY_URL)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      rawBody: registryBody,
      headers: registryHeaders,
    }));

  await server
    .forGet(SNAPS_SIGNATURE_URL)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      rawBody: signatureBody,
      headers: signatureHeaders,
    }));
}
