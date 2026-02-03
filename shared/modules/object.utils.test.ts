import { AllProperties, maskObject } from './object.utils';

describe('object.utils', () => {
  describe('maskObject', () => {
    it('includes values for properties marked true', () => {
      const obj = { a: 1, b: 'hello', c: true };
      const result = maskObject(obj, { a: true });

      expect(result).toEqual({ a: 1, b: 'string', c: 'boolean' });
    });

    it('applies nested masks', () => {
      const obj = { nested: { a: 1, b: 'hello' }, other: 42 };
      const result = maskObject(obj, { nested: { a: true }, other: false });

      expect(result).toEqual({
        nested: { a: 1, b: 'string' },
        other: 'number',
      });
    });

    it('includes arrays when property is marked true', () => {
      const obj = { arr: [1, 'hello', null] };
      const result = maskObject(obj, { arr: true });

      expect(result).toEqual({ arr: [1, 'hello', null] });
    });

    it('returns type markers for excluded null and undefined values', () => {
      const obj = { nullValue: null, undefinedValue: undefined };
      const result = maskObject(obj, { nullValue: false, undefinedValue: false });

      expect(result).toEqual({ nullValue: null, undefinedValue: 'undefined' });
    });

    it('supports the AllProperties mask', () => {
      const obj = { a: 1, b: 'hello' };
      const result = maskObject(obj, { [AllProperties]: false });

      expect(result).toEqual({ a: 'number', b: 'string' });
    });

    it('throws on unsupported mask entry', () => {
      const obj = { a: 1 };

      expect(() => maskObject(obj, { a: 'nope' })).toThrow(
        'Unsupported mask entry: nope',
      );
    });

    it('returns empty object for empty input', () => {
      const result = maskObject({}, {});

      expect(result).toEqual({});
    });
  });
});
