import { useState, useEffect } from 'react';
import { lt as semverLt, parse as semverParse } from 'semver';
import { useAppSelector } from '../store/store';
import { DEFAULT_ROUTE } from '../helpers/constants/routes';

// Version threshold for BIP-44 multichain accounts introduction
export const BIP44_ACCOUNTS_INTRODUCTION_VERSION = '13.5.0';

/**
 * Hook to manage the multichain accounts intro modal display logic
 * Keeps the routes component clean by encapsulating modal state logic
 *
 * @deprecated BIP-44 has been enabled and is stable, this hook is no longer needed
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

  const hasShownMultichainAccountsIntroModal = useAppSelector(
    (state) => state.metamask.hasShownMultichainAccountsIntroModal,
  );

  const lastUpdatedAt = useAppSelector((state) => state.metamask.lastUpdatedAt);
  const lastUpdatedFromVersion = useAppSelector(
    (state) => state.metamask.previousAppVersion,
  );
  const currentAppVersion = useAppSelector(
    (state) => state.metamask.currentAppVersion,
  );

  useEffect(() => {
    // Only show modal on the main wallet/home route
    const isMainWalletArea = location.pathname === DEFAULT_ROUTE;

    // Defensive check: If the current version is >= BIP-44 introduction version,
    // never show the modal regardless of previous version state
    const parsedCurrentVersion = semverParse(currentAppVersion);
    const strippedCurrentVersion = parsedCurrentVersion
      ? `${parsedCurrentVersion.major}.${parsedCurrentVersion.minor}.${parsedCurrentVersion.patch}`
      : null;

    const isCurrentVersionAboveThreshold = Boolean(
      strippedCurrentVersion &&
        !semverLt(strippedCurrentVersion, BIP44_ACCOUNTS_INTRODUCTION_VERSION),
    );

    const parsedLastVersion = semverParse(lastUpdatedFromVersion);
    // Strip prerelease versions as they just indicate build types.
    const strippedLastVersion = parsedLastVersion
      ? `${parsedLastVersion.major}.${parsedLastVersion.minor}.${parsedLastVersion.patch}`
      : null;

    // Additional safeguard: If we can't parse the previous version properly,
    // default to NOT showing the modal to avoid unexpected behavior
    const isUpgradeFromLowerThanBip44Version = Boolean(
      strippedLastVersion &&
        semverLt(strippedLastVersion, BIP44_ACCOUNTS_INTRODUCTION_VERSION),
    );

    // Edge case protection: If lastUpdatedFromVersion is empty string or other
    // falsy value that might indicate corrupted state, don't show modal
    const hasValidPreviousVersion = Boolean(lastUpdatedFromVersion?.trim());

    // Show modal only for upgrades from versions < BIP-44 introduction version
    // BUT never show if current version is already >= threshold (defensive guard)
    const shouldShowModal =
      isUnlocked &&
      !hasShownMultichainAccountsIntroModal &&
      lastUpdatedAt !== null && // null = fresh install, timestamp = upgrade
      hasValidPreviousVersion && // Must have valid previous version data
      isUpgradeFromLowerThanBip44Version &&
      !isCurrentVersionAboveThreshold && // Defensive guard against showing on versions >= 13.5.0
      isMainWalletArea;

    setShowMultichainIntroModal(shouldShowModal);
  }, [
    isUnlocked,
    hasShownMultichainAccountsIntroModal,
    lastUpdatedAt,
    lastUpdatedFromVersion,
    currentAppVersion,
    location.pathname,
  ]);

  return {
    showMultichainIntroModal,
    setShowMultichainIntroModal,
  };
}
