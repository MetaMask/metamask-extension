import { useState, useEffect } from 'react';
import { lt as semverLt, parse as semverParse } from 'semver';
import { useAppSelector } from '../store/store';
import { getIsMultichainAccountsState2Enabled } from '../selectors/multichain-accounts/feature-flags';
import { DEFAULT_ROUTE } from '../helpers/constants/routes';

// Version threshold for BIP-44 multichain accounts introduction
export const BIP44_ACCOUNTS_INTRODUCTION_VERSION = '13.5.0';

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
  const lastUpdatedFromVersion = useAppSelector(
    (state) => state.metamask.previousAppVersion,
  );

  useEffect(() => {
    // Only show modal on the main wallet/home route
    const isMainWalletArea = location.pathname === DEFAULT_ROUTE;

    const parsedLastVersion = semverParse(lastUpdatedFromVersion);
    // Strip prerelease versions as they just indicate build types.
    const strippedLastVersion = parsedLastVersion
      ? `${parsedLastVersion.major}.${parsedLastVersion.minor}.${parsedLastVersion.patch}`
      : null;

    // Check if this is an upgrade from a version lower than BIP-44 introduction version
    const isUpgradeFromLowerThanBip44Version = Boolean(
      strippedLastVersion &&
        semverLt(strippedLastVersion, BIP44_ACCOUNTS_INTRODUCTION_VERSION),
    );

    // Show modal only for upgrades from versions < BIP-44 introduction version
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
