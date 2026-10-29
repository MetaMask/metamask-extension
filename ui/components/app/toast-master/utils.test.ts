import { submitRequestToBackground } from '../../../store/background-connection';
import {
  setNewPrivacyPolicyToastClickedOrClosed,
  setNewPrivacyPolicyToastShownDate,
  setPna25Acknowledged,
  setShieldEndingToastLastClickedOrClosed,
  setShieldPausedToastLastClickedOrClosed,
} from './utils';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('toast utilities', () => {
  it('updates the privacy policy toast shown date through the messenger', () => {
    setNewPrivacyPolicyToastShownDate(123);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setNewPrivacyPolicyToastShownDate',
      [123],
    );
  });

  it('updates the privacy policy toast interaction through the messenger', () => {
    setNewPrivacyPolicyToastClickedOrClosed();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setNewPrivacyPolicyToastClickedOrClosed',
      undefined,
    );
  });

  it('updates the Shield paused toast interaction through the messenger', () => {
    setShieldPausedToastLastClickedOrClosed(123);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setShieldPausedToastLastClickedOrClosed',
      [123],
    );
  });

  it('updates the Shield ending toast interaction through the messenger', () => {
    setShieldEndingToastLastClickedOrClosed(123);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setShieldEndingToastLastClickedOrClosed',
      [123],
    );
  });

  it('updates PNA acknowledgement through the messenger', () => {
    setPna25Acknowledged(true);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setPna25Acknowledged',
      [true],
    );
  });
});
