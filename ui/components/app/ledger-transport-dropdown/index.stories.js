import React from 'react';
import LedgerTransportDropdown from '.';

export default {
  title: 'Components/App/LedgerTransportDropdown',
  id: __filename,
};

export const DefaultStory = (args) => {
  return <LedgerTransportDropdown {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {};
