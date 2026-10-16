import { TransactionMeta } from '@metamask/transaction-controller';
import { toChecksumHexAddress, toHex } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';

import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useGasSponsorshipWarningAlerts } from './useGasSponsorshipWarningAlerts';

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const DELEGATION_ADDRESS: Hex = '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b';
const BALANCE_15_MON = toHex(15n * 10n ** 18n);
const BALANCE_7_MON = toHex(7n * 10n ** 18n);
const VALUE_6_MON = toHex(6n * 10n ** 18n);

const BASE_CONFIRMATION = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_IDS.MONAD,
}) as TransactionMeta;

const CONFIRMATION_MOCK = {
  ...BASE_CONFIRMATION,
  txParams: {
    ...BASE_CONFIRMATION.txParams,
    from: ACCOUNT_ADDRESS,
    value: '0x0',
  },
} as TransactionMeta;

const RESERVE_ALERT = {
  actions: [
    {
      key: AlertActionKey.Buy,
      label: 'Buy MON',
    },
  ],
  field: RowAlertKey.EstimatedFee,
  isBlocking: true,
  isOpenModalOnClick: true,
  key: 'gasSponsorshipAlert',
  message:
    'This network requires keeping at least 10 MON in your account after the transaction. Smart accounts cannot go below this reserve.',
  reason: 'Reserve balance is required',
  severity: Severity.Danger,
  showArrow: false,
};

function buildMonadNetworkState(extraMetamask: Record<string, unknown> = {}) {
  return {
    metamask: {
      networkConfigurationsByChainId: {
        [CHAIN_IDS.MONAD]: {
          chainId: CHAIN_IDS.MONAD,
          name: 'Monad',
          nativeCurrency: 'MON',
          defaultRpcEndpointIndex: 0,
          ticker: 'MON',
          rpcEndpoints: [
            {
              type: 'custom',
              url: 'https://monad-mainnet.infura.io/v3/test',
              networkClientId: 'monad',
            },
          ],
          blockExplorerUrls: [],
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.MONAD]: {
          [toChecksumHexAddress(ACCOUNT_ADDRESS)]: {
            // 100 MON — enough that proactive value check does not fire by default
            balance: toHex(100n * 10n ** 18n),
          },
        },
      },
      ...extraMetamask,
    },
  };
}

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useGasSponsorshipWarningAlerts,
    state,
  );

  return response.result.current;
}

describe('useGasSponsorshipWarningAlerts', () => {
  it('returns no alerts if no confirmation', () => {
    expect(runHook(getMockConfirmState())).toEqual([]);
  });

  it('returns no alerts if call trace errors are missing', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            simulationData: {
              tokenBalanceChanges: [],
            },
          },
          buildMonadNetworkState(),
        ),
      ),
    ).toEqual([]);
  });

  it('returns warning alert for a sponsored transaction with a reserve violation', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            isGasFeeSponsored: true,
            simulationData: {
              callTraceErrors: ['reserve balance violation'],
              tokenBalanceChanges: [],
            },
          },
          buildMonadNetworkState(),
        ),
      ),
    ).toEqual([RESERVE_ALERT]);
  });

  it('returns warning alert for reserve balance violations', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          isGasFeeSponsored: false,
          simulationData: {
            callTraceErrors: ['reserve balance violation'],
            tokenBalanceChanges: [],
          },
        },
        buildMonadNetworkState(),
      ),
    );

    expect(alerts).toEqual([RESERVE_ALERT]);
  });

  it('returns warning alert when simulationFails.reason mentions reserve balance', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          isGasFeeSponsored: false,
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
            debug: {},
          },
        },
        buildMonadNetworkState(),
      ),
    );

    expect(alerts).toEqual([RESERVE_ALERT]);
  });

  it('returns warning alert when a delegated account value spend would leave less than 10 MON', () => {
    // 15 MON balance, sending 6 MON value → 9 MON remaining
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          delegationAddress: DELEGATION_ADDRESS,
          isGasFeeSponsored: false,
          txParams: {
            ...CONFIRMATION_MOCK.txParams,
            value: VALUE_6_MON,
          },
        },
        buildMonadNetworkState({
          accountsByChainId: {
            [CHAIN_IDS.MONAD]: {
              [toChecksumHexAddress(ACCOUNT_ADDRESS)]: {
                balance: BALANCE_15_MON,
              },
            },
          },
        }),
      ),
    );
    expect(alerts).toEqual([RESERVE_ALERT]);
  });

  it('returns no alerts when an undelegated account value spend would leave less than 10 MON', () => {
    // Undelegated EOAs can dip below the reserve (emptying transaction), and
    // `delegationAddress` is undefined for them.
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          delegationAddress: undefined,
          isGasFeeSponsored: false,
          txParams: {
            ...CONFIRMATION_MOCK.txParams,
            value: VALUE_6_MON,
          },
        },
        buildMonadNetworkState({
          accountsByChainId: {
            [CHAIN_IDS.MONAD]: {
              [toChecksumHexAddress(ACCOUNT_ADDRESS)]: {
                balance: BALANCE_15_MON,
              },
            },
          },
        }),
      ),
    );
    expect(alerts).toEqual([]);
  });

  it('returns no alerts for a gas-only call from an undelegated account already under 10 MON', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          delegationAddress: undefined,
          isGasFeeSponsored: false,
          txParams: {
            ...CONFIRMATION_MOCK.txParams,
            value: '0x0',
          },
        },
        buildMonadNetworkState({
          accountsByChainId: {
            [CHAIN_IDS.MONAD]: {
              [toChecksumHexAddress(ACCOUNT_ADDRESS)]: {
                balance: BALANCE_7_MON,
              },
            },
          },
        }),
      ),
    );
    expect(alerts).toEqual([]);
  });

  it('returns no alerts for a zero-value delegated transaction already under 10 MON', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          delegationAddress: DELEGATION_ADDRESS,
          isGasFeeSponsored: true,
        },
        buildMonadNetworkState({
          accountsByChainId: {
            [CHAIN_IDS.MONAD]: {
              [toChecksumHexAddress(ACCOUNT_ADDRESS)]: {
                balance: BALANCE_7_MON,
              },
            },
          },
        }),
      ),
    );
    expect(alerts).toEqual([]);
  });

  it('returns warning alert for an undelegated account when simulation reports a reserve violation', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          delegationAddress: undefined,
          isGasFeeSponsored: false,
          simulationData: {
            callTraceErrors: ['reserve balance violation'],
            tokenBalanceChanges: [],
          },
        },
        buildMonadNetworkState({
          accountsByChainId: {
            [CHAIN_IDS.MONAD]: {
              [toChecksumHexAddress(ACCOUNT_ADDRESS)]: {
                balance: BALANCE_15_MON,
              },
            },
          },
        }),
      ),
    );
    expect(alerts).toEqual([RESERVE_ALERT]);
  });
});
