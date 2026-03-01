import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';

type ConfirmationsPayFeatureFlags = {
  dappsEnabled?: boolean;
};

const selectConfirmationsPayFeatureFlags = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (flags as unknown as { confirmations_pay?: ConfirmationsPayFeatureFlags })
      .confirmations_pay,
);

export const selectIsMetaMaskPayDappsEnabled = createSelector(
  selectConfirmationsPayFeatureFlags,
  (flags): boolean => flags?.dappsEnabled ?? false,
);
