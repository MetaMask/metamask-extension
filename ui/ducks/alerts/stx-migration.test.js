import { AlertTypes } from '../../../shared/constants/alerts';
import * as actionConstants from '../../store/actionConstants';
import { ALERT_STATE } from './enums';
import reducer, {
  showSTXMigrationAlert,
  dismissSTXMigrationAlert,
  stxAlertIsOpen,
} from './stx-migration';

describe('STX Migration Alert', () => {
  const mockState = {
    metamask: {
      alerts: {
        [AlertTypes.stxMigration]: {
          state: ALERT_STATE.OPEN,
        },
      },
    },
  };

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
        metamask: {
          alerts: {
            [AlertTypes.stxMigration]: {
              state: ALERT_STATE.CLOSED,
            },
          },
        },
      };
      expect(stxAlertIsOpen(closedState)).toBe(false);
    });
  });
});
