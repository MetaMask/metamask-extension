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
})
