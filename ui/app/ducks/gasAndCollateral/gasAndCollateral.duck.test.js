import assert from 'assert'

const GasAndCollateralDuck = require('./gasAndCollateral.duck.js')

const {
  setCustomGasAndCollateralTotal,
  setCustomGasAndCollateralErrors,
  resetCustomGasAndCollateralState,
} = GasAndCollateralDuck
const GasAndCollateralReducer = GasAndCollateralDuck.default

describe('Gas Duck', function () {
  const mockState = {
    mockProp: 123,
  }
  const initState = {
    customData: {
      total: null,
    },
    errors: {},
  }
  const RESET_CUSTOM_GAS_AND_COLLATERAL_STATE =
    'metamask/gas_and_collateral/RESET_CUSTOM_GAS_AND_COLLATERAL_STATE'
  const SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS =
    'metamask/gas_and_collateral/SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS'
  const SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL =
    'metamask/gas_and_collateral/SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL'

  describe('GasAndCollateralReducer()', function () {
    it('should initialize state', function () {
      assert.deepEqual(GasAndCollateralReducer(undefined, {}), initState)
    })

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepEqual(
        GasAndCollateralReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        mockState
      )
    })

    it('should set customData.total when receiving a SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL action', function () {
      assert.deepEqual(
        GasAndCollateralReducer(mockState, {
          type: SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL,
          value: 10000,
        }),
        { customData: { total: 10000 }, ...mockState }
      )
    })

    it('should set errors when receiving a SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS action', function () {
      assert.deepEqual(
        GasAndCollateralReducer(mockState, {
          type: SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS,
          value: { someError: 'error_error' },
        }),
        { errors: { someError: 'error_error' }, ...mockState }
      )
    })

    it('should return the initial state in response to a RESET_CUSTOM_GAS_AND_COLLATERAL_STATE action', function () {
      assert.deepEqual(
        GasAndCollateralReducer(mockState, {
          type: RESET_CUSTOM_GAS_AND_COLLATERAL_STATE,
        }),
        initState
      )
    })
  })

  describe('setCustomGasAndCollateralTotal', function () {
    it('should create the correct action', function () {
      assert.deepEqual(
        setCustomGasAndCollateralTotal('mockCustomGasAndCollateralTotal'),
        {
          type: SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL,
          value: 'mockCustomGasAndCollateralTotal',
        }
      )
    })
  })

  describe('setCustomGasAndCollateralErrors', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasAndCollateralErrors('mockErrorObject'), {
        type: SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS,
        value: 'mockErrorObject',
      })
    })
  })

  describe('resetCustomGasAndCollateralState', function () {
    it('should create the correct action', function () {
      assert.deepEqual(resetCustomGasAndCollateralState(), {
        type: RESET_CUSTOM_GAS_AND_COLLATERAL_STATE,
      })
    })
  })
})
