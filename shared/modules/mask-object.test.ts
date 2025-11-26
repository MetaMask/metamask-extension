import { AllProperties, maskObject } from './mask-object';

describe('maskObject', () => {
  describe('when the object is one-dimensional', () => {
    it('returns the given object untouched if it is empty', () => {
      const object = {};
      const mask = {};

      const result = maskObject(object, mask);

      expect(result).toStrictEqual({});
    });

    it('returns the given object untouched if all of the properties are marked as true in the mask', () => {
      const object = { foo: 'bar', baz: 42 };
      const mask = { foo: true, baz: true };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(object);
    });

    it('replaces explicitly masked properties with the names of their types', () => {
      const object = { a: 'bar', b: 42, c: true, d: null };
      const mask = { a: false, b: true, c: false, d: false };
      const maskedObject = {
        a: 'string',
        b: 42,
        c: 'boolean',
        d: 'null',
      };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('treats properties omitted in the mask as though they were marked as false', () => {
      const object = { a: 'bar', b: 42, c: true, d: null };
      const mask = { a: true, c: true };
      const maskedObject = {
        a: 'bar',
        b: 'number',
        c: true,
        d: 'null',
      };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('allows all of the properties of the object to be masked in the same way', () => {
      const object = { a: 'bar', b: 42, c: true, d: null };
      const mask = { [AllProperties]: false };
      const maskedObject = {
        a: 'string',
        b: 'number',
        c: 'boolean',
        d: 'null',
      };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('throws if there are any other properties provided alongside AllProperties', () => {
      const object = { foo: 'bar' };
      const mask = { [AllProperties]: false, someOtherProperty: true };

      expect(() => maskObject(object, mask)).toThrow(
        'A mask with AllProperties cannot contain any other properties',
      );
    });
  });

  describe('when the object contains an object', () => {
    it('returns the given object untouched if all nested properties are marked as true in the mask', () => {
      const object = { nested: { foo: 'bar', baz: 42 } };
      const mask = { nested: { foo: true, baz: true } };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(object);
    });

    it('replaces explicitly masked nested properties with the names of their types', () => {
      const object = { nested: { a: 'bar', b: 42, c: true, d: null } };
      const mask = { nested: { a: false, b: true, c: false, d: false } };
      const maskedObject = {
        nested: {
          a: 'string',
          b: 42,
          c: 'boolean',
          d: 'null',
        },
      };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('treats nested properties omitted in the mask as though they were marked as false', () => {
      const object = { nested: { a: 'bar', b: 42, c: true, d: null } };
      const mask = { nested: { a: true, c: true } };
      const maskedObject = {
        nested: {
          a: 'bar',
          b: 'number',
          c: true,
          d: 'null',
        },
      };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('replaces entire objects if they are explicitly marked as false in the mask', () => {
      const object = { nested: { a: 'bar', b: 42, c: true, d: null } };
      const mask = { nested: false };
      const maskedObject = { nested: 'object' };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('replaces entire objects if they are omitted from the mask', () => {
      const object = { nested: { a: 'bar', b: 42, c: true, d: null } };
      const mask = {};
      const maskedObject = { nested: 'object' };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('allows all nested properties to be masked in the same way', () => {
      const object = { nested: { a: 'bar', b: 42, c: true, d: null } };
      const mask = { nested: { [AllProperties]: false } };
      const maskedObject = {
        nested: {
          a: 'string',
          b: 'number',
          c: 'boolean',
          d: 'null',
        },
      };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('throws if there are any other properties provided alongside AllProperties', () => {
      const object = { nested: { foo: 'bar' } };
      const mask = {
        nested: { [AllProperties]: false, someOtherProperty: true },
      };

      expect(() => maskObject(object, mask)).toThrow(
        'A mask with AllProperties cannot contain any other properties',
      );
    });
  });

  describe('when the object contains an array', () => {
    it('returns the given object untouched if all nested values are marked as true in the mask', () => {
      const object = { nested: [1, 2, 3] };
      const mask = { nested: { [AllProperties]: true } };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(object);
    });

    it('replaces explicitly masked nested values with the names of their types', () => {
      const object = { nested: [1, 2, 3] };
      const mask = { nested: { [AllProperties]: false } };
      const maskedObject = { nested: ['number', 'number', 'number'] };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('throws if an empty mask is provided for a nested array', () => {
      const object = { nested: [1, 2, 3] };
      const mask = { nested: {} };

      expect(() => maskObject(object, mask)).toThrow(
        'The mask for an array must be a boolean, a plain object with a single AllProperties property, or undefined',
      );
    });

    it('replaces entire arrays if they are explicitly marked as false in the mask', () => {
      const object = { nested: [1, 2, 3] };
      const mask = { nested: false };
      const maskedObject = { nested: 'array' };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('replaces entire arrays if they are omitted from the mask', () => {
      const object = { nested: [1, 2, 3] };
      const mask = {};
      const maskedObject = { nested: 'array' };

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('throws if there are any other properties provided alongside AllProperties', () => {
      const object = { nested: [1, 2, 3] };
      const mask = {
        nested: { [AllProperties]: false, someOtherProperty: true },
      };

      expect(() => maskObject(object, mask)).toThrow(
        'A mask with AllProperties cannot contain any other properties',
      );
    });

    it('throws if a mask is given that does not contain AllProperties at all', () => {
      const object = { nested: [1, 2, 3] };
      const mask = {
        nested: { someOtherProperty: true },
      };

      expect(() => maskObject(object, mask)).toThrow(
        'The mask for an array must be a boolean, a plain object with a single AllProperties property, or undefined',
      );
    });
  });

  describe('when the dimensionality is irrelevant', () => {
    it('throws if the input is not a plain object', () => {
      const object = 'clearly-not-a-plain-object';
      const mask = { doesnt: 'matter' };

      // @ts-expect-error We are intentionally passing invalid input.
      expect(() => maskObject(object, mask)).toThrow(
        'Cannot mask a non-JSON-serializable object',
      );
    });

    it('throws if the input is a plain object, but is not JSON-serializable', () => {
      const object = {
        foo: () => 'bar',
        bar: new Date(),
      };
      const mask = { doesnt: 'matter' };

      // @ts-expect-error We are intentionally passing invalid input.
      expect(() => maskObject(object, mask)).toThrow(
        'Cannot mask a non-JSON-serializable value',
      );
    });

    it('throws if the input is a class instance', () => {
      class TestClass {
        // do nothing
      }
      const object = new TestClass();
      const mask = { doesnt: 'matter' };

      // @ts-expect-error We are intentionally passing invalid input.
      expect(() => maskObject(object, mask)).toThrow(
        'Cannot mask a non-JSON-serializable object',
      );
    });

    it('throws if the mask for a value is not an object at all', () => {
      const object = { foo: 'bar' };
      const mask = 'clearly-not-a-plain-object';

      // @ts-expect-error - Testing invalid mask type
      expect(() => maskObject(object, mask)).toThrow(
        'The mask for a plain object must be a plain object',
      );
    });

    // @ts-expect-error This file is incorrectly typed using Mocha types.
    it.each([
      {
        valueDescription: 'null',
        value: null,
      },
      {
        valueDescription: 'a number',
        value: 42,
      },
      {
        valueDescription: 'a string',
        value: 'some string',
      },
    ])(
      'throws if the value of a property is $valueDescription and the mask is the same value',
      ({ value }: { value: null | number | string }) => {
        const object = { foo: value };
        const mask = { foo: value };

        // @ts-expect-error We are intentionally passing invalid input.
        expect(() => maskObject(object, mask)).toThrow(
          'The mask for a primitive must be a boolean or undefined',
        );
      },
    );

    it('throws if the value of a property is an array and the mask is the same value', () => {
      const object = { a: [] };
      const mask = { a: [] };

      // @ts-expect-error We are intentionally passing invalid input.
      expect(() => maskObject(object, mask)).toThrow(
        'The mask for an array must be a boolean, a plain object with a single AllProperties property, or undefined',
      );
    });

    it('does not throw if the value of a property is an object and the mask is the same value', () => {
      const object = { a: {} };
      const mask = { a: {} };

      expect(() => maskObject(object, mask)).not.toThrow();
    });

    it('throws if the value of a property is a plain object and the mask is not a plain object', () => {
      const object = { a: {} };
      const mask = { a: 1 };

      // @ts-expect-error We are intentionally passing invalid input.
      expect(() => maskObject(object, mask)).toThrow(
        'The mask for a plain object must be a boolean, a plain object, or undefined',
      );
    });

    it('does not throw if attempting to mask a property that is not present', () => {
      const object = {};
      const mask = {
        foo: false,
      };
      const maskedObject = {};

      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });

    it('does not throw if attempting to mask an undefined property (same as absent)', () => {
      const object = {
        foo: undefined,
      };
      const mask = {
        foo: false,
      };
      const maskedObject = {
        foo: undefined,
      };

      // @ts-expect-error The type error *should* prevent this from happening,
      // but this assumes that the type of the object is correct, which it is
      // not in Mobile
      const result = maskObject(object, mask);

      expect(result).toStrictEqual(maskedObject);
    });
  });
});
