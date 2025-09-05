import React from 'react';

import AdvancedGasControls from '.';

export default {
  title: 'Pages/Confirmations/Components/AdvancedGasControls',
};

export const DefaultStory = () => {
  return (
    <div style={{ width: '600px' }}>
      <AdvancedGasControls />
    </div>
  );
};

DefaultStory.storyName = 'Default';
