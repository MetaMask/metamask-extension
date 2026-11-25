import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

const END_SIGNATURE = 0x06054b50;
const ENTRY_SIGNATURE = 0x02014b50;
const END_RECORD_SIZE = 22;
const MAX_COMMENT = 0xffff;

// A suffix range this long always contains the end-of-central-directory record.
export const TAIL_BYTES = END_RECORD_SIZE + MAX_COMMENT;

export type ZipEntry = {
  name: string;
  crc: number;
  size: number;
  // Compression method: 0 stored, 8 deflate.
  method: number;
  compressedSize: number;
  // Where the entry's local header starts in the file.
  offset: number;
};

// Fixed part of a local file header; the name and extra field follow it.
export const LOCAL_HEADER_SIZE = 30;

export type CentralDirectoryLocation = {
  offset: number;
  size: number;
  entries: number;
};

/**
 * Finds the central directory in the tail of a zip file.
 *
 * @param tail - The last bytes of the file, at least up to the end record.
 * @returns Where the central directory is, relative to the start of the file,
 * or undefined when the record is missing or the archive uses Zip64.
 */
export function locateCentralDirectory(
  tail: Buffer,
): CentralDirectoryLocation | undefined {
  for (let i = tail.length - END_RECORD_SIZE; i >= 0; i--) {
    if (tail.readUInt32LE(i) === END_SIGNATURE) {
      const entries = tail.readUInt16LE(i + 10);
      const size = tail.readUInt32LE(i + 12);
      const offset = tail.readUInt32LE(i + 16);
      if (entries === 0xffff || size === 0xffffffff || offset === 0xffffffff) {
        return undefined;
      }
      return { offset, size, entries };
    }
  }
  return undefined;
}

/**
 * Reads the name, CRC-32 and uncompressed size of every entry.
 *
 * @param directory - The central directory bytes.
 * @param entries - Entry count from the end record.
 */
export function parseCentralDirectory(
  directory: Buffer,
  entries: number,
): ZipEntry[] {
  const result: ZipEntry[] = [];
  let position = 0;
  for (let i = 0; i < entries; i++) {
    if (directory.readUInt32LE(position) !== ENTRY_SIGNATURE) {
      throw new Error(`Bad central directory entry ${i}`);
    }
    // Fixed 46-byte header; the name, extra field and comment follow it.
    const nameLength = directory.readUInt16LE(position + 28);
    const extraLength = directory.readUInt16LE(position + 30);
    const commentLength = directory.readUInt16LE(position + 32);
    result.push({
      name: directory.toString(
        'utf8',
        position + 46,
        position + 46 + nameLength,
      ),
      crc: directory.readUInt32LE(position + 16),
      size: directory.readUInt32LE(position + 24),
      method: directory.readUInt16LE(position + 10),
      compressedSize: directory.readUInt32LE(position + 20),
      offset: directory.readUInt32LE(position + 42),
    });
    position += 46 + nameLength + extraLength + commentLength;
  }
  return result;
}

/**
 * Where an entry's data starts, relative to its local header.
 *
 * @param header - The first `LOCAL_HEADER_SIZE` bytes of the local header.
 */
export function localDataOffset(header: Buffer): number {
  return LOCAL_HEADER_SIZE + header.readUInt16LE(26) + header.readUInt16LE(28);
}

/**
 * @param data - The entry's data as stored in the zip.
 * @param method - Compression method from the central directory.
 */
export function inflateEntry(data: Buffer, method: number): Buffer {
  if (method === 0) {
    return data;
  }
  if (method === 8) {
    return inflateRawSync(data);
  }
  throw new Error(`Unsupported compression method ${method}`);
}

/**
 * The manifest without `build_id`, which differs between builds even when
 * their code is identical.
 *
 * @param text - Contents of `manifest.json`.
 */
export function normalizeManifest(text: string): string {
  const manifest = JSON.parse(text);
  delete manifest.build_id;
  return JSON.stringify(manifest);
}

/**
 * Fingerprint of the files in a build zip, ignoring directories. Two zips with
 * the same fingerprint hold the same file names, sizes and CRC-32s, regardless
 * of compression or timestamps, and the same manifest. The manifest is
 * compared by content because a commit that only edits it must not look
 * unchanged.
 *
 * @param entries - Entries from {@link parseCentralDirectory}.
 * @param manifest - The zip's manifest from {@link normalizeManifest}.
 */
export function fingerprint(entries: ZipEntry[], manifest: string): string {
  const lines = entries
    .filter((e) => !e.name.endsWith('/') && e.name !== 'manifest.json')
    .map((e) => `${e.name}\0${e.crc}\0${e.size}`);
  lines.push(`manifest.json\0${manifest}`);
  return createHash('sha256').update(lines.sort().join('\n')).digest('hex');
}
