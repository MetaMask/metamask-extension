import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../shared/constants/app';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import { getIsWalletResetInProgress } from '../ducks/metamask/metamask';

/**
 * Closes the side panel when a wallet reset is in progress and the wallet
 * becomes unlocked on another MetaMask surface. The side panel keeps its own
 * Redux store, so an unlocked-but-not-onboarded panel can race second-pass
 * onboarding and trigger the onboarding lock trap.
 */
export function useCloseSidePanelOnWalletReset(): void {
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);

  useEffect(() => {
    if (
      getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL &&
      isWalletResetInProgress
    ) {
      window.close();
    }
  }, [isWalletResetInProgress]);
}
