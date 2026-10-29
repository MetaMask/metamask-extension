// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../helpers/constants/design-system';
import {
  useConfirmationAlertMetrics,
  ALERTS_NAME_METRICS,
} from './useConfirmationAlertMetrics';
import * as transactionEventFragmentHook from './useTransactionEventFragment';
import { AlertsName } from './alerts/constants';

jest.mock('./useTransactionEventFragment');

const mockUpdateTransactionEventFragment = jest.fn();

const OWNER_ID_MOCK = '123';
const KEY_ALERT_KEY_MOCK = 'Key';
const ALERT_MESSAGE_MOCK = 'Alert 1';
const ALERT_NAME_METRICS_MOCK = ALERTS_NAME_METRICS[AlertsName.GasFeeLow];
const UUID_ALERT_KEY_MOCK = '550e8400-e29b-41d4-a716-446655440000';
const alertsMock = [
  {
    key: AlertsName.GasFeeLow,
    field: KEY_ALERT_KEY_MOCK,
    severity: Severity.Warning,
    message: ALERT_MESSAGE_MOCK,
    reason: 'Reason 1',
    alertDetails: ['Detail 1', 'Detail 2'],
  },
  {
    key: UUID_ALERT_KEY_MOCK,
    field: 'UUIDField',
    severity: Severity.Warning,
    message: 'UUID Alert',
    reason: 'Reason 2',
    alertDetails: ['Detail A', 'Detail B'],
  },
];

const NON_CONTRACT_ALERT_MOCK = {
  key: AlertsName.HexDataWhileInteractingWithNonContractAddress,
  field: 'InteractingWith',
  severity: Severity.Warning,
  message: 'Non-contract address',
  reason: 'Reason 3',
};

const contractInteraction = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
});

/**
 * Builds confirm state for a transaction carrying the given alerts.
 *
 * @param alerts - The alerts to attach to the confirmation.
 * @param confirmationOverrides - Overrides applied to the base confirmation.
 * @returns The mock confirm state.
 */
function buildState(
  alerts: Record<string, unknown>[],
  confirmationOverrides: Partial<TransactionMeta> = {},
) {
  return getMockConfirmStateForTransaction(
    {
      ...contractInteraction,
      ...confirmationOverrides,
      id: OWNER_ID_MOCK,
    } as TransactionMeta,
    {
      metamask: {},
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: alerts },
        confirmed: { [OWNER_ID_MOCK]: {} },
      },
    },
  );
}

const MONEY_ACCOUNT_DEPOSIT_OVERRIDES = {
  type: TransactionType.batch,
  nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
} as unknown as Partial<TransactionMeta>;

const STATE_MOCK = getMockConfirmStateForTransaction(
  { ...contractInteraction, id: OWNER_ID_MOCK } as TransactionMeta,
  {
    metamask: {},
    confirmAlerts: {
      alerts: { [OWNER_ID_MOCK]: alertsMock },
      confirmed: {
        [OWNER_ID_MOCK]: {
          [KEY_ALERT_KEY_MOCK]: false,
          [UUID_ALERT_KEY_MOCK]: false,
        },
      },
    },
  },
);

const EXPECTED_PROPERTIES_BASE = {
  alert_action_clicked: [],
  alert_key_clicked: [],
  alert_resolved: [],
  alert_resolved_count: 0,
  alert_triggered: [
    ALERT_NAME_METRICS_MOCK,
    ALERTS_NAME_METRICS[AlertsName.Blockaid],
  ],
  alert_triggered_count: 2,
  alert_visualized: [],
  alert_visualized_count: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  (
    transactionEventFragmentHook.useTransactionEventFragment as jest.Mock
  ).mockReturnValue({
    updateTransactionEventFragment: mockUpdateTransactionEventFragment,
  });
});

