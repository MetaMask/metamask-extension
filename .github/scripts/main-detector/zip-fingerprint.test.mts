import { deflateRawSync } from 'node:zlib';
import {
  fingerprint,
  inflateEntry,
  localDataOffset,
  locateCentralDirectory,
  normalizeManifest,
  parseCentralDirectory,
  type ZipEntry,
} from './zip-fingerprint.mts';

const entry = (name: string, crc: number, size: number): ZipEntry => ({
  name,
  crc,
  size,
  method: 8,
  compressedSize: size,
  offset: 0,
});

function entryRecord(
  name: string,
  crc: number,
  size: number,
  offset: number,
): Buffer {
  const nameBytes = Buffer.from(name);
  const record = Buffer.alloc(46 + nameBytes.length);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt16LE(8, 10);
  record.writeUInt32LE(crc, 16);
  record.writeUInt32LE(size, 20);
  record.writeUInt32LE(size, 24);
  record.writeUInt32LE(offset, 42);
  record.writeUInt16LE(nameBytes.length, 28);
  nameBytes.copy(record, 46);
  return record;
}

function endRecord(entries: number, size: number, offset: number): Buffer {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(entries, 10);
  record.writeUInt32LE(size, 12);
  record.writeUInt32LE(offset, 16);
  return record;
}

describe('zip fingerprint', () => {
  const entries = [
    ['b.js', 2, 20],
    ['a.js', 1, 10],
    ['dir/', 0, 0],
    ['manifest.json', 9, 99],
  ] as const;
  const directory = Buffer.concat(
    entries.map(([name, crc, size], position) =>
      entryRecord(name, crc, size, position * 100),
    ),
  );

  it('locates the central directory from the tail of a zip', () => {
    const tail = Buffer.concat([
      Buffer.from('file data'),
      directory,
      endRecord(entries.length, directory.length, 1000),
    ]);

    expect(locateCentralDirectory(tail)).toStrictEqual({
      offset: 1000,
      size: directory.length,
      entries: entries.length,
    });
  });

  it('gives up on Zip64 archives', () => {
    expect(
      locateCentralDirectory(endRecord(0xffff, 0xffffffff, 0xffffffff)),
    ).toBeUndefined();
  });

  it('parses names, CRCs, sizes and where each entry is stored', () => {
    expect(parseCentralDirectory(directory, entries.length)[1]).toStrictEqual({
      name: 'a.js',
      crc: 1,
      size: 10,
      method: 8,
      compressedSize: 10,
      offset: 100,
    });
  });

  it('ignores order and directories', () => {
    const reordered = [
      entry('a.js', 1, 10),
      entry('b.js', 2, 20),
      entry('manifest.json', 5, 5),
    ];

    expect(fingerprint(parseCentralDirectory(directory, 4), 'm')).toBe(
      fingerprint(reordered, 'm'),
    );
  });

  it('changes when a file changes', () => {
    const changed = [entry('a.js', 1, 10), entry('b.js', 3, 20)];

    expect(fingerprint(parseCentralDirectory(directory, 4), 'm')).not.toBe(
      fingerprint(changed, 'm'),
    );
  });

  it('changes when only the manifest changes', () => {
    const files = [entry('a.js', 1, 10), entry('manifest.json', 9, 99)];

    expect(fingerprint(files, '{"a":1}')).not.toBe(
      fingerprint(files, '{"a":2}'),
    );
  });
});

describe('manifest and entry data', () => {
  it('ignores build_id, which differs between identical builds', () => {
    expect(normalizeManifest('{"a":1,"build_id":"x"}')).toBe(
      normalizeManifest('{"a":1,"build_id":"y"}'),
    );
    expect(normalizeManifest('{"a":1,"build_id":"x"}')).not.toBe(
      normalizeManifest('{"a":2,"build_id":"x"}'),
    );
  });

  it('finds the data after the name and extra field', () => {
    const header = Buffer.alloc(30);
    header.writeUInt16LE(13, 26);
    header.writeUInt16LE(4, 28);

    expect(localDataOffset(header)).toBe(47);
  });

  it('reads stored and deflated data and rejects other methods', () => {
    const text = Buffer.from('{"a":1}');

    expect(inflateEntry(text, 0)).toStrictEqual(text);
    expect(inflateEntry(deflateRawSync(text), 8)).toStrictEqual(text);
    expect(() => inflateEntry(text, 99)).toThrow('Unsupported compression');
  });
});
