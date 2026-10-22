import React from 'react';
import { Navigate } from 'react-router-dom';
import { PerpsTab } from '../../components/app/perps/perps-tab';
import {
  BOTTOM_NAV_AB_TEST_KEY,
  BOTTOM_NAV_AB_TEST_VARIANTS,
  BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
} from '../../../shared/lib/ab-testing/configs/bottom-nav-bar';
import { useABTest } from '../../hooks/useABTest';
import { PERPS_HOME_TAB_ROUTE } from '../../hooks/perps/usePerpsHomeRoute';

// Page shown when the Perps tab in the bottom navigation bar is clicked
// Bottom navigation bar is shown in the A/B test coreExtensionUxCeux1141AbtestBottomNav
// The "Perps" heading is owned by PerpsView so it renders consistently in
// both this bottom-nav wrapper and the account-overview tab.
export const PerpsHomePage = () => {
  // Check if the bottom nav bar is enabled for this user.
  // If not, redirect to the home page with the perps tab selected.
  // This handles the case where a deep link navigates to /perps but the
  // user doesn't have the bottom nav bar, which would leave them stuck.
  const { variant, isActive } = useABTest(
    BOTTOM_NAV_AB_TEST_KEY,
    BOTTOM_NAV_AB_TEST_VARIANTS,
    BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: false },
  );

  // A missing assignment falls back to the control variant with isActive false.
  // Wait for a real assignment so a treatment user is not sent to /?tab=perps
  // before the bottom nav, and its Perps tab, are available.
  if (isActive && !variant.withBottomNavBar) {
    return <Navigate to={PERPS_HOME_TAB_ROUTE} replace />;
  }

  return (
    <div className="min-h-full" data-testid="perps-home-page">
      <PerpsTab />
    </div>
  );
};

export default PerpsHomePage;
