import { createSelector, type Selector } from 'reselect';
import { memoize } from 'lodash';
import {
  getDefaultComplianceControllerState,
  selectIsWalletBlocked as selectIsWalletBlockedFromComplianceState,
  type ComplianceControllerState,
} from '@metamask/compliance-controller';
import { getBooleanFeatureFlag } from '../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from './remote-feature-flags';

const DEFAULT_COMPLIANCE_ENABLED = false;
const DEFAULT_COMPLIANCE_STATE = getDefaultComplianceControllerState();

type ComplianceState = {
  metamask: Partial<ComplianceControllerState>;
};

export const getIsComplianceEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    getBooleanFeatureFlag(
      remoteFeatureFlags.complianceEnabled,
      DEFAULT_COMPLIANCE_ENABLED,
    ),
);

const getComplianceWalletComplianceStatusMap = (state: ComplianceState) =>
  state.metamask.walletComplianceStatusMap ??
  DEFAULT_COMPLIANCE_STATE.walletComplianceStatusMap;

const getComplianceLastCheckedAtValue = (state: ComplianceState) =>
  state.metamask.lastCheckedAt ?? DEFAULT_COMPLIANCE_STATE.lastCheckedAt;

const getComplianceControllerState = createSelector(
  getComplianceWalletComplianceStatusMap,
  getComplianceLastCheckedAtValue,
  (walletComplianceStatusMap, lastCheckedAt): ComplianceControllerState => ({
    walletComplianceStatusMap,
    lastCheckedAt,
  }),
);

const getSelectIsWalletBlocked = memoize((address: string) =>
  createSelector(getComplianceControllerState, (state) =>
    selectIsWalletBlockedFromComplianceState(address)(state),
  ),
);

export const selectIsWalletBlocked = (
  address: string,
): Selector<ComplianceState, boolean> => getSelectIsWalletBlocked(address);

const getSelectAreAnyWalletsBlocked = memoize(
  (addresses: string[]) =>
    createSelector(getComplianceControllerState, (state) => {
      if (addresses.length === 0) {
        return false;
      }

      return addresses.some((address) =>
        selectIsWalletBlockedFromComplianceState(address)(state),
      );
    }),
  (addresses: string[]) =>
    [...addresses].sort((a, b) => a.localeCompare(b)).join(','),
);

export const selectAreAnyWalletsBlocked = (
  addresses: string[],
): Selector<ComplianceState, boolean> =>
  getSelectAreAnyWalletsBlocked(addresses);

export const selectWalletComplianceStatusMap = createSelector(
  getComplianceControllerState,
  (state) => state.walletComplianceStatusMap,
);

export const selectComplianceLastCheckedAt = createSelector(
  getComplianceControllerState,
  (state) => state.lastCheckedAt,
);
