import { createSelector, lruMemoize, type Selector } from 'reselect';
import {
  getDefaultComplianceControllerState,
  type ComplianceControllerState,
} from '@metamask/compliance-controller';
import { getBooleanFeatureFlag } from '../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from './remote-feature-flags';

const DEFAULT_COMPLIANCE_ENABLED = false;
const DEFAULT_COMPLIANCE_STATE = getDefaultComplianceControllerState();
const PARAMETERIZED_SELECTOR_CACHE_SIZE = 20;

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

const getSelectIsWalletBlocked = lruMemoize(
  (address: string) =>
    createSelector(
      getComplianceWalletComplianceStatusMap,
      (walletComplianceStatusMap) =>
        walletComplianceStatusMap[address]?.blocked ?? false,
    ),
  { maxSize: PARAMETERIZED_SELECTOR_CACHE_SIZE },
);

export const selectIsWalletBlocked = (
  address: string,
): Selector<ComplianceState, boolean> => getSelectIsWalletBlocked(address);

const getAddressCacheKey = (addresses: string[]) =>
  [...addresses].sort((a, b) => a.localeCompare(b)).join(',');

const getSelectAreAnyWalletsBlocked = lruMemoize(
  (addresses: string[]) =>
    createSelector(getComplianceWalletComplianceStatusMap, (statusMap) => {
      if (addresses.length === 0) {
        return false;
      }

      return addresses.some((address) => statusMap[address]?.blocked ?? false);
    }),
  {
    equalityCheck: (firstAddressList, secondAddressList) =>
      getAddressCacheKey(firstAddressList) ===
      getAddressCacheKey(secondAddressList),
    maxSize: PARAMETERIZED_SELECTOR_CACHE_SIZE,
  },
);

export const selectAreAnyWalletsBlocked = (
  addresses: string[],
): Selector<ComplianceState, boolean> =>
  getSelectAreAnyWalletsBlocked(addresses);

export const selectWalletComplianceStatusMap =
  getComplianceWalletComplianceStatusMap;

export const selectComplianceLastCheckedAt = getComplianceLastCheckedAtValue;
