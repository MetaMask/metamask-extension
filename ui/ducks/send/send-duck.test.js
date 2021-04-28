import SendReducer, {
  openToDropdown,
  closeToDropdown,
  updateSendErrors,
  showGasButtonGroup,
  hideGasButtonGroup,
} from './send.duck';

describe('Send Duck', () => {
  const mockState = {
    mockProp: 123,
  };
  const initState = {
    toDropdownOpen: false,
    errors: {},
    gasButtonGroupShown: true,
  };
  const OPEN_TO_DROPDOWN = 'metamask/send/OPEN_TO_DROPDOWN';
  const CLOSE_TO_DROPDOWN = 'metamask/send/CLOSE_TO_DROPDOWN';
  const UPDATE_SEND_ERRORS = 'metamask/send/UPDATE_SEND_ERRORS';
  const RESET_SEND_STATE = 'metamask/send/RESET_SEND_STATE';
  const SHOW_GAS_BUTTON_GROUP = 'metamask/send/SHOW_GAS_BUTTON_GROUP';
  const HIDE_GAS_BUTTON_GROUP = 'metamask/send/HIDE_GAS_BUTTON_GROUP';

  describe('SendReducer()', () => {
    it('should initialize state', () => {
      expect(SendReducer(undefined, {})).toStrictEqual(initState);
    });

    it('should return state unchanged if it does not match a dispatched actions type', () => {
      expect(
        SendReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
      ).toStrictEqual(mockState);
    });

    it('should set toDropdownOpen to true when receiving a OPEN_TO_DROPDOWN action', () => {
      expect(
        SendReducer(mockState, {
          type: OPEN_TO_DROPDOWN,
        }),
      ).toStrictEqual({ toDropdownOpen: true, ...mockState });
    });

    it('should set toDropdownOpen to false when receiving a CLOSE_TO_DROPDOWN action', () => {
      expect(
        SendReducer(mockState, {
          type: CLOSE_TO_DROPDOWN,
        }),
      ).toStrictEqual({ toDropdownOpen: false, ...mockState });
    });

    it('should set gasButtonGroupShown to true when receiving a SHOW_GAS_BUTTON_GROUP action', () => {
      expect(
        SendReducer(
          { ...mockState, gasButtonGroupShown: false },
          { type: SHOW_GAS_BUTTON_GROUP },
        ),
      ).toStrictEqual({ gasButtonGroupShown: true, ...mockState });
    });

    it('should set gasButtonGroupShown to false when receiving a HIDE_GAS_BUTTON_GROUP action', () => {
      expect(
        SendReducer(mockState, { type: HIDE_GAS_BUTTON_GROUP }),
      ).toStrictEqual({ gasButtonGroupShown: false, ...mockState });
    });

    it('should extend send.errors with the value of a UPDATE_SEND_ERRORS action', () => {
      const modifiedMockState = {
        ...mockState,
        errors: {
          someError: false,
        },
      };
      expect(
        SendReducer(modifiedMockState, {
          type: UPDATE_SEND_ERRORS,
          value: { someOtherError: true },
        }),
      ).toStrictEqual({
        ...modifiedMockState,
        errors: {
          someError: false,
          someOtherError: true,
        },
      });
    });

    it('should return the initial state in response to a RESET_SEND_STATE action', () => {
      expect(
        SendReducer(mockState, {
          type: RESET_SEND_STATE,
        }),
      ).toStrictEqual(initState);
    });
  });

  describe('Send Duck Actions', () => {
    it('calls openToDropdown action', () => {
      expect(openToDropdown()).toStrictEqual({ type: OPEN_TO_DROPDOWN });
    });

    it('calls closeToDropdown action', () => {
      expect(closeToDropdown()).toStrictEqual({ type: CLOSE_TO_DROPDOWN });
    });

    it('calls showGasButtonGroup action', () => {
      expect(showGasButtonGroup()).toStrictEqual({
        type: SHOW_GAS_BUTTON_GROUP,
      });
    });

    it('calls hideGasButtonGroup action', () => {
      expect(hideGasButtonGroup()).toStrictEqual({
        type: HIDE_GAS_BUTTON_GROUP,
      });
    });

    it('calls updateSendErrors action', () => {
      expect(updateSendErrors('mockErrorObject')).toStrictEqual({
        type: UPDATE_SEND_ERRORS,
        value: 'mockErrorObject',
      });
    });
  });
});
