import { AllProperties, maskObject } from './object.utils';

describe('object.utils', () => {
  describe('maskObject', () => {
    it('includes values for properties marked true', () => {
      const obj = { a: 1, b: 'hello', c: true };
      const result = maskObject(obj, { a: true });

      expect(result).toStrictEqual({ a: 1, b: 'string', c: 'boolean' });
    });

    it('applies nested masks', () => {
      const obj = { nested: { a: 1, b: 'hello' }, other: 42 };
      const result = maskObject(obj, { nested: { a: true }, other: false });

      expect(result).toStrictEqual({
        nested: { a: 1, b: 'string' },
        other: 'number',
      });
    });

    it('includes arrays when property is marked true', () => {
      const obj = { arr: [1, 'hello', null] };
      const result = maskObject(obj, { arr: true });

      expect(result).toStrictEqual({ arr: [1, 'hello', null] });
    });

    it('returns type markers for excluded null and undefined values', () => {
      const obj = { nullValue: null, undefinedValue: undefined };
      const result = maskObject(obj, {
        nullValue: false,
        undefinedValue: false,
      });

      expect(result).toStrictEqual({
        nullValue: null,
        undefinedValue: 'undefined',
      });
    });

    it('supports the AllProperties mask', () => {
      const obj = { a: 1, b: 'hello' };
      const result = maskObject(obj, { [AllProperties]: true });

      expect(result).toStrictEqual({ a: 1, b: 'hello' });
    });

    it('supports the AllProperties mask set to false', () => {
      const obj = { a: 1, b: 'hello', c: { nested: true } };
      const result = maskObject(obj, { [AllProperties]: false });

      expect(result).toStrictEqual({
        a: 'number',
        b: 'string',
        c: 'object',
      });
    });

    it('throws for AllProperties masks with sibling keys', () => {
      const obj = { a: 1 };

      expect(() =>
        maskObject(obj, { [AllProperties]: false, a: false }),
      ).toThrow('AllProperties mask key does not support sibling keys');
    });

    it('throws on unsupported mask entry', () => {
      const obj = { a: 1 };

      // @ts-expect-error Testing invalid input
      expect(() => maskObject(obj, { a: 'nope' })).toThrow(
        'Unsupported mask entry: nope',
      );
    });

    it('returns empty object for empty input', () => {
      const result = maskObject({}, {});

      expect(result).toStrictEqual({});
    });

    it('masks all properties to type markers when given an empty mask', () => {
      const obj = { a: 1, b: 'hello', c: { nested: true } };
      const result = maskObject(obj, {});

      expect(result).toStrictEqual({
        a: 'number',
        b: 'string',
        c: 'object',
      });
    });
  });
});
