import {
  fingerprint,
  locateCentralDirectory,
  parseCentralDirectory,
} from './zip-fingerprint.mts';

function entryRecord(name: string, crc: number, size: number): Buffer {
  const nameBytes = Buffer.from(name);
  const record = Buffer.alloc(46 + nameBytes.length);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt32LE(crc, 16);
  record.writeUInt32LE(size, 24);
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
  const directory = Buffer.concat(entries.map((e) => entryRecord(...e)));

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

  it('parses names, CRCs and sizes', () => {
    expect(parseCentralDirectory(directory, entries.length)[1]).toStrictEqual({
      name: 'a.js',
      crc: 1,
      size: 10,
    });
  });

  it('ignores order, directories and manifest.json', () => {
    const reordered = [
      { name: 'a.js', crc: 1, size: 10 },
      { name: 'b.js', crc: 2, size: 20 },
      { name: 'manifest.json', crc: 5, size: 5 },
    ];

    expect(fingerprint(parseCentralDirectory(directory, 4))).toBe(
      fingerprint(reordered),
    );
  });

  it('changes when a file changes', () => {
    const changed = [
      { name: 'a.js', crc: 1, size: 10 },
      { name: 'b.js', crc: 3, size: 20 },
    ];

    expect(fingerprint(parseCentralDirectory(directory, 4))).not.toBe(
      fingerprint(changed),
    );
  });
});
