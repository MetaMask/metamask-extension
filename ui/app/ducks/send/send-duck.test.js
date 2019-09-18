import assert from 'assert'

import SendReducer, {
  openToDropdown,
  closeToDropdown,
  updateSendErrors,
  showGasButtonGroup,
  hideGasButtonGroup,
} from './send.duck.js'

describe('Send Duck', () => {
  const mockState = {
    send: {
      mockProp: 123,
    },
  }
  const initState = {
    fromDropdownOpen: false,
    toDropdownOpen: false,
    errors: {},
    gasButtonGroupShown: true,
  }
  const OPEN_FROM_DROPDOWN = 'metamask/send/OPEN_FROM_DROPDOWN'
  const CLOSE_FROM_DROPDOWN = 'metamask/send/CLOSE_FROM_DROPDOWN'
  const OPEN_TO_DROPDOWN = 'metamask/send/OPEN_TO_DROPDOWN'
  const CLOSE_TO_DROPDOWN = 'metamask/send/CLOSE_TO_DROPDOWN'
  const UPDATE_SEND_ERRORS = 'metamask/send/UPDATE_SEND_ERRORS'
  const RESET_SEND_STATE = 'metamask/send/RESET_SEND_STATE'
  const SHOW_GAS_BUTTON_GROUP = 'metamask/send/SHOW_GAS_BUTTON_GROUP'
  const HIDE_GAS_BUTTON_GROUP = 'metamask/send/HIDE_GAS_BUTTON_GROUP'

  describe('SendReducer()', () => {
    it('should initialize state', () => {
      assert.deepEqual(
        SendReducer({}),
        initState
      )
    })

    it('should return state unchanged if it does not match a dispatched actions type', () => {
      assert.deepEqual(
        SendReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        Object.assign({}, mockState.send)
      )
    })

    it('should set fromDropdownOpen to true when receiving a OPEN_FROM_DROPDOWN action', () => {
      assert.deepEqual(
        SendReducer(mockState, {
          type: OPEN_FROM_DROPDOWN,
        }),
        Object.assign({fromDropdownOpen: true}, mockState.send)
      )
    })

    it('should return a new object (and not just modify the existing state object)', () => {
      assert.deepEqual(SendReducer(mockState), mockState.send)
      assert.notEqual(SendReducer(mockState), mockState.send)
    })

    it('should set fromDropdownOpen to false when receiving a CLOSE_FROM_DROPDOWN action', () => {
      assert.deepEqual(
        SendReducer(mockState, {
          type: CLOSE_FROM_DROPDOWN,
        }),
        Object.assign({fromDropdownOpen: false}, mockState.send)
      )
    })

    it('should set toDropdownOpen to true when receiving a OPEN_TO_DROPDOWN action', () => {
      assert.deepEqual(
        SendReducer(mockState, {
          type: OPEN_TO_DROPDOWN,
        }),
        Object.assign({toDropdownOpen: true}, mockState.send)
      )
    })

    it('should set toDropdownOpen to false when receiving a CLOSE_TO_DROPDOWN action', () => {
      assert.deepEqual(
        SendReducer(mockState, {
          type: CLOSE_TO_DROPDOWN,
        }),
        Object.assign({toDropdownOpen: false}, mockState.send)
      )
    })

    it('should set gasButtonGroupShown to true when receiving a SHOW_GAS_BUTTON_GROUP action', () => {
      assert.deepEqual(
        SendReducer(Object.assign({}, mockState, { gasButtonGroupShown: false }), {
          type: SHOW_GAS_BUTTON_GROUP,
        }),
        Object.assign({gasButtonGroupShown: true}, mockState.send)
      )
    })

    it('should set gasButtonGroupShown to false when receiving a HIDE_GAS_BUTTON_GROUP action', () => {
      assert.deepEqual(
        SendReducer(mockState, {
          type: HIDE_GAS_BUTTON_GROUP,
        }),
        Object.assign({gasButtonGroupShown: false}, mockState.send)
      )
    })

    it('should extend send.errors with the value of a UPDATE_SEND_ERRORS action', () => {
      const modifiedMockState = Object.assign({}, mockState, {
        send: {
          errors: {
            someError: false,
          },
        },
      })
      assert.deepEqual(
        SendReducer(modifiedMockState, {
          type: UPDATE_SEND_ERRORS,
          value: { someOtherError: true },
        }),
        Object.assign({}, modifiedMockState.send, {
          errors: {
            someError: false,
            someOtherError: true,
          },
        })
      )
    })

    it('should return the initial state in response to a RESET_SEND_STATE action', () => {
      assert.deepEqual(
        SendReducer(mockState, {
          type: RESET_SEND_STATE,
        }),
        Object.assign({}, initState)
      )
    })
  })

  describe('openToDropdown', () => {
    assert.deepEqual(
      openToDropdown(),
      { type: OPEN_TO_DROPDOWN }
    )
  })

  describe('closeToDropdown', () => {
    assert.deepEqual(
      closeToDropdown(),
      { type: CLOSE_TO_DROPDOWN }
    )
  })

  describe('showGasButtonGroup', () => {
    assert.deepEqual(
      showGasButtonGroup(),
      { type: SHOW_GAS_BUTTON_GROUP }
    )
  })

  describe('hideGasButtonGroup', () => {
    assert.deepEqual(
      hideGasButtonGroup(),
      { type: HIDE_GAS_BUTTON_GROUP }
    )
  })

  describe('updateSendErrors', () => {
    assert.deepEqual(
      updateSendErrors('mockErrorObject'),
      { type: UPDATE_SEND_ERRORS, value: 'mockErrorObject' }
    )
  })

})
