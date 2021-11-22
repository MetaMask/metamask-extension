import React from 'react';

import ConnectedSites from '.';

export default {
  title: 'Pages/ConnectedSites',
  id: __filename,
};

const PageSet = ({ children }) => {
  return children;
};

export const Base = () => {
  return (
    <PageSet>
      <ConnectedSites />
    </PageSet>
  );
};
