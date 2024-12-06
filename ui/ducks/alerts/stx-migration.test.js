import { AlertTypes } from '../../../shared/constants/alerts';
import * as actionConstants from '../../store/actionConstants';
import { setAlertEnabledness } from '../../store/actions';
import reducer, {
  dismissAndDisableAlert,
  stxAlertIsOpen,
} from './stx-migration';
import { ALERT_STATE } from './enums';

jest.mock('../../store/actions', () => ({
  setAlertEnabledness: jest.fn().mockResolvedValue(),
}));

describe('STX Migration Alert', () => {
  const mockState = {
    [AlertTypes.stxMigration]: {
      state: ALERT_STATE.OPEN,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with CLOSED state', () => {
    const result = reducer(undefined, {});
    expect(result.state).toStrictEqual(ALERT_STATE.CLOSED);
  });

  it('opens alert when smartTransactionsOptInStatus becomes true and alert is not disabled', () => {
    const result = reducer(
      { state: ALERT_STATE.CLOSED },
      {
        type: actionConstants.UPDATE_METAMASK_STATE,
        value: {
          preferences: {
            smartTransactionsOptInStatus: true,
          },
          alertEnabledness: {
            [AlertTypes.stxMigration]: true,
          },
        },
      },
    );
    expect(result.state).toStrictEqual(ALERT_STATE.OPEN);
  });

  it('keeps alert closed when alert is disabled', () => {
    const result = reducer(
      { state: ALERT_STATE.CLOSED },
      {
        type: actionConstants.UPDATE_METAMASK_STATE,
        value: {
          preferences: {
            smartTransactionsOptInStatus: true,
          },
          alertEnabledness: {
            [AlertTypes.stxMigration]: false,
          },
        },
      },
    );
    expect(result.state).toStrictEqual(ALERT_STATE.CLOSED);
  });

  describe('stxAlertIsOpen selector', () => {
    it('should return true when alert is open', () => {
      expect(stxAlertIsOpen(mockState)).toBe(true);
    });

    it('should return false when alert is closed', () => {
      const closedState = {
        [AlertTypes.stxMigration]: {
          state: ALERT_STATE.CLOSED,
        },
      };
      expect(stxAlertIsOpen(closedState)).toBe(false);
    });
  });

  describe('dismissAndDisableAlert', () => {
    it('should handle disable alert flow', async () => {
      const mockDispatch = jest.fn();
      await dismissAndDisableAlert()(mockDispatch);

      expect(setAlertEnabledness).toHaveBeenCalledWith(
        AlertTypes.stxMigration,
        false,
      );
      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: `${AlertTypes.stxMigration}/disableAlertRequested`,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: `${AlertTypes.stxMigration}/disableAlertSucceeded`,
      });
    });

    it('should handle errors', async () => {
      const mockDispatch = jest.fn();
      const error = new Error('Failed to disable alert');
      setAlertEnabledness.mockRejectedValueOnce(error);
      await dismissAndDisableAlert()(mockDispatch);

      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: `${AlertTypes.stxMigration}/disableAlertRequested`,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: `${AlertTypes.stxMigration}/disableAlertFailed`,
      });
    });
  });
});
