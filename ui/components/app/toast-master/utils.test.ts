import { submitRequestToBackground } from '../../../store/background-connection';
import {
  setNewPrivacyPolicyToastClickedOrClosed,
  setNewPrivacyPolicyToastShownDate,
  setShieldEndingToastLastClickedOrClosed,
  setShieldPausedToastLastClickedOrClosed,
} from './utils';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

describe('toast utilities', () => {
  it('updates the privacy policy toast shown date through the messenger', () => {
    setNewPrivacyPolicyToastShownDate(123);

    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setNewPrivacyPolicyToastShownDate',
      [123],
    );
  });

  it('updates the privacy policy toast interaction through the messenger', () => {
    setNewPrivacyPolicyToastClickedOrClosed();

    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setNewPrivacyPolicyToastClickedOrClosed',
      undefined,
    );
  });

  it('updates the Shield paused toast interaction through the messenger', () => {
    setShieldPausedToastLastClickedOrClosed(456);

    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setShieldPausedToastLastClickedOrClosed',
      [456],
    );
  });

  it('updates the Shield ending toast interaction through the messenger', () => {
    setShieldEndingToastLastClickedOrClosed(789);

    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'AppStateController:setShieldEndingToastLastClickedOrClosed',
      [789],
    );
  });
});
