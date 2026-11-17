import { createHash } from 'crypto';

const END_SIGNATURE = 0x06054b50;
const ENTRY_SIGNATURE = 0x02014b50;
const END_RECORD_SIZE = 22;
const MAX_COMMENT = 0xffff;

// A suffix range this long always contains the end-of-central-directory record.
export const TAIL_BYTES = END_RECORD_SIZE + MAX_COMMENT;

export type ZipEntry = { name: string; crc: number; size: number };

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
    });
    position += 46 + nameLength + extraLength + commentLength;
  }
  return result;
}

/**
 * Fingerprint of the files in a build zip, ignoring `manifest.json` (it gets a
 * per-arm marker later) and directories. Two zips with the same fingerprint
 * hold the same file names, sizes and CRC-32s, regardless of compression or
 * timestamps.
 *
 * @param entries - Entries from {@link parseCentralDirectory}.
 */
export function fingerprint(entries: ZipEntry[]): string {
  const lines = entries
    .filter((e) => !e.name.endsWith('/') && e.name !== 'manifest.json')
    .map((e) => `${e.name}\0${e.crc}\0${e.size}`)
    .sort();
  return createHash('sha256').update(lines.join('\n')).digest('hex');
}
