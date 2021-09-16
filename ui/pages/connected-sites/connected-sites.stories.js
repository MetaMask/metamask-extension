import React from 'react';

import ConnectedSites from '.';

export default {
  title: 'Connected Sites',
  id: __filename,
};

const PageSet = ({ children }) => children;

export const ConnectedSitesComponent = () => (
  <PageSet>
    <ConnectedSites />
  </PageSet>
);
