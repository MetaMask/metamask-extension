import { createSelector } from 'reselect';
import {
  getEnforcedSimulationsSlippage,
  getIsEnforcedSimulationsEnabled,
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

export const selectIsEnforcedSimulationsEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): boolean =>
    getIsEnforcedSimulationsEnabled({ remoteFeatureFlags }),
);

export const selectEnforcedSimulationsSlippage = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): number =>
    getEnforcedSimulationsSlippage({ remoteFeatureFlags }),
);
