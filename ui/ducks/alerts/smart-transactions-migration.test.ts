import { AlertTypes } from '../../../shared/constants/alerts';
import * as actionConstants from '../../store/actionConstants';
import { setAlertEnabledness } from '../../store/actions';
import reducer, {
  dismissAndDisableAlert,
  shouldShowSmartTransactionsMigrationAlert,
} from './smart-transactions-migration';
import { ALERT_STATE } from './enums';
import { SpyInstance } from 'jest-mock';

jest.mock('../../store/actions', () => ({
  setAlertEnabledness: jest
    .fn<Promise<void>, [string, boolean]>()
    .mockResolvedValue(undefined),
}));

describe('Smart Transactions Migration Alert', () => {
  let consoleErrorSpy: jest.SpyInstance<
    void,
    [message?: any, ...optionalParams: any[]]
  >;

  const mockState = {
    [AlertTypes.smartTransactionsMigration]: {
      state: ALERT_STATE.OPEN,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should initialize with CLOSED state', () => {
    const result = reducer(undefined, { type: 'INIT' });
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
            [AlertTypes.smartTransactionsMigration]: true,
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
            [AlertTypes.smartTransactionsMigration]: false,
          },
        },
      },
    );
    expect(result.state).toStrictEqual(ALERT_STATE.CLOSED);
  });

  describe('shouldShowSmartTransactionsMigrationAlert selector', () => {
    it('should return true when alert is open', () => {
      expect(shouldShowSmartTransactionsMigrationAlert(mockState)).toBe(true);
    });

    it('should return false when alert is closed', () => {
      const closedState = {
        [AlertTypes.smartTransactionsMigration]: {
          state: ALERT_STATE.CLOSED,
        },
      };
      expect(shouldShowSmartTransactionsMigrationAlert(closedState)).toBe(
        false,
      );
    });
  });

  describe('dismissAndDisableAlert', () => {
    it('should handle disable alert flow', async () => {
      const mockDispatch = jest.fn();
      await dismissAndDisableAlert()(mockDispatch);

      expect(setAlertEnabledness).toHaveBeenCalledWith(
        AlertTypes.smartTransactionsMigration,
        false,
      );
      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: `${AlertTypes.smartTransactionsMigration}/disableAlertRequested`,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: `${AlertTypes.smartTransactionsMigration}/disableAlertSucceeded`,
      });
    });

    it('should handle errors', async () => {
      const mockDispatch = jest.fn();
      const error = new Error('Failed to disable alert');
      (
        setAlertEnabledness as jest.MockedFunction<typeof setAlertEnabledness>
      ).mockRejectedValueOnce(error);
      await dismissAndDisableAlert()(mockDispatch);

      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: `${AlertTypes.smartTransactionsMigration}/disableAlertRequested`,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: `${AlertTypes.smartTransactionsMigration}/disableAlertFailed`,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to disable Smart Transactions Migration alert:',
        error,
      );
    });
  });
});
