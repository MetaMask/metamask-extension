import {
  cloneDeep,
  isEqual,
  isPlainObject,
  mapValues,
  merge,
  omit,
  omitBy,
  pick,
  pickBy,
} from './object.utils';

describe('object utils', function () {
  describe('cloneDeep', function () {
    it('should clone an object', function () {
      const value = { name: 'a' };
      const clonedValue = cloneDeep(value);
      const result = clonedValue !== value && clonedValue.name === value.name;
      expect(result).toStrictEqual(true);
    });

    it('should clone an array of objects', function () {
      const value = [{ name: 'a' }, { name: 'b' }];
      const clonedValue = cloneDeep(value);
      const result =
        clonedValue[0] !== value[0] && clonedValue[0].name === value[0].name;
      expect(result).toStrictEqual(true);
    });

    it('should clone a date', function () {
      const value = new Date();
      const clonedValue = cloneDeep(value);
      const result =
        clonedValue !== value && clonedValue.getTime() === value.getTime();
      expect(result).toStrictEqual(true);
    });

    it('should recursively clone an array of objects with dates', function () {
      const value = [{ timestamp: new Date() }, { timestamp: new Date() }];
      const clonedValue = cloneDeep(value);
      const result =
        clonedValue[0] !== value[0] &&
        clonedValue[0].timestamp !== value[0].timestamp &&
        clonedValue[0].timestamp.getTime() === value[0].timestamp.getTime();
      expect(result).toStrictEqual(true);
    });
  });

  describe('omit', function () {
    it('should create an object without omitted keys', function () {
      const object = { name: 'a', surname: 'b' };
      const withOmittedKeys = omit(object, ['surname']);
      expect(withOmittedKeys.name).toStrictEqual(object.name);
      expect(withOmittedKeys.surname).toBeUndefined();
    });
  });

  describe('pick', function () {
    it('should create an object with picked keys', function () {
      const object = { name: 'a', surname: 'b' };
      const withPickedKeys = pick(object, ['surname']);
      expect(withPickedKeys.surname).toStrictEqual(object.surname);
      expect(withPickedKeys.name).toBeUndefined();
    });
  });

  describe('pickBy', function () {
    it('should create an object with picked keys', function () {
      const object = { name: 'a', surname: 'b' };
      const withPickedKeys = pickBy(object, (value) => value === 'a');
      expect(withPickedKeys.name).toStrictEqual(object.name);
      expect(withPickedKeys.surname).toBeUndefined();
    });

    it('should create an array with picked keys', function () {
      const array = [{ name: 'a' }, { name: 'b' }];
      const withPickedObjs = pickBy(array, (obj) => obj.name === 'a');
      expect(withPickedObjs).toHaveLength(1);
      expect(withPickedObjs[0].name).toStrictEqual('a');
    });

    it('should return whole object if predicate is undefined', function () {
      const object = { name: 'a', surname: 'b' };
      const withPickedKeys = pickBy(object);
      expect(withPickedKeys.name).toStrictEqual(object.name);
      expect(withPickedKeys.surname).toStrictEqual(object.surname);
    });

    it('should return whole array if predicate is undefined', function () {
      const array = [{ name: 'a' }, { name: 'b' }];
      const withPickedObjs = pickBy(array);
      expect(withPickedObjs).toHaveLength(2);
      expect(withPickedObjs[0].name).toStrictEqual('a');
      expect(withPickedObjs[1].name).toStrictEqual('b');
    });
  });

  describe('omitBy', function () {
    it('should create an object without omitted keys', function () {
      const object = { name: 'a', surname: 'b' };
      const withPickedKeys = omitBy(object, (value) => value === 'a');
      expect(withPickedKeys.surname).toStrictEqual(object.surname);
      expect(withPickedKeys.name).toBeUndefined();
    });

    it('should create an array without omitted keys', function () {
      const array = [{ name: 'a' }, { name: 'b' }];
      const withPickedObjs = omitBy(array, (obj) => obj.name === 'a');
      expect(withPickedObjs).toHaveLength(1);
      expect(withPickedObjs[0].name).toStrictEqual('b');
    });

    it('should create an array without omitted deep nested keys', function () {
      const array = [
        { name: { firstChar: 'a', secondChar: 'v' } },
        { name: { firstChar: 'b', secondChar: 'a' } },
      ];
      const withPickedObjs = omitBy(array, (obj) => obj.name.firstChar === 'a');
      expect(withPickedObjs).toHaveLength(1);
      expect(withPickedObjs[0].name.firstChar).toStrictEqual('b');
    });

    it('should return whole object if predicate is undefined', function () {
      const object = { name: 'a', surname: 'b' };
      const withPickedKeys = omitBy(object);
      expect(withPickedKeys.name).toStrictEqual(object.name);
      expect(withPickedKeys.surname).toStrictEqual(object.surname);
    });

    it('should return whole array if predicate is undefined', function () {
      const array = [{ name: 'a' }, { name: 'b' }];
      const withPickedObjs = omitBy(array);
      expect(withPickedObjs).toHaveLength(2);
      expect(withPickedObjs[0].name).toStrictEqual('a');
      expect(withPickedObjs[1].name).toStrictEqual('b');
    });

    it('should omit keys with deep nested keys equal to true', function () {
      const obj = {
        testid1: {
          id: 'testid1',
          persist: true,
        },
        testid2: {
          id: 'testid2',
          persist: false,
        },
      };
      const result = omitBy(obj, 'persist');
      expect(result).toHaveProperty('testid2');
      expect(result.testid1).toBeUndefined();
    });
  });

  describe('isPlainObject', function () {
    it('should distinguish between objects, array and functions', function () {
      const plainObject = { name: 'a' };
      const arr = [{ name: 'a' }, { name: 'b' }];
      const notPlainObject = Object;
      expect(isPlainObject(plainObject)).toStrictEqual(true);
      expect(isPlainObject(arr)).toStrictEqual(false);
      expect(isPlainObject(notPlainObject)).toStrictEqual(false);
    });
  });

  describe('isEqual', function () {
    it('should distinguish between two cloned equal objects', function () {
      const value = [{ name: 'a', surname: 'b' }];
      const other = [{ name: 'a' }];
      expect(isEqual(value.name, other.name)).toStrictEqual(true);
      expect(isEqual(value, other)).toStrictEqual(false);
      expect(isEqual(value[0].surname, other[0].surname)).toStrictEqual(false);
    });

    it('should distinguish between two equal arrays', function () {
      const value = ['0x1', '0x5'];
      const other = ['0x1', '0x5'];
      expect(isEqual(value, other)).toStrictEqual(true);
    });
  });

  describe('mapValues', function () {
    it('should correctly map values of an object', function () {
      const obj = {
        user1: { name: 'Mark', age: 40 },
        user2: { name: 'Frank', age: 29 },
      };
      const result = mapValues(obj, (val) => val.name);
      expect(result.user1).toStrictEqual('Mark');
      expect(result.user2).toStrictEqual('Frank');
    });

    it('should correctly map values of an object with property shorthand', function () {
      const obj = {
        user1: { name: 'Mark', age: 40 },
        user2: { name: 'Frank', age: 29 },
      };
      const result = mapValues(obj, 'name');
      expect(result.user1).toStrictEqual('Mark');
      expect(result.user2).toStrictEqual('Frank');
    });
  });

  describe('merge', function () {
    it('should recursively merge two objects', function () {
      const original = {
        a: [{ b: 2 }, { d: 4 }],
      };
      const other = {
        a: [{ c: 3 }, { e: 5 }],
      };
      const result = merge(original, other);
      expect(result.a[0]).toHaveProperty('c');
      expect(result.a[0].c).toStrictEqual(3);
    });

    it('should return original if source is undefined', function () {
      const original = {
        a: [{ b: 2 }, { d: 4 }],
      };
      let other;
      const result = merge(original, other);
      expect(result).toStrictEqual(original);
    });
  });
});
