import { AlertTypes } from '../../../shared/constants/alerts';
import * as actionConstants from '../../store/actionConstants';
import configureStore from '../../store/store';
import { setAlertEnabledness } from '../../store/actions';
import reducer, {
  showSTXMigrationAlert,
  dismissSTXMigrationAlert,
  dismissAndDisableAlert,
  stxAlertIsOpen,
} from './stx-migration';
import { ALERT_STATE } from './enums';

jest.mock('../../store/actions', () => ({
  setAlertEnabledness: jest.fn().mockResolvedValue(),
}));

jest.mock('../../../store/store', () => {
  return jest.fn().mockImplementation((state) => ({
    getState: () => state,
    dispatch: jest.fn(),
  }));
});

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

  it('should handle showSTXMigrationAlert', () => {
    const result = reducer(
      { state: ALERT_STATE.CLOSED },
      showSTXMigrationAlert(),
    );
    expect(result.state).toStrictEqual(ALERT_STATE.OPEN);
  });

  it('should handle dismissSTXMigrationAlert', () => {
    const result = reducer(
      { state: ALERT_STATE.OPEN },
      dismissSTXMigrationAlert(),
    );
    expect(result.state).toStrictEqual(ALERT_STATE.CLOSED);
  });

  it('opens alert when smartTransactionsOptInStatus becomes true', () => {
    const result = reducer(
      { state: ALERT_STATE.CLOSED },
      {
        type: actionConstants.UPDATE_METAMASK_STATE,
        value: {
          preferences: {
            smartTransactionsOptInStatus: true,
          },
        },
      },
    );
    expect(result.state).toStrictEqual(ALERT_STATE.OPEN);
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
    it('should update alert state and preferences when disabling alert', async () => {
      const store = configureStore(mockState);
      await store.dispatch(dismissAndDisableAlert());

      expect(setAlertEnabledness).toHaveBeenCalledWith(
        AlertTypes.stxMigration,
        false,
      );
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('disableAlertSucceeded'),
        }),
      );
    });

    it('should handle errors when disabling alert fails', async () => {
      const error = new Error('Failed to disable alert');
      setAlertEnabledness.mockRejectedValueOnce(error);

      const store = configureStore(mockState);
      await store.dispatch(dismissAndDisableAlert());

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('disableAlertFailed'),
        }),
      );
    });

    it('should transition through loading state', async () => {
      const store = configureStore(mockState);
      const dispatchPromise = store.dispatch(dismissAndDisableAlert());

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('disableAlertRequested'),
        }),
      );

      await dispatchPromise;

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('disableAlertSucceeded'),
        }),
      );
    });
  });
});
