import React from 'react';

import ConnectedSites from '.';

export default {
  title: 'Connected Sites',
  id: __filename,
};

const PageSet = ({ children }) => {
  return children;
};

export const ConnectedSitesComponent = () => {
  return (
    <PageSet>
      <ConnectedSites />
    </PageSet>
  );
};
