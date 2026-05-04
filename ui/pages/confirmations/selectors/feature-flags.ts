import { createSelector } from 'reselect';
import {
  DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE,
  EnforcedSimulationsFeatureFlag,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';

type ConfirmationsPayDappsFlag = {
  enabled?: boolean;
};

const selectConfirmationsPayDappsFlag = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    /* eslint-disable @typescript-eslint/naming-convention */
    (
      flags as unknown as {
        confirmations_pay_dapps?: ConfirmationsPayDappsFlag;
      }
    ).confirmations_pay_dapps,
  /* eslint-enable @typescript-eslint/naming-convention */
);

export const selectIsMetaMaskPayDappsEnabled = createSelector(
  selectConfirmationsPayDappsFlag,
  (flag): boolean => flag?.enabled ?? false,
);

const selectConfirmationsEnforcedSimulationsFlag = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    /* eslint-disable @typescript-eslint/naming-convention */
    (
      flags as unknown as {
        confirmations_enforced_simulations?: EnforcedSimulationsFeatureFlag;
      }
    ).confirmations_enforced_simulations,
  /* eslint-enable @typescript-eslint/naming-convention */
);

export const selectIsEnforcedSimulationsEnabled = createSelector(
  selectConfirmationsEnforcedSimulationsFlag,
  (flag): boolean => flag?.enabled ?? false,
);

export const selectEnforcedSimulationsSlippage = createSelector(
  selectConfirmationsEnforcedSimulationsFlag,
  (flag): number => flag?.slippage ?? DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE,
);
