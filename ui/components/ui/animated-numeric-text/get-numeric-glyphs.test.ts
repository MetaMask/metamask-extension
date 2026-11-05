import { getNumericGlyphs } from './get-numeric-glyphs';

const keysOf = (value: string) => getNumericGlyphs(value).map(({ key }) => key);

describe('getNumericGlyphs', () => {
  it('returns one glyph per character', () => {
    expect(getNumericGlyphs('12.5')).toStrictEqual([
      { character: '1', key: 'digit-0-1' },
      { character: '2', key: 'digit-1-2' },
      { character: '.', key: 'separator-46-0' },
      { character: '5', key: 'digit-2-5' },
    ]);
  });

  it('keeps existing keys when a digit is appended', () => {
    const before = keysOf('12');
    const after = keysOf('123');

    expect(after.slice(0, before.length)).toStrictEqual(before);
    expect(after[2]).toBe('digit-2-3');
  });

  it('keeps the remaining keys when the last digit is deleted', () => {
    expect(keysOf('12')).toStrictEqual(keysOf('123').slice(0, 2));
  });

  it('keeps a separator key when digits are appended after it', () => {
    expect(keysOf('1.')).toStrictEqual(keysOf('1.5').slice(0, 2));
  });

  it('changes the key when a digit is replaced', () => {
    expect(keysOf('15')[1]).not.toBe(keysOf('16')[1]);
  });

  it('keeps a separator key when a digit is inserted before it', () => {
    expect(keysOf('1.5')).toContain('separator-46-0');
    expect(keysOf('12.5')).toContain('separator-46-0');
  });

  it('numbers repeated separators by occurrence', () => {
    expect(
      keysOf('1,234,567').filter((key) => key.startsWith('separator')),
    ).toStrictEqual(['separator-44-0', 'separator-44-1']);
  });

  it('gives every glyph a unique key', () => {
    const keys = keysOf('1,111,111.11');
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('returns no glyphs for an empty string', () => {
    expect(getNumericGlyphs('')).toStrictEqual([]);
  });
});
