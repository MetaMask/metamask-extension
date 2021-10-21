import React from 'react';

import ConnectedSites from '.';

export default {
  title: 'Pages/Modal/Connected Sites',
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
