import { cloneDeep } from './object.utils';

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
});
