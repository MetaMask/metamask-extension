import React from 'react';

import TokenAddress from './token-address';

export default {
  title: 'Components/APP/token-detected/TokenAddress',
  id: __filename,
};

export const DefaultStory = () => {
  return <TokenAddress address="0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f" />;
};

DefaultStory.storyName = 'Default';
