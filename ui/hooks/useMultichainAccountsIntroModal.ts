import { useState, useEffect } from 'react';
import { lt as semverLt } from 'semver';
import { useAppSelector } from '../store/store';
import { getIsMultichainAccountsState2Enabled } from '../selectors/multichain-accounts/feature-flags';
import { getLastUpdatedFromVersion } from '../selectors/selectors';
import { DEFAULT_ROUTE } from '../helpers/constants/routes';

/**
 * Hook to manage the multichain accounts intro modal display logic
 * Keeps the routes component clean by encapsulating modal state logic
 *
 * @param isUnlocked - Whether the wallet is currently unlocked
 * @param location - Router location object containing pathname
 * @param location.pathname - Current route pathname
 * @returns Object containing modal state and setter function
 */
export function useMultichainAccountsIntroModal(
  isUnlocked: boolean,
  location: { pathname: string },
) {
  const [showMultichainIntroModal, setShowMultichainIntroModal] =
    useState(false);

  const isMultichainAccountsState2Enabled = useAppSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const hasShownMultichainAccountsIntroModal = useAppSelector(
    (state) => state.metamask.hasShownMultichainAccountsIntroModal,
  );

  const lastUpdatedAt = useAppSelector((state) => state.metamask.lastUpdatedAt);
  const lastUpdatedFromVersion = useAppSelector(getLastUpdatedFromVersion);

  useEffect(() => {
    // Only show modal on the main wallet/home route
    const isMainWalletArea = location.pathname === DEFAULT_ROUTE;

    // Check if this is an upgrade from a version lower than 13.5.0
    const isUpgradeFromLowerThanBip44Version = Boolean(
      lastUpdatedFromVersion && semverLt(lastUpdatedFromVersion, '13.5.0'),
    );

    // Show modal only for upgrades from versions < 13.5.0
    const shouldShowModal =
      isUnlocked &&
      isMultichainAccountsState2Enabled &&
      !hasShownMultichainAccountsIntroModal &&
      lastUpdatedAt !== null && // null = fresh install, timestamp = upgrade
      isUpgradeFromLowerThanBip44Version &&
      isMainWalletArea;

    setShowMultichainIntroModal(shouldShowModal);
  }, [
    isUnlocked,
    isMultichainAccountsState2Enabled,
    hasShownMultichainAccountsIntroModal,
    lastUpdatedAt,
    lastUpdatedFromVersion,
    location.pathname,
  ]);

  return {
    showMultichainIntroModal,
    setShowMultichainIntroModal,
  };
}
