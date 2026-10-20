import React from 'react';
import { PerpsTab } from '../../components/app/perps/perps-tab';

// Page shown when the Perps tab in the bottom navigation bar is clicked.
// The "Perps" heading is owned by PerpsView.
export const PerpsHomePage = () => {
  return (
    <div className="min-h-full" data-testid="perps-home-page">
      <PerpsTab />
    </div>
  );
};

export default PerpsHomePage;
