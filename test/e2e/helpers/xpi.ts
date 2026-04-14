import { hash } from 'node:crypto';
import { resolve, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import fs, { renameSync, rmSync } from 'node:fs';
import { open, type FileHandle } from 'node:fs/promises';
import { finished } from 'node:stream/promises';
import { crc32 } from 'node:zlib';
import { ZipFile } from 'yazl';

const MANIFEST_FILE_NAME = 'manifest.json';
const XPI_TEMPLATE_VERSION = 1;
const MANIFEST_SIZE = 64 * 1024;
const HASH_SIZE = 44;
const EOCD_SIZE = 22;
const CD_OFFSET_IN_EOCD = 16;
const DATA_OFFSET = 30 + MANIFEST_FILE_NAME.length;
const CD_CRC32_OFFSET = 16;
const LFH_CRC32_OFFSET = 14;
const getId = (json: Buffer): string => JSON.parse(json.toString()).build_id;

/**
 * Reads the manifest file from the given extension directory, pads it to a
 * fixed size, and computes its hash.
 * @param absExtDir - Absolute path to the unpacked extension directory
 * @throws Will throw an error if the manifest file cannot be read or is too large
 */
async function getManifest(absExtDir: string) {
  await using fd = await open(join(absExtDir, MANIFEST_FILE_NAME));
  const readResponse = await fd.read(Buffer.allocUnsafe(MANIFEST_SIZE), 0);
  if (
    readResponse.bytesRead === MANIFEST_SIZE &&
    (await fd.read(Buffer.allocUnsafe(1), 0, 1, MANIFEST_SIZE)).bytesRead
  ) {
    throw new Error(`Manifest file is too large (${MANIFEST_SIZE} bytes max)`);
  }
  const manifest = readResponse.buffer.fill(0x20, readResponse.bytesRead);
  return { manifest, manifestHash: hash('sha256', manifest, 'base64') };
}

/**
 * Returns the path to a cached XPI for the given unpacked extension directory.
 * Builds the XPI on first call, then reuses it as long as the manifest hash in
 * the cached archive comment matches. On a manifest mismatch, it only patches
 * the cached XPI when the current and cached manifest build_id values match.
 * The cache filename is derived from the directory path so different addon dirs
 * get independent caches.
 *
 * @param extDir - Path to the unpacked extension directory
 * @throws Will throw an error if the manifest file cannot be read or is too
 * large, or if the XPI build process fails.
 */
export async function getOrBuildXpi(extDir: string) {
  const absExtDir = resolve(extDir);
  const { manifest, manifestHash } = await getManifest(absExtDir);
  const absExtDirHash = hash('sha256', absExtDir, 'hex');
  const tmpName = `metamask-e2e-${absExtDirHash}-v${XPI_TEMPLATE_VERSION}.xpi`;
  const xpiPath = join(tmpdir(), tmpName);

  try {
    await using fd = await open(xpiPath, 'r+');
    const { size } = await fd.stat();
    const memory = Buffer.allocUnsafe(MANIFEST_SIZE);
    const hashOffset = size - HASH_SIZE;
    const res = await fd.read(memory, 0, HASH_SIZE, hashOffset);
    if (memory.subarray(0, res.bytesRead).toString() === manifestHash) {
      // no changes; no need to patch or rebuild
      return xpiPath;
    }
    const buildId = getId(manifest);
    const { bytesRead } = await fd.read(memory, 0, MANIFEST_SIZE, DATA_OFFSET);
    if (buildId && buildId === getId(memory.fill(0x20, bytesRead))) {
      // only the manifest changed; we can patch the XPI instead of rebuilding
      await patchManifest(fd, hashOffset, manifest, manifestHash);
      return xpiPath;
    }
  } catch {
    console.log('[Firefox E2E] Cache missing or invalid, building XPI');
  }
  // we need to do a full build
  await buildXpi(absExtDir, xpiPath, manifest, manifestHash);
  return xpiPath;
}

/**
 * Builds an XPI file from the given extension directory, using the provided
 * manifest content and hash. The manifest is padded to a fixed size to allow
 * in-place updates later.
 *
 * @param absExtDir - Path to the unpacked extension directory
 * @param xpiPath - Path where the XPI file should be created
 * @param manifest - Buffer containing the manifest content
 * @param manifestHash - Base64-encoded hash of the manifest content
 * @throws Will throw an error if the XPI build process fails
 */
export async function buildXpi(
  absExtDir: string,
  xpiPath: string,
  manifest: Buffer,
  manifestHash: string,
) {
  const tmpPath = `${xpiPath}.${process.pid}-${Date.now()}.tmp`;

  try {
    {
      await using stream = fs.createWriteStream(tmpPath);
      const zip = new ZipFile();
      zip.outputStream.once('error', stream.destroy.bind(stream)).pipe(stream);

      // must be first entry to ensure fixed offsets for patching later
      zip.addBuffer(manifest, MANIFEST_FILE_NAME, { compress: false });
      const readOptions = { recursive: true, withFileTypes: true } as const;
      for (const entry of fs.readdirSync(absExtDir, readOptions)) {
        if (entry.isFile()) {
          const absPath = join(entry.parentPath, entry.name);
          const relPath = relative(absExtDir, absPath);
          if (relPath !== MANIFEST_FILE_NAME) {
            const zipOptions = { compress: true, compressionLevel: 1 };
            zip.addFile(absPath, relPath, zipOptions);
          }
        }
      }
      zip.end({ forceZip64Format: false, comment: manifestHash });
      await finished(stream);
    }

    renameSync(tmpPath, xpiPath);
  } finally {
    rmSync(tmpPath, { force: true });
  }
}

/**
 * Patches the manifest in an existing XPI file with new content and hash. This
 * function requires the manifest is stored in a fixed-size slot and that the
 * hash is located at a known offset from the end of the file. It updates the
 * manifest content, its CRC32 checksums in both the local file header and
 * central directory, and the manifest hash in the EOCD comment.
 *
 * @param xpiFd - File handle for the XPI file to patch
 * @param hashOffset - Offset in the XPI file where the manifest hash is stored (in the EOCD comment)
 * @param newManifest - Buffer containing the new manifest content to write
 * @param newManifestHash - Base64-encoded hash of the manifest content to write
 * @throws Will throw an error if any of the read or write operations fail
 */
export async function patchManifest(
  xpiFd: FileHandle,
  hashOffset: number,
  newManifest: Buffer,
  newManifestHash: string,
) {
  const crc32Buffer = Buffer.allocUnsafe(4);
  crc32Buffer.writeUInt32LE(crc32(newManifest), 0);
  const eOCD = Buffer.allocUnsafe(EOCD_SIZE);
  const eOCDOffset = hashOffset - EOCD_SIZE;
  const readRes = await xpiFd.read(eOCD, 0, EOCD_SIZE, eOCDOffset);
  if (readRes.bytesRead !== EOCD_SIZE) {
    throw new Error(`Failed to read EOCD from XPI at offset ${eOCDOffset}`);
  }
  const cdOffset = eOCD.readUInt32LE(CD_OFFSET_IN_EOCD);
  for (const [buffer, offset] of [
    [crc32Buffer, LFH_CRC32_OFFSET] as const,
    [newManifest, DATA_OFFSET] as const,
    [crc32Buffer, cdOffset + CD_CRC32_OFFSET] as const,
    [Buffer.from(newManifestHash), hashOffset] as const,
  ]) {
    const writeRes = await xpiFd.write(buffer, 0, buffer.length, offset);
    if (writeRes.bytesWritten !== buffer.length) {
      throw new Error(`Failed to write buffer to XPI at offset ${offset}`);
    }
  }
}
