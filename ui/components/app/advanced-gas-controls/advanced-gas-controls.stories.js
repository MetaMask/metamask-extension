import React from 'react';

import AdvancedGasControls from '.';

export default {
  title: 'Components/App/AdvancedGasControls',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <div style={{ width: '600px' }}>
      <AdvancedGasControls />
    </div>
  );
};

DefaultStory.storyName = 'Default';
