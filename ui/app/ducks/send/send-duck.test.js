import assert from 'assert'

import SendReducer, {
  openToDropdown,
  closeToDropdown,
  updateSendErrors,
  showGasButtonGroup,
  hideGasButtonGroup,
} from './send.duck'

describe('Send Duck', function () {
  const mockState = {
    mockProp: 123,
  }
  const initState = {
    toDropdownOpen: false,
    errors: {},
    gasButtonGroupShown: true,
  }
  const OPEN_TO_DROPDOWN = 'metamask/send/OPEN_TO_DROPDOWN'
  const CLOSE_TO_DROPDOWN = 'metamask/send/CLOSE_TO_DROPDOWN'
  const UPDATE_SEND_ERRORS = 'metamask/send/UPDATE_SEND_ERRORS'
  const RESET_SEND_STATE = 'metamask/send/RESET_SEND_STATE'
  const SHOW_GAS_BUTTON_GROUP = 'metamask/send/SHOW_GAS_BUTTON_GROUP'
  const HIDE_GAS_BUTTON_GROUP = 'metamask/send/HIDE_GAS_BUTTON_GROUP'

  describe('SendReducer()', function () {
    it('should initialize state', function () {
      assert.deepEqual(SendReducer(undefined, {}), initState)
    })

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepEqual(
        SendReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        mockState,
      )
    })

    it('should set toDropdownOpen to true when receiving a OPEN_TO_DROPDOWN action', function () {
      assert.deepEqual(
        SendReducer(mockState, {
          type: OPEN_TO_DROPDOWN,
        }),
        { toDropdownOpen: true, ...mockState },
      )
    })

    it('should set toDropdownOpen to false when receiving a CLOSE_TO_DROPDOWN action', function () {
      assert.deepEqual(
        SendReducer(mockState, {
          type: CLOSE_TO_DROPDOWN,
        }),
        { toDropdownOpen: false, ...mockState },
      )
    })

    it('should set gasButtonGroupShown to true when receiving a SHOW_GAS_BUTTON_GROUP action', function () {
      assert.deepEqual(
        SendReducer(
          { ...mockState, gasButtonGroupShown: false },
          { type: SHOW_GAS_BUTTON_GROUP },
        ),
        { gasButtonGroupShown: true, ...mockState },
      )
    })

    it('should set gasButtonGroupShown to false when receiving a HIDE_GAS_BUTTON_GROUP action', function () {
      assert.deepEqual(
        SendReducer(mockState, { type: HIDE_GAS_BUTTON_GROUP }),
        { gasButtonGroupShown: false, ...mockState },
      )
    })

    it('should extend send.errors with the value of a UPDATE_SEND_ERRORS action', function () {
      const modifiedMockState = {
        ...mockState,
        errors: {
          someError: false,
        },
      }
      assert.deepEqual(
        SendReducer(modifiedMockState, {
          type: UPDATE_SEND_ERRORS,
          value: { someOtherError: true },
        }),
        {
          ...modifiedMockState,
          errors: {
            someError: false,
            someOtherError: true,
          },
        },
      )
    })

    it('should return the initial state in response to a RESET_SEND_STATE action', function () {
      assert.deepEqual(
        SendReducer(mockState, {
          type: RESET_SEND_STATE,
        }),
        initState,
      )
    })
  })

  describe('openToDropdown', function () {
    assert.deepEqual(openToDropdown(), { type: OPEN_TO_DROPDOWN })
  })

  describe('closeToDropdown', function () {
    assert.deepEqual(closeToDropdown(), { type: CLOSE_TO_DROPDOWN })
  })

  describe('showGasButtonGroup', function () {
    assert.deepEqual(showGasButtonGroup(), { type: SHOW_GAS_BUTTON_GROUP })
  })

  describe('hideGasButtonGroup', function () {
    assert.deepEqual(hideGasButtonGroup(), { type: HIDE_GAS_BUTTON_GROUP })
  })

  describe('updateSendErrors', function () {
    assert.deepEqual(updateSendErrors('mockErrorObject'), {
      type: UPDATE_SEND_ERRORS,
      value: 'mockErrorObject',
    })
  })
})
