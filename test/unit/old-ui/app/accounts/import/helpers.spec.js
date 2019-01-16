const assert = require('assert')
const {
  nestedJsonObjToArray,
} = require('../../../../../../old-ui/app/accounts/import/helpers')

describe('#nestedJsonObjToArray', () => {
  const JsonPattern1 = {
    key1: 'val1',
    key2: 'val2',
  }
  const JsonPattern2 = {
    key1: 'val1',
    key2: {
        key3_1: 'val2',
        key3_2: 'val3',
    },
  }
  const JsonPattern3 = {
    key1: 'val1',
    key2: ['val2', 'val3'],
    key3: {
        key3_1: 'val4',
        key3_2: 'val5',
    },
  }
  const JsonPattern4 = {
    key1: 'val1',
    key2: {
        key3_1: 'val2',
        key3_2: {
            key3_2_1: 'val3',
            key3_2_3: 'val4',
        },
    },
  }
  const JsonPattern5 = {
    key1: 'val1',
    key2: {
        key3_1: 'val2',
        key3_2: {
            key3_2_1: 'val3',
            key3_2_3: ['val4', 'val5', {key3_2_3_1: 'val6'}],
        },
    },
  }

  it('converts nested json objects to arrays correctly', () => {
    assert.deepEqual(['val1', 'val2'], nestedJsonObjToArray(JsonPattern1))
    assert.deepEqual(['val1', 'val2', 'val3'], nestedJsonObjToArray(JsonPattern2))
    assert.deepEqual(['val1', 'val2', 'val3', 'val4', 'val5'], nestedJsonObjToArray(JsonPattern3))
    assert.deepEqual(['val1', 'val2', 'val3', 'val4'], nestedJsonObjToArray(JsonPattern4))
    assert.deepEqual(['val1', 'val2', 'val3', 'val4', 'val5', 'val6'], nestedJsonObjToArray(JsonPattern5))
  })
})
