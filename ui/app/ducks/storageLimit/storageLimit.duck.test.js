import assert from 'assert'

const StorageDuck = require('./storageLimit.duck.js')

const {
  setCustomStorageLimit,
  setCustomStorageTotal,
  setCustomStorageErrors,
  resetCustomStorageState,
} = StorageDuck
const StorageReducer = StorageDuck.default

describe('Gas Duck', function () {
  const mockState = {
    mockProp: 123,
  }
  const initState = {
    customData: {
      limit: null,
      total: null,
    },
    errors: {},
  }
  const RESET_CUSTOM_STORAGE_STATE =
    'metamask/storageLimit/RESET_CUSTOM_STORAGE_STATE'
  const SET_CUSTOM_STORAGE_ERRORS = 'metamask/storageLimit/SET_CUSTOM_STORAGE_ERRORS'
  const SET_CUSTOM_STORAGE_LIMIT = 'metamask/storageLimit/SET_CUSTOM_STORAGE_LIMIT'
  const SET_CUSTOM_STORAGE_TOTAL = 'metamask/storageLimit/SET_CUSTOM_STORAGE_TOTAL'

  describe('StorageReducer()', function () {
    it('should initialize state', function () {
      assert.deepEqual(StorageReducer(undefined, {}), initState)
    })

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepEqual(
        StorageReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        mockState
      )
    })

    it('should set customData.limit when receiving a SET_CUSTOM_STORAGE_LIMIT action', function () {
      assert.deepEqual(
        StorageReducer(mockState, {
          type: SET_CUSTOM_STORAGE_LIMIT,
          value: 9876,
        }),
        { customData: { limit: 9876 }, ...mockState }
      )
    })

    it('should set customData.total when receiving a SET_CUSTOM_STORAGE_TOTAL action', function () {
      assert.deepEqual(
        StorageReducer(mockState, {
          type: SET_CUSTOM_STORAGE_TOTAL,
          value: 10000,
        }),
        { customData: { total: 10000 }, ...mockState }
      )
    })

    it('should set errors when receiving a SET_CUSTOM_STORAGE_ERRORS action', function () {
      assert.deepEqual(
        StorageReducer(mockState, {
          type: SET_CUSTOM_STORAGE_ERRORS,
          value: { someError: 'error_error' },
        }),
        { errors: { someError: 'error_error' }, ...mockState }
      )
    })

    it('should return the initial state in response to a RESET_CUSTOM_STORAGE_STATE action', function () {
      assert.deepEqual(
        StorageReducer(mockState, { type: RESET_CUSTOM_STORAGE_STATE }),
        initState
      )
    })
  })

  describe('setCustomStorageLimit', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomStorageLimit('mockCustomStorageLimit'), {
        type: SET_CUSTOM_STORAGE_LIMIT,
        value: 'mockCustomStorageLimit',
      })
    })
  })

  describe('setCustomStorageTotal', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomStorageTotal('mockCustomStorageTotal'), {
        type: SET_CUSTOM_STORAGE_TOTAL,
        value: 'mockCustomStorageTotal',
      })
    })
  })

  describe('setCustomStorageErrors', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomStorageErrors('mockErrorObject'), {
        type: SET_CUSTOM_STORAGE_ERRORS,
        value: 'mockErrorObject',
      })
    })
  })

  describe('resetCustomStorageState', function () {
    it('should create the correct action', function () {
      assert.deepEqual(resetCustomStorageState(), {
        type: RESET_CUSTOM_STORAGE_STATE,
      })
    })
  })
})
