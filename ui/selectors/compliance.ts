import { createSelector, lruMemoize, type Selector } from 'reselect';
import {
  getDefaultComplianceControllerState,
  selectAreAnyWalletsBlocked as coreSelectAreAnyWalletsBlocked,
  selectIsWalletBlocked as coreSelectIsWalletBlocked,
  type ComplianceControllerState,
} from '@metamask/compliance-controller';
import { getBooleanFeatureFlag } from '../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';

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

const getComplianceControllerState = (state: ComplianceState) => ({
  walletComplianceStatusMap:
    state.metamask.walletComplianceStatusMap ??
    DEFAULT_COMPLIANCE_STATE.walletComplianceStatusMap,
  lastCheckedAt:
    state.metamask.lastCheckedAt ?? DEFAULT_COMPLIANCE_STATE.lastCheckedAt,
});

const getSelectIsWalletBlocked = lruMemoize(
  (address: string) =>
    createSelector(getComplianceControllerState, (complianceState) =>
      coreSelectIsWalletBlocked(address)(complianceState),
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
    createSelector(getComplianceControllerState, (complianceState) =>
      coreSelectAreAnyWalletsBlocked(addresses)(complianceState),
    ),
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

export const selectWalletComplianceStatusMap = (state: ComplianceState) =>
  getComplianceControllerState(state).walletComplianceStatusMap;

export const selectComplianceLastCheckedAt = (state: ComplianceState) =>
  getComplianceControllerState(state).lastCheckedAt;
