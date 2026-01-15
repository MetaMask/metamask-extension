import { TransactionMeta } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useGasSponsorshipWarningAlerts } from './useGasSponsorshipWarningAlerts';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_IDS.MONAD,
}) as TransactionMeta;

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
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationData: {
            tokenBalanceChanges: [],
          },
        }),
      ),
    ).toEqual([]);
  });

  it('returns no alerts if the transaction is sponsored', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          isGasFeeSponsored: true,
          simulationData: {
            callTraceErrors: ['reserve balance violation'],
            tokenBalanceChanges: [],
          },
        }),
      ),
    ).toEqual([]);
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
        {
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
                    url: 'https://testnet-rpc.monad.xyz',
                    networkClientId: 'monad',
                  },
                ],
                blockExplorerUrls: [],
              },
            },
          },
        },
      ),
    );

    expect(alerts).toEqual([
      {
        field: RowAlertKey.EstimatedFee,
        inlineAlertText:
          'Gas sponsorship is unavailable because this transaction must leave at least 10 MON in your account.',
        isOpenModalOnClick: false,
        key: 'gasSponsorshipReserveBalanceWarning',
        message:
          'Gas sponsorship is unavailable because this transaction must leave at least 10 MON in your account.',
        severity: Severity.Warning,
        showArrow: false,
      },
    ]);
  });
});
