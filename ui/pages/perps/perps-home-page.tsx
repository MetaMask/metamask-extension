import React from 'react';
import { PerpsTab } from '../../components/app/perps/perps-tab';

// Page shown when the Perps tab in the bottom navigation bar is clicked
// Bottom navigation bar is shown in the A/B test coreExtensionUxCeux1141AbtestBottomNav
// The "Perps" heading is owned by PerpsView so it renders consistently in
// both this bottom-nav wrapper and the account-overview tab.
export const PerpsHomePage = () => {
  return (
    <div className="min-h-full" data-testid="perps-home-page">
      <PerpsTab />
    </div>
  );
};

export default PerpsHomePage;
