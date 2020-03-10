import { getMessage } from './i18n-helper'
import React from 'react'
import { shallow } from 'enzyme'
import assert from 'assert'

describe('i18n helper', function () {
  const TEST_LOCALE_CODE = 'TEST_LOCALE_CODE'

  const TEST_KEY_1 = 'TEST_KEY_1'
  const TEST_KEY_2 = 'TEST_KEY_2'
  const TEST_KEY_3 = 'TEST_KEY_3'
  const TEST_KEY_4 = 'TEST_KEY_4'
  const TEST_KEY_5 = 'TEST_KEY_5'
  const TEST_KEY_6 = 'TEST_KEY_6'
  const TEST_KEY_6_HELPER = 'TEST_KEY_6_HELPER'
  const TEST_KEY_7 = 'TEST_KEY_7'
  const TEST_KEY_7_HELPER_1 = 'TEST_KEY_7_HELPER_1'
  const TEST_KEY_7_HELPER_2 = 'TEST_KEY_7_HELPER_2'
  const TEST_KEY_8 = 'TEST_KEY_8'
  const TEST_KEY_8_HELPER_1 = 'TEST_KEY_8_HELPER_1'
  const TEST_KEY_8_HELPER_2 = 'TEST_KEY_8_HELPER_2'

  const TEST_SUBSTITUTION_1 = 'TEST_SUBSTITUTION_1'
  const TEST_SUBSTITUTION_2 = 'TEST_SUBSTITUTION_2'
  const TEST_SUBSTITUTION_3 = 'TEST_SUBSTITUTION_3'
  const TEST_SUBSTITUTION_4 = 'TEST_SUBSTITUTION_4'
  const TEST_SUBSTITUTION_5 = 'TEST_SUBSTITUTION_5'

  const testLocaleMessages = {
    [TEST_KEY_1]: {
      message: 'This is a simple message.',
      expectedResult: 'This is a simple message.',
    },
    [TEST_KEY_2]: {
      message: 'This is a message with a single non-react substitution $1.',
    },
    [TEST_KEY_3]: {
      message: 'This is a message with a two non-react substitution $1 and $2.',
    },
    [TEST_KEY_4]: {
      message: '$1 - $2 - $3 - $4 - $5',
    },
    [TEST_KEY_5]: {
      message: '$1 - $2 - $3',
    },
    [TEST_KEY_6]: {
      'message': 'Testing a react substitution $1.',
    },
    [TEST_KEY_6_HELPER]: {
      'message': TEST_SUBSTITUTION_1,
    },
    [TEST_KEY_7]: {
      'message': 'Testing a react substitution $1 and another $2.',
    },
    [TEST_KEY_7_HELPER_1]: {
      'message': TEST_SUBSTITUTION_1,
    },
    [TEST_KEY_7_HELPER_2]: {
      'message': TEST_SUBSTITUTION_2,
    },
    [TEST_KEY_8]: {
      'message': 'Testing a mix $1 of react substitutions $2 and string substitutions $3 + $4.',
    },
    [TEST_KEY_8_HELPER_1]: {
      'message': TEST_SUBSTITUTION_3,
    },
    [TEST_KEY_8_HELPER_2]: {
      'message': TEST_SUBSTITUTION_4,
    },
  }
  const t = getMessage.bind(null, TEST_LOCALE_CODE, testLocaleMessages)

  const TEST_SUBSTITUTION_6 = (<div style={{ color: 'red' }} key="test-react-substitutions-1"> { t(TEST_KEY_6_HELPER) } </div>)
  const TEST_SUBSTITUTION_7_1 = (<div style={{ color: 'red' }} key="test-react-substitutions-1"> { t(TEST_KEY_7_HELPER_1) } </div>)
  const TEST_SUBSTITUTION_7_2 = (<div style={{ color: 'blue' }} key="test-react-substitutions-1"> { t(TEST_KEY_7_HELPER_2) } </div>)
  const TEST_SUBSTITUTION_8_1 = (<div style={{ color: 'orange' }} key="test-react-substitutions-1"> { t(TEST_KEY_8_HELPER_1) } </div>)
  const TEST_SUBSTITUTION_8_2 = (<div style={{ color: 'pink' }} key="test-react-substitutions-1"> { t(TEST_KEY_8_HELPER_2) } </div>)


  const testConfigs = {
    [TEST_KEY_1]: {
      expectedResult: 'This is a simple message.',
    },
    [TEST_KEY_2]: {
      substitutions: [ TEST_SUBSTITUTION_1 ],
      expectedResult: `This is a message with a single non-react substitution ${TEST_SUBSTITUTION_1}.`,
    },
    [TEST_KEY_3]: {
      substitutions: [ TEST_SUBSTITUTION_1, TEST_SUBSTITUTION_2 ],
      expectedResult: `This is a message with a two non-react substitution ${TEST_SUBSTITUTION_1} and ${TEST_SUBSTITUTION_2}.`,
    },
    [TEST_KEY_4]: {
      substitutions: [ TEST_SUBSTITUTION_1, TEST_SUBSTITUTION_2, TEST_SUBSTITUTION_3, TEST_SUBSTITUTION_4, TEST_SUBSTITUTION_5 ],
      expectedResult: `${TEST_SUBSTITUTION_1} - ${TEST_SUBSTITUTION_2} - ${TEST_SUBSTITUTION_3} - ${TEST_SUBSTITUTION_4} - ${TEST_SUBSTITUTION_5}`,
    },
    [TEST_KEY_5]: {
      substitutions: [ TEST_SUBSTITUTION_1, TEST_SUBSTITUTION_2 ],
      expectedErrorMessage: `Insufficient number of substitutions for message: '$1 - $2 - $3'`,
    },
    [TEST_KEY_6]: {
      substitutions: [ TEST_SUBSTITUTION_6 ],
      expectedHtml: '<span> Testing a react substitution <div style="color:red"> TEST_SUBSTITUTION_1 </div>. </span>',
    },
    [TEST_KEY_7]: {
      substitutions: [ TEST_SUBSTITUTION_7_1, TEST_SUBSTITUTION_7_2 ],
      expectedHtml: '<span> Testing a react substitution <div style="color:red"> TEST_SUBSTITUTION_1 </div> and another <div style="color:blue"> TEST_SUBSTITUTION_2 </div>. </span>',
    },
    [TEST_KEY_8]: {
      substitutions: [ TEST_SUBSTITUTION_1, TEST_SUBSTITUTION_8_1, TEST_SUBSTITUTION_2, TEST_SUBSTITUTION_8_2 ],
      expectedHtml: '<span> Testing a mix TEST_SUBSTITUTION_1 of react substitutions <div style="color:orange"> TEST_SUBSTITUTION_3 </div> and string substitutions TEST_SUBSTITUTION_2 + <div style="color:pink"> TEST_SUBSTITUTION_4 </div>. </span>',
    },
  }


  describe('getMessage', function () {
    it('should return the exact message paired with key if there are no substitutions', function () {
      const result = t(TEST_KEY_1)
      assert.equal(result, testConfigs[TEST_KEY_1].expectedResult)
    })

    it('should return the correct message when a single non-react substitution is made', function () {
      const result = t(TEST_KEY_2, testConfigs[TEST_KEY_2].substitutions)
      assert.equal(result, testConfigs[TEST_KEY_2].expectedResult)
    })

    it('should return the correct message when two non-react substitution is made', function () {
      const result = t(TEST_KEY_3, testConfigs[TEST_KEY_3].substitutions)
      assert.equal(result, testConfigs[TEST_KEY_3].expectedResult)
    })

    it('should return the correct message when multiple non-react substitutions are made', function () {
      const result = t(TEST_KEY_4, testConfigs[TEST_KEY_4].substitutions)
      assert.equal(result, testConfigs[TEST_KEY_4].expectedResult)
    })

    it('should throw an error when not passed as many substitutions as a message requires', function () {
      assert.throws(
        () => {
          t(TEST_KEY_5, testConfigs[TEST_KEY_5].substitutions)
        },
        Error,
        testConfigs[TEST_KEY_5].expectedErrorMessage
      )
    })

    it('should return the correct message when a single react substitution is made', function () {
      const result = t(TEST_KEY_6, testConfigs[TEST_KEY_6].substitutions)
      assert.equal(shallow(result).html(), testConfigs[TEST_KEY_6].expectedHtml)
    })

    it('should return the correct message when two react substitutions are made', function () {
      const result = t(TEST_KEY_7, testConfigs[TEST_KEY_7].substitutions)
      assert.equal(shallow(result).html(), testConfigs[TEST_KEY_7].expectedHtml)
    })

    it('should return the correct message when substituting a mix of react elements and strings', function () {
      const result = t(TEST_KEY_8, testConfigs[TEST_KEY_8].substitutions)
      assert.equal(shallow(result).html(), testConfigs[TEST_KEY_8].expectedHtml)
    })
  })
})