describe('useConfirmationAlertMetrics', () => {
  it('reports an unreadable Perps balance under its own metrics name', () => {
    // The key was split from InsufficientPayTokenBalance so alert_triggered /
    // alert_resolved stop conflating the two. `getAlertName` falls back to the
    // raw key, so dropping or renaming the entry does not fail anything — it
    // just silently changes the metric's shape mid-flight, emitting the
    // camelCase `perpsWithdrawBalanceUnavailable` among snake_case names.
    expect(
      ALERTS_NAME_METRICS[AlertsName.PerpsWithdrawBalanceUnavailable],
    ).toBe('perps_withdraw_balance_unavailable');
  });

  it('initializes metrics properties correctly', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationAlertMetrics(),
      STATE_MOCK,
    );

    expect(result.current.trackAlertRender).toBeInstanceOf(Function);
    expect(result.current.trackInlineAlertClicked).toBeInstanceOf(Function);
    expect(result.current.trackAlertActionClicked).toBeInstanceOf(Function);
  });

  it('calls updateTransactionEventFragment with correct properties on initialization', () => {
    renderHookWithConfirmContextProvider(
      () => useConfirmationAlertMetrics(),
      STATE_MOCK,
    );

    expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
      { properties: EXPECTED_PROPERTIES_BASE },
      OWNER_ID_MOCK,
    );
  });

  const testCases = [
    {
      description: 'updates metrics properties when trackAlertRender is called',
      alertKey: AlertsName.GasFeeLow,
      action: 'trackAlertRender',
      expectedProperties: {
        alert_visualized: [ALERT_NAME_METRICS_MOCK],
        alert_visualized_count: 1,
      },
    },
    {
      description:
        'updates metrics properties when trackInlineAlertClicked is called',
      alertKey: AlertsName.GasFeeLow,
      action: 'trackInlineAlertClicked',
      expectedProperties: {
        alert_key_clicked: [ALERT_NAME_METRICS_MOCK],
      },
    },
    {
      description:
        'updates metrics properties when trackAlertActionClicked is called',
      alertKey: AlertsName.GasFeeLow,
      action: 'trackAlertActionClicked',
      expectedProperties: {
        alert_action_clicked: [ALERT_NAME_METRICS_MOCK],
      },
    },
    {
      description:
        'updates metrics properties when receives alertKey as a valid UUID',
      alertKey: UUID_ALERT_KEY_MOCK,
      action: 'trackAlertRender',
      expectedProperties: {
        alert_visualized: [ALERTS_NAME_METRICS[AlertsName.Blockaid]],
        alert_visualized_count: 1,
      },
    },
  ];

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(testCases)(
    '$description',
    ({
      alertKey,
      action,
      expectedProperties,
    }: {
      description: string;
      alertKey: string;
      action:
        | 'trackAlertRender'
        | 'trackInlineAlertClicked'
        | 'trackAlertActionClicked';
      expectedProperties: Record<string, unknown>;
    }) => {
      const finalExpectedProperties = {
        ...EXPECTED_PROPERTIES_BASE,
        ...expectedProperties,
      };

      const { result } = renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        STATE_MOCK,
      );

      act(() => {
        result.current[action](alertKey);
      });

      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
        { properties: finalExpectedProperties },
        OWNER_ID_MOCK,
      );
    },
  );

  describe('hexDataWhileInteractingWithNonContractAddress exclusion', () => {
    it('omits the alert from a money account deposit batch and keeps counts consistent', () => {
      renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        buildState(
          [alertsMock[0], NON_CONTRACT_ALERT_MOCK],
          MONEY_ACCOUNT_DEPOSIT_OVERRIDES,
        ),
      );

      const { properties } =
        mockUpdateTransactionEventFragment.mock.calls.at(-1)[0];

      expect(properties.alert_triggered).toStrictEqual([
        ALERT_NAME_METRICS_MOCK,
      ]);
      expect(properties.alert_triggered_count).toBe(
        properties.alert_triggered.length,
      );
    });

    it('omits the alert when the money account deposit type is top-level', () => {
      renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        buildState([alertsMock[0], NON_CONTRACT_ALERT_MOCK], {
          type: TransactionType.moneyAccountDeposit,
        } as Partial<TransactionMeta>),
      );

      const { properties } =
        mockUpdateTransactionEventFragment.mock.calls.at(-1)[0];

      expect(properties.alert_triggered).toStrictEqual([
        ALERT_NAME_METRICS_MOCK,
      ]);
    });

    it('reports no alert properties when the excluded alert is the only one', () => {
      renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        buildState([NON_CONTRACT_ALERT_MOCK], MONEY_ACCOUNT_DEPOSIT_OVERRIDES),
      );

      expect(mockUpdateTransactionEventFragment).not.toHaveBeenCalled();
    });

    it('does not record the excluded alert via trackAlertRender', () => {
      const { result } = renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        buildState(
          [alertsMock[0], NON_CONTRACT_ALERT_MOCK],
          MONEY_ACCOUNT_DEPOSIT_OVERRIDES,
        ),
      );

      act(() => {
        result.current.trackAlertRender(
          AlertsName.HexDataWhileInteractingWithNonContractAddress,
        );
        result.current.trackInlineAlertClicked(
          AlertsName.HexDataWhileInteractingWithNonContractAddress,
        );
        result.current.trackAlertActionClicked(
          AlertsName.HexDataWhileInteractingWithNonContractAddress,
        );
      });

      const { properties } =
        mockUpdateTransactionEventFragment.mock.calls.at(-1)[0];

      expect(properties.alert_visualized).toStrictEqual([]);
      expect(properties.alert_visualized_count).toBe(0);
      expect(properties.alert_key_clicked).toStrictEqual([]);
      expect(properties.alert_action_clicked).toStrictEqual([]);
    });

    it('still reports the alert for a non-money-account transaction', () => {
      const { result } = renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        buildState([alertsMock[0], NON_CONTRACT_ALERT_MOCK]),
      );

      act(() => {
        result.current.trackAlertRender(
          AlertsName.HexDataWhileInteractingWithNonContractAddress,
        );
      });

      const { properties } =
        mockUpdateTransactionEventFragment.mock.calls.at(-1)[0];

      expect(properties.alert_triggered).toStrictEqual([
        ALERT_NAME_METRICS_MOCK,
        AlertsName.HexDataWhileInteractingWithNonContractAddress,
      ]);
      expect(properties.alert_triggered_count).toBe(2);
      expect(properties.alert_visualized).toStrictEqual([
        AlertsName.HexDataWhileInteractingWithNonContractAddress,
      ]);
    });

    it('keeps other alerts for a money account deposit batch', () => {
      renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        buildState([NON_CONTRACT_ALERT_MOCK, alertsMock[1]], {
          ...MONEY_ACCOUNT_DEPOSIT_OVERRIDES,
        }),
      );

      const { properties } =
        mockUpdateTransactionEventFragment.mock.calls.at(-1)[0];

      expect(properties.alert_triggered).toStrictEqual([
        ALERTS_NAME_METRICS[AlertsName.Blockaid],
      ]);
      expect(properties.alert_triggered_count).toBe(1);
    });
  });
});
