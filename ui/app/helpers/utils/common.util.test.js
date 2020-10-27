import assert from 'assert'
import * as utils from './common.util'

describe('Common utils', function () {
  describe('camelCaseToCapitalize', function () {
    it('should return a capitalized string from a camel-cased string', function () {
      const tests = [
        {
          test: undefined,
          expected: '',
        },
        {
          test: '',
          expected: '',
        },
        {
          test: 'thisIsATest',
          expected: 'This Is A Test',
        },
      ]

      tests.forEach(({ test, expected }) => {
        assert.equal(utils.camelCaseToCapitalize(test), expected)
      })
    })
  })

  describe('removeDash', function () {

    it('should remove dashes in string', function () {
      const string = '-0.123456'

      const expectedString = '0.123456'

      const result = utils.removeDash(string)
      assert.equal(result, expectedString)
    })

    it('should return a string with no dashes', () => {
      const string = '0.123456'

      const result = utils.removeDash(string)

      assert.equal(result, string)
    })

    it('should remove the dash if in the middle of the string', function () {
      const string = '0.32-02'

      const expectedString = '0.3202'

      const result = utils.removeDash(string)
      assert.equal(result, expectedString)
    })

    it('should only remove the first dash', function () {
      const string = '-0.32-02'

      const expectedString = '0.32-02'

      const result = utils.removeDash(string)
      assert.equal(result, expectedString)
    })

  })
})
